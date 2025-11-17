const puppeteer = require('puppeteer');
const axios = require('axios');

const DASHBOARD_URL = process.env.DASHBOARD_URL;
const POWER_AUTOMATE_URL = process.env.POWER_AUTOMATE_URL;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;

const GERENCIAS_ALVO = [
    "SP SUL", 
    "SP NORTE", 
    "FERRONORTE", 
    "MALHA CENTRAL"
]; 
// -------------------------------------------

async function run() {
    if (!DASHBOARD_URL || !POWER_AUTOMATE_URL || !RECIPIENT_EMAIL) {
        console.error("ERRO: Variáveis de ambiente (Secrets) faltando.");
        process.exit(1);
    }

    console.log('Iniciando navegador (Puppeteer)...');
    
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log('Acessando Painel...');
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0', timeout: 90000 });
        
        await page.waitForSelector('#gerencia', { timeout: 15000 });

        let htmlEmailBody = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="border-bottom: 2px solid #005ca9; padding-bottom: 10px;">
                    Relatório Diário de Intervalos - Rumo
                </h2>
                <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                <p>Segue abaixo o status consolidado por gerência:</p>
            </div>
        `;

        console.log('Iniciando captura na ordem solicitada...');

        for (const gerencia of GERENCIAS_ALVO) {
            console.log(`>> Processando: ${gerencia}`);

            try {
                await page.select('#gerencia', gerencia);

                await new Promise(r => setTimeout(r, 2000));

                const screenshotBase64 = await page.screenshot({
                    encoding: 'base64',
                    fullPage: true 
                });

                htmlEmailBody += `
                    <div style="margin-top: 30px; margin-bottom: 40px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                        <h3 style="background-color: #f4f4f4; padding: 10px; margin-top: 0; border-left: 5px solid #005ca9;">
                            ${gerencia}
                        </h3>
                        <img src="data:image/png;base64,${screenshotBase64}" alt="Painel ${gerencia}" style="width: 100%; max-width: 100%; height: auto; display: block;" />
                    </div>
                `;
            } catch (innerError) {
                console.error(`Erro ao capturar ${gerencia}:`, innerError.message);
                htmlEmailBody += `<p style="color: red;">Não foi possível capturar a imagem de <strong>${gerencia}</strong>.</p>`;
            }
        }

        htmlEmailBody += `<p style="font-size: 12px; color: #999; margin-top: 50px;">Relatório automático - GitHub Actions & Power Automate.</p>`;

        console.log('Enviando pacote consolidado...');

        const payload = {
            recipient: RECIPIENT_EMAIL,
            subject: `Painel Intervalos - ${new Date().toLocaleDateString('pt-BR')}`,
            htmlContent: htmlEmailBody 
        };

        await axios.post(POWER_AUTOMATE_URL, payload, {
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        console.log('Envio realizado com sucesso!');

    } catch (error) {
        console.error("Erro crítico:", error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

run();