const puppeteer = require('puppeteer');

const WEBHOOK_URL = process.env.POWER_AUTOMATE_URL;
const BASE_URL = process.env.DASHBOARD_URL;

async function run() {
  if (!WEBHOOK_URL || !BASE_URL) {
    console.error("Variáveis de ambiente faltando.");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const targetUrl = `${BASE_URL}/overview?view=mes`;
    console.log(`Acessando: ${targetUrl}`);
    
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    const base64Image = await page.screenshot({ fullPage: true, encoding: 'base64' });

    console.log("Enviando para Power Automate...");
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipoRelatorio: 'Mensal (Gerencial)',
        dataEnvio: new Date().toLocaleDateString('pt-BR'),
        imagemBase64: base64Image
      })
    });

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    console.log("Relatório Mensal enviado!");

  } catch (error) {
    console.error("ERRO:", error);
    try { 
        const page = (await browser.pages())[0];
        if (page) await page.screenshot({ path: 'error-screenshot.png' });
    } catch {}
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();