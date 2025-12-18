import os
import requests
import base64
import time
from datetime import datetime
from playwright.sync_api import sync_playwright

# --- CONFIGURAÇÕES ---
SITE_URL = os.environ.get("DASHBOARD_URL")
WEBHOOK_URL = os.environ.get("POWER_AUTOMATE_URL")
EMAIL_DESTINO = os.environ.get("RECIPIENT_EMAIL")  

# Lista exata das gerências para iterar
GERENCIAS = ["FERRONORTE", "SP NORTE", "SP SUL", "MALHA CENTRAL", "MODERNIZACAO"]

def run():
    with sync_playwright() as p:
        # Configura o navegador para simular uma tela Full HD (1920x1080)
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        print(f"🚀 Acessando {SITE_URL}...")
        page.goto(SITE_URL)
        
        # Espera o carregamento inicial
        page.wait_for_selector("text=Carregando dados...", state="detached", timeout=60000)
        time.sleep(2)

        for gerencia in GERENCIAS:
            print(f"🔄 Processando: {gerencia}")
            
            try:
                # 1. Abre o menu de Filtro "Gerência"
                page.locator("text=Gerência").click()
                
                # 2. DES-SELECIONAR (Clica no botão 'Limpar' dentro do portal)
                # Isso garante que não acumule com a gerência anterior
                btn_limpar = page.locator("button:has-text('Limpar')").last
                if btn_limpar.is_visible():
                    btn_limpar.click()
                
                # 3. Busca a Gerência Atual
                page.fill("input[placeholder='Buscar...']", gerencia)
                time.sleep(0.5) # Breve espera para filtro visual

                # 4. Seleciona a opção
                # Procura o item na lista e clica
                page.click(f"div[role='button']:has-text('{gerencia}')")

                # 5. Aplica o Filtro
                page.click("button:has-text('Aplicar')")

                # 6. Espera o loading sumir e a tela atualizar
                time.sleep(1)
                page.wait_for_selector("text=Carregando dados...", state="detached")
                time.sleep(2) # Espera extra para renderização dos gráficos

                # 7. Tira o Print (Do dashboard inteiro ou área específica)
                # Usamos o ID que criamos no passo anterior
                screenshot_bytes = page.locator("#dashboard-content").screenshot()

                # 8. Prepara e Envia o Email
                enviar_email_formatado(gerencia, screenshot_bytes)

            except Exception as e:
                print(f"❌ Erro na gerência {gerencia}: {e}")
                page.reload() # Recarrega página inteira em caso de erro para tentar a próxima
                page.wait_for_selector("text=Carregando dados...", state="detached")

        browser.close()

def enviar_email_formatado(gerencia, image_bytes):
    if not WEBHOOK_URL:
        print("⚠️ Webhook não configurado.")
        return

    # Converte imagem para Base64
    b64_img = base64.b64encode(image_bytes).decode('utf-8')
    data_hoje = datetime.now().strftime("%d/%m/%Y às %H:%M")

    # --- MONTAGEM DO HTML PARA O OUTLOOK ---
    # Outlook gosta de tabelas e estilos inline simples.
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="max-width: 1000px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 20px; border: 1px solid #e0e0e0;">
            
            <div style="border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px;">
                <h2 style="color: #0056b3; margin: 0;">Status Diário: {gerencia}</h2>
                <p style="color: #666; font-size: 12px; margin-top: 5px;">Atualizado em: {data_hoje}</p>
            </div>

            <div style="text-align: center;">
                <p style="margin-bottom: 10px; font-weight: bold; color: #333;">Visão Geral do Dashboard:</p>
                <img src="data:image/png;base64,{b64_img}" alt="Status Dashboard" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px;" />
            </div>

            <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999;">
                <p>Este é um email automático gerado pelo Sistema PCM.</p>
            </div>
        </div>
    </body>
    </html>
    """

    payload = {
        "recipient": EMAIL_DESTINO,
        "subject": f"📍 Status Diário - {gerencia} - {datetime.now().strftime('%d/%m')}",
        "htmlContent": html_content
    }

    try:
        response = requests.post(WEBHOOK_URL, json=payload)
        if response.status_code == 200 or response.status_code == 202:
            print(f"✅ Email enviado: {gerencia}")
        else:
            print(f"⚠️ Erro Power Automate: {response.text}")
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")

if __name__ == "__main__":
    run()