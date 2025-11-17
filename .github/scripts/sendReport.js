// .github/scripts/sendReport.js

const puppeteer = require("puppeteer");
const fs = require("fs").promises; 
const path = require("path"); 

process.env.TZ = "America/Sao_Paulo";

const DASHBOARD_URL = process.env.DASHBOARD_URL;
const POWER_AUTOMATE_URL = process.env.POWER_AUTOMATE_URL;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;

async function captureAndSendReports() {
  console.log("Iniciando geração do Relatório PDF...");
  let browser;

  const capturedImages = []; 

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`Navegando para ${DASHBOARD_URL}...`);
    await page.goto(DASHBOARD_URL, { waitUntil: "networkidle0" });

    console.log("Aguardando a tabela carregar...");
    await page.waitForSelector(".tabela-wrapper .grid-table tbody tr", { timeout: 30000 });

    const gerenciasParaProcessar = [
      { value: "SP SUL", text: "SP SUL" },
      { value: "SP NORTE", text: "SP NORTE" },
      { value: "FERRONORTE", text: "FERRONORTE" },
      { value: "MALHA CENTRAL", text: "MALHA CENTRAL" }
    ];

    for (const gerencia of gerenciasParaProcessar) {
      console.log(`--- Capturando: ${gerencia.text} ---`);
      try {
        const optionExists = await page.evaluate((value) => {
          return !!document.querySelector(`#gerencia option[value="${value}"]`);
        }, gerencia.value);

        if (!optionExists) continue;

        await page.select("#gerencia", gerencia.value);
        await new Promise((r) => setTimeout(r, 5000));

        const mainElement = await page.$('main');
        if (!mainElement) continue;

        const boundingBox = await mainElement.boundingBox();
        if (!boundingBox) continue;

        const screenshotBuffer = await page.screenshot({ 
          clip: {
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: Math.ceil(boundingBox.height) 
          }
        });
        
        capturedImages.push({
          title: gerencia.text,
          base64: screenshotBuffer.toString('base64')
        });
        
        console.log(`Captura de ${gerencia.text} concluída.`);

      } catch (e) {
        console.error(`Erro ao capturar ${gerencia.text}:`, e.message);
      }
    }

    if (capturedImages.length === 0) {
      throw new Error("Nenhuma imagem foi capturada para gerar o PDF.");
    }

    console.log("Montando o PDF final...");
    
    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            .report-section { margin-bottom: 40px; page-break-inside: avoid; }
            h2 { color: #0056b3; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
            img { width: 100%; height: auto; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <h1>Relatório de Status - ${new Date().toLocaleDateString("pt-BR")}</h1>
    `;

    for (const item of capturedImages) {
      htmlContent += `
        <div class="report-section">
          <h2>${item.title}</h2>
          <img src="data:image/png;base64,${item.base64}" />
        </div>
      `;
    }

    htmlContent += `</body></html>`;

    await page.setContent(htmlContent);

    // Gera o PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    const pdfBase64 = pdfBuffer.toString('base64');
    console.log("PDF gerado com sucesso!");

    const payload = {
      recipient: RECIPIENT_EMAIL,
      reportDate: new Date().toLocaleDateString("pt-BR"),
      fileName: "Relatorio_Diario_Status.pdf",
      fileContent: pdfBase64
    };

    console.log("Enviando PDF para o Power Automate...");
    const response = await fetch(POWER_AUTOMATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro Power Automate: ${response.statusText}`);
    }

    console.log("PDF enviado com sucesso!");

  } catch (error) {
    console.error("Erro fatal:", error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

captureAndSendReports();