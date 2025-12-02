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

async function selectReactOption(page, labelId, optionText) {
    console.log(`\n--- Tentando selecionar "${optionText}" em "${labelId}" ---`);
    
    const buttonSelector = `button[id="${labelId}"]`;
    await page.waitForSelector(buttonSelector, { visible: true, timeout: 10000 });
    await page.click(buttonSelector);
    
    console.log('Aguardando dropdown abrir...');
    await page.waitForSelector('.multiselect-dropdown', { visible: true, timeout: 5000 });

    // --- DEBUG: Listar o que o robô está vendo dentro do menu ---
    const availableOptions = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.multiselect-dropdown .option-list span'));
        return items.map(i => i.innerText);
    });
    console.log(`Opções encontradas no menu: [${availableOptions.join(', ')}]`);
    // -----------------------------------------------------------

    // Limpeza: Desmarcar anteriores
    const todosCheckbox = await page.$('.multiselect-dropdown .header-all input[type="checkbox"]');
    const isTodosChecked = await (await todosCheckbox.getProperty('checked')).jsonValue();
    
    if (isTodosChecked) {
        console.log('Limpando seleção: Desmarcando "Todos"...');
        await page.click('.multiselect-dropdown .header-all label');
        await new Promise(r => setTimeout(r, 500));
    } else {
        const checkedOptions = await page.$$('.multiselect-dropdown .option-list input[type="checkbox"]:checked');
        if (checkedOptions.length > 0) {
            console.log(`Limpando seleção: Desmarcando ${checkedOptions.length} itens anteriores...`);
            for (const el of checkedOptions) {
                await el.click();
                await new Promise(r => setTimeout(r, 100));
            }
        }
    }

    // Seleção
    console.log(`Procurando opção exata: "${optionText}"`);
    const optionFound = await page.evaluate((text) => {
        const spans = Array.from(document.querySelectorAll('.multiselect-dropdown .option-list span'));
        // Usa includes para ser mais flexível com espaços extras, mas ainda preciso
        const target = spans.find(s => s.innerText.trim() === text);
        if (target) {
            target.click();
            return true;
        }
        return false;
    }, optionText);

    if (!optionFound) {
        // Fecha o dropdown para não atrapalhar o print de erro
        await page.click(buttonSelector); 
        throw new Error(`Opção "${optionText}" não existe na lista carregada.`);
    }

    // Fechar dropdown
    await page.click(buttonSelector);
    await new Promise(r => setTimeout(r, 1500)); // Espera tabela atualizar
    console.log('Filtro aplicado.');
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

    try {
        console.log('Acessando Painel...');
        // Aumentei o timeout de carga inicial para 2 minutos (rede lenta)
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 120000 });

        // 1. VERIFICAR SE DEU ERRO NA TELA (Baseado no seu App.jsx)
        const hasError = await page.evaluate(() => {
            return document.body.innerText.includes('Erro ao carregar o painel');
        });

        if (hasError) {
            throw new Error("A página exibiu 'Erro ao carregar o painel'. A API do backend falhou.");
        }

        // 2. ESPERAR CARREGAMENTO COM MAIS PACIÊNCIA (60s)
        console.log('Aguardando fim do loading...');
        try {
            await page.waitForFunction(
                () => !document.body.innerText.includes('Carregando dados...'),
                { timeout: 60000 }
            );
            console.log('Loading finalizado.');
        } catch (e) {
            console.warn("Aviso: Timeout aguardando loading sumir. Tentando continuar mesmo assim...");
        }

        let htmlEmailBody = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="border-bottom: 2px solid #005ca9; padding-bottom: 10px;">Relatório Diário de Intervalos</h2>
                <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                <p>Status consolidado por gerência:</p>
            </div>
        `;

        for (const gerencia of GERENCIAS_ALVO) {
            try {
                await selectReactOption(page, "Gerência", gerencia);

                await new Promise(r => setTimeout(r, 3000));

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
                
                // Tira print para ver o estado do menu
                await page.screenshot({ path: `erro-${gerencia.replace(/\s+/g, '_')}.png` });
                
                htmlEmailBody += `<p style="color:red">Erro ao capturar: ${gerencia}. (Verificar se dados carregaram)</p>`;
                
                // Tenta fechar menus abertos
                try { await page.click('body'); } catch(ex) {}
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
        await page.screenshot({ path: 'erro-fatal.png', fullPage: true });
        process.exit(1);
    } finally {
        await browser.close();
    }
}
run();