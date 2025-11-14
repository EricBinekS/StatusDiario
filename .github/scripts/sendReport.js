// .github/scripts/sendReport.js

const puppeteer = require("puppeteer");
const fs = require("fs").promises; 
const path = require("path"); 

process.env.TZ = "America/Sao_Paulo";

// --- Variáveis de Ambiente (Vindas dos Secrets do GitHub) ---
const DASHBOARD_URL = process.env.DASHBOARD_URL;
const POWER_AUTOMATE_URL = process.env.POWER_AUTOMATE_URL;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;

/**
 * Pega a data de "hoje" no formato AAAA-MM-DD.
 */
function getTodaysDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0"); 
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // Retorna "2025-11-14"
}

async function captureAndSendReports() {
  console.log("Iniciando captura dos relatórios diários...");
  let browser;
  const todayString = getTodaysDateString();
  const powerAutomateAttachments = []; 
  const localScreenshots = []; 

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`Navegando para ${DASHBOARD_URL}...`);
    await page.goto(DASHBOARD_URL, { waitUntil: "networkidle0" });

    // 1. Espera a tabela carregar
    console.log("Aguardando a tabela inicial carregar...");
    await page.waitForSelector(".tabela-wrapper .grid-table tbody tr", {
      timeout: 30000,
    });
    console.log("Tabela inicial carregada.");

    // 2. APLICA O FILTRO DE DATA (MÉTODO NOVO: page.fill)
    console.log(`Aplicando filtro de data: ${todayString}`);
    
    // page.fill() é o comando correto para <input type="date">
    // Ele espera o formato AAAA-MM-DD, que é o que 'todayString' fornece.
    await page.fill("#data", todayString);

    // --- TEMPO DE ESPERA ---
    console.log("Aguardando 5s para o filtro de data ser aplicado...");
    await new Promise((r) => setTimeout(r, 5000)); 

    // 3. Lê todas as opções do filtro "Gerência"
    console.log("Lendo lista de Gerências...");
    const gerenciaOptions = await page.$$eval("#gerencia option", (options) => {
      return options
        .map((opt) => ({ value: opt.value, text: opt.innerText }))
        .filter((opt) => opt.value !== ""); 
    });

    console.log(`Encontradas ${gerenciaOptions.length} gerências para processar.`);

    // 4. Inicia o LOOP para cada gerência
    for (const gerencia of gerenciaOptions) {
      console.log(`--- Processando Gerência: ${gerencia.text} ---`);
      try {
        await page.select("#gerencia", gerencia.value);
        
        console.log("Aguardando 5 segundos para o filtro (gerência) ser aplicado...");
        await new Promise((r) => setTimeout(r, 5000)); 

        const tableElement = await page.$(".tabela-wrapper");
        if (!tableElement) {
          console.warn("Tabela não encontrada. Pulando...");
          continue;
        }

        const screenshotPath = `report_${gerencia.value}.png`;
        await tableElement.screenshot({ path: screenshotPath });
        console.log(`Screenshot salvo localmente: ${screenshotPath}`);
        localScreenshots.push(screenshotPath); 

        const fileData = await fs.readFile(screenshotPath);
        const base64Content = fileData.toString("base64");

        powerAutomateAttachments.push({
          Name: `Relatório - ${gerencia.text}.png`,
          ContentBytes: base64Content,
        });
      } catch (loopError) {
        console.error(
          `Falha ao processar a gerência ${gerencia.text}:`,
          loopError.message
        );
      }
    } // Fim do loop

    console.log("--- Processamento de todas as gerências concluído ---");

    if (powerAutomateAttachments.length === 0) {
      console.warn("Nenhum print foi gerado, mesmo assim o fluxo continuará.");
      powerAutomateAttachments.push({
        Name: "ERRO-NENHUM_DADO_ENCONTRADO.png",
        ContentBytes: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      });
    }

    // 5. Monta o JSON final para o Power Automate
    const payload = {
      recipient: RECIPIENT_EMAIL,
      reportDate: new Date().toLocaleDateString("pt-BR"), 
      attachmentsArray: powerAutomateAttachments,
    };

    // 6. Envia a chamada HTTP para o Power Automate
    console.log(`Enviando ${payload.attachmentsArray.length} anexos para o Power Automate...`);

    const response = await fetch(POWER_AUTOMATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro ao chamar o Power Automate: ${response.status} ${response.statusText}`);
    }

    console.log("Dados enviados ao Power Automate com sucesso!");
    
  } catch (error) {
    console.error("Ocorreu um erro principal na automação:", error);
    process.exit(1); 
  } finally {
    if (browser) {
      console.log("Fechando o navegador.");
      await browser.close();
    }
    
    console.log("Limpando arquivos locais...");
    for (const file of localScreenshots) {
      try {
        await fs.unlink(file);
      } catch (e) {
        console.warn(`Não foi possível deletar ${file}: ${e.message}`);
      }
    }
  }
}

// Executa a função
captureAndSendReports();