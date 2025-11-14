// .github/scripts/sendReport.js

const puppeteer = require("puppeteer");
const fs = require("fs").promises; // Para ler arquivos
const path = require("path"); // Para lidar com caminhos

// Define o fuso horário para 'America/Sao_Paulo' (Brasil)
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
  return `${yyyy}-${mm}-${dd}`;
}

async function captureAndSendReports() {
  console.log("Iniciando captura dos relatórios diários...");
  let browser;
  const todayString = getTodaysDateString();
  const powerAutomateAttachments = []; // Array para os anexos do Power Automate
  const localScreenshots = []; // Para deletar no final

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

    // 2. APLICA O FILTRO DE DATA (MÉTODO NOVO E ROBUSTO)
    console.log(`Aplicando filtro de data: ${todayString}`);
    
    // page.type() não é confiável para o React
    // Vamos setar o valor e disparar o evento 'change' manualmente
    await page.evaluate((date) => {
      const input = document.getElementById('data');
      if (input) {
        input.value = date; // Define o valor
        // Cria e dispara o evento que o React "escuta"
        const event = new Event('change', { bubbles: true }); 
        input.dispatchEvent(event);
      }
    }, todayString); // Passa 'todayString' como argumento 'date'

    // Espera 2 segundos para o React (que é client-side) re-renderizar
    console.log("Aguardando 2s para o filtro de data ser aplicado...");
    await new Promise((r) => setTimeout(r, 2000));

    // 3. Lê todas as opções do filtro "Gerência"
    console.log("Lendo lista de Gerências...");
    const gerenciaOptions = await page.$$eval("#gerencia option", (options) => {
      return options
        .map((opt) => ({ value: opt.value, text: opt.innerText }))
        .filter((opt) => opt.value !== ""); // Remove a opção "Todas"
    });

    console.log(`Encontradas ${gerenciaOptions.length} gerências para processar.`);

    // 4. Inicia o LOOP para cada gerência
    for (const gerencia of gerenciaOptions) {
      console.log(`--- Processando Gerência: ${gerencia.text} ---`);
      try {
        await page.select("#gerencia", gerencia.value);
        console.log("Aguardando 3 segundos para o filtro (gerência) ser aplicado...");
        await new Promise((r) => setTimeout(r, 3000));

        const tableElement = await page.$(".tabela-wrapper");
        if (!tableElement) {
          console.warn("Tabela não encontrada. Pulando...");
          continue;
        }

        const screenshotPath = `report_${gerencia.value}.png`;
        await tableElement.screenshot({ path: screenshotPath });
        console.log(`Screenshot salvo localmente: ${screenshotPath}`);
        localScreenshots.push(screenshotPath); // Salva para deletar depois

        // Lê o arquivo que acabou de salvar
        const fileData = await fs.readFile(screenshotPath);
        // Converte para Base64 (texto)
        const base64Content = fileData.toString("base64");

        // Adiciona no formato que o Power Automate espera
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
      throw new Error("Nenhum screenshot foi gerado.");
    }

    // 5. Monta o JSON final para o Power Automate
    const payload = {
      recipient: RECIPIENT_EMAIL,
      reportDate: new Date().toLocaleDateString("pt-BR"), // Formato "14/11/2025"
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
      // Se o Power Automate der erro (ex: 400, 500)
      throw new Error(`Erro ao chamar o Power Automate: ${response.status} ${response.statusText}`);
    }

    console.log("Dados enviados ao Power Automate com sucesso!");
    
  } catch (error) {
    console.error("Ocorreu um erro principal na automação:", error);
    process.exit(1); // Faz o "action" falhar
  } finally {
    if (browser) {
      console.log("Fechando o navegador.");
      await browser.close();
    }
    // Limpa os arquivos de print locais da VM do GitHub
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