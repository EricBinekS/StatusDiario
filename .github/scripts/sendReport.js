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

async function run() {
    if (!DASHBOARD_URL || !POWER_AUTOMATE_URL || !RECIPIENT_EMAIL) {
        console.error("ERRO: Variáveis de ambiente faltando.");
        process.exit(1);
    }

    console.log('Iniciando navegador...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log('Acessando Painel...');
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 90000 });

        console.log(`URL atual após carregamento: ${page.url()}`);

        try {
            await page.waitForSelector('#gerencia', { timeout: 60000 });
        } catch (selectorError) {
            console.error('ERRO CRÍTICO: O seletor #gerencia não apareceu.');
            console.log('Tirando print da tela de erro...');
            
            await page.screenshot({ path: 'error-screenshot.png', fullPage: true });

            throw selectorError;
        }

        let htmlEmailBody = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="border-bottom: 2px solid #005ca9; padding-bottom: 10px;">Relatório Diário de Intervalos</h2>
                <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                <p>Status consolidado por gerência:</p>
            </div>
        `;

        for (const gerencia of GERENCIAS_ALVO) {
            console.log(`>> Processando: ${gerencia}`);
            try {
                await page.select('#gerencia', gerencia);
                await new Promise(r => setTimeout(r, 2000));

                const mainElement = await page.$('main');
                if (!mainElement) throw new Error("Tag <main> não encontrada");

                const screenshotBase64 = await mainElement.screenshot({ encoding: 'base64' });

                htmlEmailBody += `
                    <div style="margin-top: 30px; margin-bottom: 40px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                        <h3 style="background-color: #f4f4f4; padding: 10px; margin-top: 0; border-left: 5px solid #005ca9;">${gerencia}</h3>
                        <img src="data:image/png;base64,${screenshotBase64}" style="width: 100%; display: block;" />
                    </div>
                `;
            } catch (e) {
                console.error(`Erro em ${gerencia}:`, e.message);
                htmlEmailBody += `<p style="color:red">Erro ao capturar: ${gerencia}</p>`;
            }
        }

        console.log('Enviando para Power Automate...');
        await axios.post(POWER_AUTOMATE_URL, {
            recipient: RECIPIENT_EMAIL,
            subject: `Painel Intervalos - ${new Date().toLocaleDateString('pt-BR')}`,
            htmlContent: htmlEmailBody
        }, { maxBodyLength: Infinity, maxContentLength: Infinity });

        console.log('Sucesso!');
    } catch (error) {
        console.error("Erro fatal:", error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}
run();