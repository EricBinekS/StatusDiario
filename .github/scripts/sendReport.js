const puppeteer = require('puppeteer');
const axios = require('axios');

const DASHBOARD_URL = process.env.DASHBOARD_URL;
const POWER_AUTOMATE_URL = process.env.POWER_AUTOMATE_URL;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;

const GERENCIAS_ALVO = ["SP SUL", "SP NORTE", "FERRONORTE", "MALHA CENTRAL"]; 
const MAX_RETRIES = 3;
const BASE_WAIT_TIME = 5000; // 5 segundos

// --- FUNÇÃO AUXILIAR PARA INTERAGIR COM O DROPDOWN REACT (SINTAXE NOVA) ---
async function toggleReactOption(page, labelText, optionText) {
    // 1. Encontra o botão que abre o dropdown baseado no Label
    // Sintaxe nova: ::-p-xpath(...) permite XPath dentro de seletores padrão
    const dropdownSelector = `::-p-xpath(//label[contains(text(), '${labelText}')]/following-sibling::div//button)`;
    
    let button;
    try {
        button = await page.waitForSelector(dropdownSelector, { timeout: 10000 });
    } catch (e) {
        throw new Error(`Botão do dropdown "${labelText}" não encontrado.`);
    }

    if (!button) throw new Error(`Botão do dropdown "${labelText}" não encontrado (null).`);
    
    // Clica para abrir a lista
    await button.click();
    await new Promise(r => setTimeout(r, 500)); 

    // 2. Procura a opção na lista (ex: "SP SUL")
    const optionSelector = `::-p-xpath(//*[contains(text(), '${optionText}')])`;
    try {
        // Espera a opção ficar visível
        await page.waitForSelector(optionSelector, { timeout: 2000, visible: true });
    } catch (e) {
        // Se der erro, tenta fechar o dropdown antes de lançar a exceção
        await button.click(); 
        throw new Error(`Opção "${optionText}" não encontrada na lista.`);
    }

    // Seleciona o elemento para clicar
    const optionElement = await page.$(optionSelector);
    if (optionElement) {
        await optionElement.click(); // Clica para SELECIONAR ou DESELECIONAR
    }

    // 3. Fecha o dropdown clicando no botão novamente
    await button.click();
    
    // Pequena pausa para a UI atualizar
    await new Promise(r => setTimeout(r, 1000)); 
}

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
        // Timeout longo para garantir carga inicial (2 min)
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0', timeout: 120000 });

        // Verificação de erro na tela inicial
        const hasError = await page.evaluate(() => document.body.innerText.includes('Erro ao carregar o painel'));
        if (hasError) throw new Error("A página exibiu erro de API na carga inicial.");

        // Aguarda o filtro aparecer visualmente (Sintaxe atualizada)
        console.log('Aguardando filtros carregarem...');
        await page.waitForSelector("::-p-xpath(//label[contains(text(), 'Gerência')])", { timeout: 30000 });

        // --- LOOP PRINCIPAL POR GERÊNCIA ---
        for (const gerencia of GERENCIAS_ALVO) {
            if (abortEmail) break;

            console.log(`>> Processando: ${gerencia}`);
            let attempt = 1;
            let success = false;
            let screenshotBase64 = null;

            while (attempt <= MAX_RETRIES && !success) {
                try {
                    console.log(`   Tentativa ${attempt}: Aplicando filtro...`);
                    
                    // 1. SELECIONA A GERÊNCIA
                    await toggleReactOption(page, "Gerência", gerencia);

                    // 2. ESPERA PROGRESSIVA
                    const waitTime = BASE_WAIT_TIME * attempt;
                    console.log(`   Aguardando ${waitTime/1000}s para renderização...`);
                    await new Promise(r => setTimeout(r, waitTime));

                    // 3. CAPTURA O PRINT
                    const mainElement = await page.$('main');
                    if (!mainElement) throw new Error("Tag <main> não encontrada");
                    screenshotBase64 = await mainElement.screenshot({ encoding: 'base64' });
                    
                    // 4. LIMPEZA: DESELECIONA A GERÊNCIA
                    console.log(`   Removendo filtro ${gerencia}...`);
                    await toggleReactOption(page, "Gerência", gerencia);
                    
                    success = true; 
                    
                } catch (e) {
                    console.error(`   Erro na tentativa ${attempt}: ${e.message}`);
                    attempt++;

                    if (attempt <= MAX_RETRIES) {
                        console.log("   Recarregando página para limpar estado...");
                        try {
                            await page.reload({ waitUntil: 'networkidle0' });
                            // Espera o filtro voltar após o reload
                            await page.waitForSelector("::-p-xpath(//label[contains(text(), 'Gerência')])", { timeout: 30000 });
                        } catch (reloadError) {
                            console.error("   Falha ao recarregar página:", reloadError.message);
                        }
                    }
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
                try { await page.screenshot({ path: 'error-screenshot.png', fullPage: true }); } catch {}
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
            console.log('Sucesso! Processo finalizado.');
        } else {
            console.error('⚠️ Processo abortado: E-mail não enviado devido a falhas na captura.');
            process.exit(1); 
        }

    } catch (error) {
        console.error("Erro fatal no script:", error.message);
        try { await page.screenshot({ path: 'error-screenshot.png' }); } catch {}
        process.exit(1);
    } finally {
        await browser.close();
    }
}
run();