// .github/scripts/sendReport.js

const puppeteer = require("puppeteer");
const fs = require("fs").promises; 
const path = require("path"); 

// Não precisamos mais do URLSearchParams, pois o ImgBB foi removido
// const { URLSearchParams } = require('url');

process.env.TZ = "America/Sao_Paulo";

// --- Variáveis de Ambiente (Vindas dos Secrets do GitHub) ---
const DASHBOARD_URL = process.env.DASHBOARD_URL;
const POWER_AUTOMATE_URL = process.env.POWER_AUTOMATE_URL;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;
// A CHAVE DO IMGBB NÃO É MAIS NECESSÁRIA
// const IMGBB_API_KEY = process.env.IMGBB_API_KEY;


// <<< FUNÇÃO DE UPLOAD REMOVIDA >>>
// A função uploadImageToImgBB() não é mais necessária.


async function captureAndSendReports() {
  console.log("Iniciando captura dos status diários...");
  let browser;
  const powerAutomatePayload = [];
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
    console.log("Aguardando a tabela inicial carregar (já filtrada para 'hoje')...");
    await page.waitForSelector(".tabela-wrapper .grid-table tbody tr", {
      timeout: 30000,
    });
    console.log("Tabela inicial carregada.");

    // 2. Define a ordem de processamento das Gerências
    console.log("Definindo a ordem de processamento personalizada...");
    const gerenciasParaProcessar = [
      { value: "SP SUL", text: "SP SUL" },
      { value: "SP NORTE", text: "SP NORTE" },
      { value: "FERRONORTE", text: "FERRONORTE" },
      { value: "MALHA CENTRAL", text: "MALHA CENTRAL" }
    ];

    console.log(`Total de ${gerenciasParaProcessar.length} gerências para processar.`);

    // 3. Inicia o LOOP para cada gerência (na ordem definida)
    for (const gerencia of gerenciasParaProcessar) {
      console.log(`--- Processando Gerência: ${gerencia.text} ---`);
      try {
        
        const optionExists = await page.evaluate((value) => {
          return !!document.querySelector(`#gerencia option[value="${value}"]`);
        }, gerencia.value);

        if (!optionExists) {
          console.warn(`Gerência "${gerencia.text}" não encontrada no filtro. Pulando...`);
          continue; 
        }

        await page.select("#gerencia", gerencia.value);
        
        console.log("Aguardando 5 segundos para o filtro (gerência) ser aplicado...");
        await new Promise((r) => setTimeout(r, 5000)); 

        const screenshotPath = `report_${gerencia.value}.png`;
        
        // <<< MUDANÇA PARA PRINTAR O <main> CONFORME SOLICITADO >>>
        // 1. Encontra o elemento <main>
        const mainElement = await page.$('main');
        if (!mainElement) {
          console.warn("Elemento <main> não encontrado. Pulando...");
          continue;
        }

        // 2. Mede o tamanho e a Posição dele
        const boundingBox = await mainElement.boundingBox();
        if (!boundingBox) {
          console.warn("Não foi possível medir o <main> (está oculta?). Pulando...");
          continue;
        }

        // 3. Tira o print usando 'clip' com as coordenadas exatas
        await page.screenshot({ 
          path: screenshotPath,
          clip: {
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: Math.ceil(boundingBox.height) 
          }
        });
        // --- FIM DA MUDANÇA ---

        console.log(`Screenshot salvo localmente: ${screenshotPath}`);
        localScreenshots.push(screenshotPath); 

        // <<< LÓGICA DE UPLOAD ALTERADA PARA CID >>>
        const fileData = await fs.readFile(screenshotPath);
        // 1. Pega a string Base64 pura, sem 'data:image/png;base64,'
        const base64Content = fileData.toString("base64");
        
        console.log(`Preparando ${gerencia.text} (Base64) para o Power Automate.`);

        // 2. Cria um Content-ID limpo (ex: "SP SUL" -> "sp_sul")
        const contentId = gerencia.value.toLowerCase().replace(/ /g, '_');

        // 3. Adiciona o objeto completo ao payload
        powerAutomatePayload.push({
          Name: `Status - ${gerencia.text}`,
          ContentId: contentId,         // O "apelido" para o HTML (cid:sp_sul)
          Base64Content: base64Content  // A string Base64 pura
        });
        // --- FIM DA LÓGICA DE UPLOAD ---
        
      } catch (loopError) {
        console.error(
          `Falha ao processar a gerência ${gerencia.text}:`,
          loopError.message
        );
      }
    } // Fim do loop

    console.log("--- Processamento de todas as gerências concluído ---");

    if (powerAutomatePayload.length === 0) {
      throw new Error("Nenhum print foi gerado ou processado com sucesso.");
    }

    // 4. Monta o JSON final para o Power AutomATE
    const payload = {
      recipient: RECIPIENT_EMAIL,
      reportDate: new Date().toLocaleDateString("pt-BR"), 
      attachmentsArray: powerAutomatePayload, // Agora contém {Name, ContentId, Base64Content}
    };

    // 5. Envia a chamada HTTP para o Power Automate
    console.log(`Enviando ${payload.attachmentsArray.length} imagens (Base64) para o Power Automate...`);

    const response = await fetch(POWER_AUTOMATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro ao chamar o Power Automate: ${response.status} ${response.statusText}. Corpo: ${errorBody}`);
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