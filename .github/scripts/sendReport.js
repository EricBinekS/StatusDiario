const puppeteer = require('puppeteer');
const axios = require('axios');

const DASHBOARD_URL = process.env.DASHBOARD_URL;
const POWER_AUTOMATE_URL = process.env.POWER_AUTOMATE_URL;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;

const GERENCIAS_ALVO = ["SP SUL", "SP NORTE", "FERRONORTE", "MALHA CENTRAL"]; 
const MAX_RETRIES = 3;
const BASE_WAIT_TIME = 5000;

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

    let abortEmail = false;
    let htmlEmailBody = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="border-bottom: 2px solid #005ca9; padding-bottom: 10px;">Relatório Diário de Intervalos</h2>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p>Status consolidado por gerência:</p>
        </div>
    `;

    try {
        console.log('Acessando Painel...');
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0', timeout: 120000 });
        await page.waitForSelector('#gerencia', { timeout: 30000 });

        for (const gerencia of GERENCIAS_ALVO) {
            if (abortEmail) break;

            console.log(`>> Processando: ${gerencia}`);
            let attempt = 1;
            let success = false;
            let screenshotBase64 = null;

            while (attempt <= MAX_RETRIES && !success) {
                try {
                    await page.select('#gerencia', gerencia);
                    const waitTime = BASE_WAIT_TIME * attempt;
                    console.log(`   Tentativa ${attempt}: Aguardando ${waitTime/1000}s...`);
                    await new Promise(r => setTimeout(r, waitTime));

                    const mainElement = await page.$('main');
                    if (!mainElement) throw new Error("Tag <main> não encontrada");

                    screenshotBase64 = await mainElement.screenshot({ encoding: 'base64' });
                    success = true;
                } catch (e) {
                    console.error(`   Erro na tentativa ${attempt}: ${e.message}`);
                    attempt++;
                }
            }

            if (success && screenshotBase64) {
                htmlEmailBody += `
                    <div style="margin-top: 30px; margin-bottom: 40px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                        <h3 style="background-color: #f4f4f4; padding: 10px; margin-top: 0; border-left: 5px solid #005ca9;">${gerencia}</h3>
                        <img src="data:image/png;base64,${screenshotBase64}" style="width: 100%; display: block;" />
                    </div>
                `;
            } else {
                console.error(`❌ FALHA CRÍTICA em ${gerencia}. Cancelando envio.`);
                
                // SALVA O PRINT DO ERRO NO DISCO PARA O GITHUB ACTIONS PEGAR
                await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
                console.log('📸 Screenshot de erro salvo como error-screenshot.png');
                
                abortEmail = true;
            }
        }

        if (!abortEmail) {
            console.log('Enviando e-mail...');
            await axios.post(POWER_AUTOMATE_URL, {
                recipient: RECIPIENT_EMAIL,
                subject: `Painel Intervalos - ${new Date().toLocaleDateString('pt-BR')}`,
                htmlContent: htmlEmailBody
            }, { maxBodyLength: Infinity, maxContentLength: Infinity });
            console.log('Sucesso!');
        } else {
            console.error('⚠️ Processo abortado devido a falhas de captura.');
            process.exit(1); // Força falha no Action para você ver o erro vermelho
        }

    } catch (error) {
        console.error("Erro fatal:", error.message);
        // Tenta salvar print mesmo no catch global
        try { await page.screenshot({ path: 'error-screenshot.png' }); } catch {}
        process.exit(1);
    } finally {
        await browser.close();
    }
}
run();