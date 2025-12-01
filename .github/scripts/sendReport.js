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
    console.log(`Aguardando botão: ${buttonSelector}`);
    await page.waitForSelector(buttonSelector, { visible: true, timeout: 10000 });
    await page.click(buttonSelector);
    console.log('Aguardando dropdown abrir...');
    await page.waitForSelector('.multiselect-dropdown', { visible: true, timeout: 5000 });
    const todosCheckbox = await page.$('.multiselect-dropdown .header-all input[type="checkbox"]');
    const isTodosChecked = await (await todosCheckbox.getProperty('checked')).jsonValue();
    
    if (isTodosChecked) {
        console.log('Desmarcando "Todos"...');
        await page.click('.multiselect-dropdown .header-all label'); 
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`Procurando opção: ${optionText}`);
    const optionFound = await page.evaluate((text) => {
        const spans = Array.from(document.querySelectorAll('.multiselect-dropdown .option-list span'));
        const target = spans.find(s => s.innerText.trim() === text);
        if (target) {
            target.click();
            return true;
        }
        return false;
    }, optionText);

    if (!optionFound) {
        throw new Error(`Opção "${optionText}" não encontrada no dropdown.`);
    }

    await page.click(buttonSelector);
    await new Promise(r => setTimeout(r, 1000))
    console.log('Filtro aplicado com sucesso.');
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
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 90000 });

        try {
            await page.waitForFunction(
                () => !document.body.innerText.includes('Carregando dados...'),
                { timeout: 30000 }
            );
        } catch (e) {
            console.log("Aviso: Loading demorou a sair ou não apareceu.");
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
                
                await page.screenshot({ path: `erro-${gerencia.replace(/\s+/g, '_')}.png` });
                
                htmlEmailBody += `<p style="color:red">Erro ao capturar: ${gerencia} (Ver logs)</p>`;
                
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