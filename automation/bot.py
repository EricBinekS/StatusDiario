import os
import requests
import base64
import time
from datetime import datetime
from playwright.sync_api import sync_playwright

# --- CONFIGURAÇÕES ---
DASHBOARD_URL = os.environ.get("DASHBOARD_URL") 
WEBHOOK_URL = os.environ.get("POWER_AUTOMATE_URL")
RECIPIENT_EMAIL = os.environ.get("RECIPIENT_EMAIL", "eric.bine@rumolog.com")

if not DASHBOARD_URL:
    print("❌ ERRO CRÍTICO: 'DASHBOARD_URL' não definida.")
    exit(1)

# CORREÇÃO 1: Adicionado acento em MODERNIZAÇÃO para o seletor encontrar o texto correto
GERENCIAS = ["FERRONORTE", "SP NORTE", "SP SUL", "MALHA CENTRAL", "MODERNIZAÇÃO"]

def run():
    screenshots_data = [] # Lista para guardar os prints

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        print(f"🚀 Acessando {DASHBOARD_URL}...")
        page.goto(DASHBOARD_URL)
        
        page.wait_for_selector("text=Carregando dados...", state="detached", timeout=60000)
        time.sleep(3)

        for gerencia in GERENCIAS:
            print(f"🔄 Processando: {gerencia}")
            
            try:
                # 1. ABRE FILTRO
                filter_group = page.locator("div.group", has_text="Gerência").first
                filter_btn = filter_group.locator("div").last 
                filter_btn.click()
                
                # 2. ESPERA MENU
                page.wait_for_selector("input[placeholder='Buscar...']", state="visible", timeout=5000)

                # 3. LIMPA (Se necessário)
                btn_limpar = page.locator("button:has-text('Limpar')").last
                if btn_limpar.is_visible() and btn_limpar.is_enabled():
                    btn_limpar.click()
                    time.sleep(0.5)
                
                # 4. BUSCA (Digita o nome)
                page.fill("input[placeholder='Buscar...']", gerencia)
                time.sleep(1) 

                # 5. SELECIONA (Clica no texto exato da lista)
                # O .last garante que pegamos o item da lista e não o input ou header
                page.locator(f"div:has-text('{gerencia}')").last.click()

                # 6. APLICA
                page.click("button:has-text('Aplicar')")

                # 7. CARREGAMENTO
                time.sleep(1)
                if page.is_visible("text=Carregando dados..."):
                    page.wait_for_selector("text=Carregando dados...", state="detached")
                time.sleep(2) 

                # 8. TIRA O PRINT E GUARDA NA MEMÓRIA
                print(f"📸 Capturado: {gerencia}")
                screenshot_bytes = page.locator("#dashboard-content").screenshot()
                
                # Salva para enviar depois
                screenshots_data.append({
                    "nome": gerencia,
                    "img": screenshot_bytes
                })

                # Fecha menu (safety)
                page.keyboard.press("Escape")
                time.sleep(0.5)

            except Exception as e:
                print(f"❌ Erro na gerência {gerencia}: {e}")
                page.reload()
                page.wait_for_selector("text=Carregando dados...", state="detached")
                time.sleep(3)

        browser.close()
    
    # 9. ENVIA TUDO DE UMA VEZ
    if screenshots_data:
        enviar_email_unificado(screenshots_data)
    else:
        print("⚠️ Nenhuma imagem capturada. Email não enviado.")

def enviar_email_unificado(lista_prints):
    if not WEBHOOK_URL:
        print("⚠️ Webhook não configurado.")
        return

    print("📧 Montando email unificado...")
    data_hoje = datetime.now().strftime("%d/%m/%Y")
    
    # Início do HTML
    html_body = f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e0e0e0; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            
            <div style="border-bottom: 2px solid #0056b3; padding-bottom: 15px; margin-bottom: 30px; text-align: center;">
                <h2 style="color: #0056b3; margin: 0; font-size: 24px;">Relatório Diário de Status</h2>
                <p style="color: #666; font-size: 14px; margin-top: 5px;">Consolidado de todas as gerências - {data_hoje}</p>
            </div>
    """

    # Loop para adicionar cada imagem no HTML
    for item in lista_prints:
        nome = item['nome']
        b64_img = base64.b64encode(item['img']).decode('utf-8')
        
        html_body += f"""
            <div style="margin-bottom: 40px;">
                <h3 style="color: #333; border-left: 4px solid #0056b3; padding-left: 10px; margin-bottom: 15px;">{nome}</h3>
                <div style="text-align: center;">
                    <img src="data:image/png;base64,{b64_img}" alt="{nome}" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" />
                </div>
            </div>
        """

    # Fechamento do HTML
    html_body += """
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999;">
                <p>Email automático gerado pelo Sistema PCM.</p>
            </div>
        </div>
    </body>
    </html>
    """

    payload = {
        "recipient": RECIPIENT_EMAIL,
        "subject": f"📊 Relatório Consolidado PCM - {data_hoje}",
        "htmlContent": html_body
    }

    try:
        response = requests.post(WEBHOOK_URL, json=payload)
        if response.status_code in [200, 202]:
            print(f"✅ Email UNIFICADO enviado com sucesso para {len(lista_prints)} gerências!")
        else:
            print(f"⚠️ Erro Power Automate: {response.text}")
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")

if __name__ == "__main__":
    run()