const puppeteer = require('puppeteer');

const WEBHOOK_URL = process.env.POWER_AUTOMATE_URL;
const BASE_URL = process.env.DASHBOARD_URL;

async function run() {
  if (!WEBHOOK_URL || !BASE_URL) {
    console.error("ERRO: Variáveis de ambiente (POWER_AUTOMATE_URL ou DASHBOARD_URL) faltando.");
    process.exit(1);
  }

  console.log("Iniciando captura do Relatório Diário (Tabela Operacional)...");
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`Acessando: ${BASE_URL}/`);
    
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0', timeout: 60000 });
    
    await new Promise(r => setTimeout(r, 5000));

    const base64Image = await page.screenshot({ fullPage: true, encoding: 'base64' });
    console.log("Screenshot capturado com sucesso.");

    console.log("Enviando para o Webhook...");
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipoRelatorio: 'Diário (Operacional)',
        dataEnvio: new Date().toLocaleDateString('pt-BR'),
        imagemBase64: base64Image
      })
    });

    if (!response.ok) throw new Error(`Erro HTTP ao enviar: ${response.status}`);
    console.log("Sucesso! Relatório enviado.");

  } catch (error) {
    console.error("FALHA CRÍTICA:", error);
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