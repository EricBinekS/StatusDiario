// .github/scripts/sendReport.js

const puppeteer = require("puppeteer");
const fs = require("fs").promises; 
const path = require("path"); 
const FormData = require("form-data"); 

process.env.TZ = "America/Sao_Paulo";

// --- Variáveis de Ambiente (Vindas dos Secrets do GitHub) ---
const DASHBOARD_URL = process.env.DASHBOARD_URL;
const POWER_AUTOMATE_URL = process.env.POWER_AUTOMATE_URL;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

/**
 * Faz upload de uma imagem (em Base64) para o imgbb e retorna a URL pública.
 */
async function uploadImageToImgBB(base64ImageString) {
  try {
    const form = new FormData();
    form.append('image', base64ImageString);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: form,
    });

    const json = await response.json();
    if (!json.success) {
      throw new Error(`Erro no imgbb: ${json.error.message}`);
    }
    
    return json.data.display_url; // URL pública da imagem
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    return null; // Retorna nulo se o upload falhar
  }
}

async function captureAndSendReports() {
  console.log("Iniciando captura dos relatórios diários...");
  let browser;
  const powerAutomatePayload = [];
  const localScreenshots = []; 

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 8000 });

    console.log(`Navegando para ${DASHBOARD_URL}...`);
    await page.goto(DASHBOARD_URL, { waitUntil: "networkidle0" });

    // 1. Espera a tabela carregar
    console.log("Aguardando a tabela inicial carregar (já filtrada para 'hoje')...");
    await page.waitForSelector(".tabela-wrapper .grid-table tbody tr", {
      timeout: 30000,
    });
    console.log("Tabela inicial carregada.");

    // --- MUDANÇA IMPORTANTE AQUI (ORDEM PERSONALIZADA) ---
    // 2. Define a ordem de processamento das Gerências
    console.log("Definindo a ordem de processamento personalizada...");
    const gerenciasParaProcessar = [
      { value: "SP SUL", text: "SP SUL" },
      { value: "SP NORTE", text: "SP NORTE" },
      { value: "FERRONORTE", text: "FERRONORTE" },
      { value: "MALHA CENTRAL", text: "MALHA CENTRAL" }
    ];
    // --- FIM DA MUDANÇA ---

    console.log(`Total de ${gerenciasParaProcessar.length} gerências para processar.`);

    // 3. Inicia o LOOP para cada gerência (na ordem definida)
    for (const gerencia of gerenciasParaProcessar) {
      console.log(`--- Processando Gerência: ${gerencia.text} ---`);
      try {
        
        // Verifica se a opção realmente existe na página antes de tentar selecionar
        const optionExists = await page.evaluate((value) => {
          return !!document.querySelector(`#gerencia option[value="${value}"]`);
        }, gerencia.value);

        if (!optionExists) {
          console.warn(`Gerência "${gerencia.text}" não encontrada no filtro. Pulando...`);
          continue; // Pula para a próxima gerência
        }

        // Seleciona a gerência
        await page.select("#gerencia", gerencia.value);
        
        console.log("Aguardando 5 segundos para o filtro (gerência) ser aplicado...");
        await new Promise((r) => setTimeout(r, 5000)); 

        const screenshotPath = `report_${gerencia.value}.png`;
        
        await page.screenshot({ path: screenshotPath });

        console.log(`Screenshot salvo localmente: ${screenshotPath}`);
        localScreenshots.push(screenshotPath); 

        // --- NOVO FLUXO DE UPLOAD ---
        const fileData = await fs.readFile(screenshotPath);
        const base64Content = fileData.toString("base64");
        
        console.log(`Fazendo upload da imagem ${gerencia.text} para o imgbb...`);
        const publicUrl = await uploadImageToImgBB(base64Content);

        if (publicUrl) {
          console.log(`Upload com sucesso: ${publicUrl}`);
          powerAutomatePayload.push({
            Name: `Relatório - ${gerencia.text}`, // Nome limpo
            Url: publicUrl, // A URL pública
          });
        }
        // --- FIM DO NOVO FLUXO ---
        
      } catch (loopError) {
        console.error(
          `Falha ao processar a gerência ${gerencia.text}:`,
          loopError.message
        );
      }
    } // Fim do loop

    console.log("--- Processamento de todas as gerências concluído ---");

    if (powerAutomatePayload.length === 0) {
      throw new Error("Nenhum print foi gerado ou teve upload com sucesso.");
    }

    // 4. Monta o JSON final para o Power AutomATE
    const payload = {
      recipient: RECIPIENT_EMAIL,
      reportDate: new Date().toLocaleDateString("pt-BR"), 
      attachmentsArray: powerAutomatePayload, 
    };

    // 5. Envia a chamada HTTP para o Power Automate
    console.log(`Enviando ${payload.attachmentsArray.length} links de imagem para o Power Automate...`);

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