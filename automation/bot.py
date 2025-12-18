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

# VALIDAÇÃO DE SEGURANÇA
if not DASHBOARD_URL:
    print("❌ ERRO CRÍTICO: A variável 'DASHBOARD_URL' não foi definida.")
    print("👉 Verifique se você adicionou o secret DASHBOARD_URL no GitHub.")
    exit(1)

GERENCIAS = ["FERRONORTE", "SP NORTE", "SP SUL", "MALHA CENTRAL", "MODERNIZACAO"]

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Viewport grande para garantir que layout não quebre
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        print(f"🚀 Acessando {DASHBOARD_URL}...")
        page.goto(DASHBOARD_URL)
        
        # Espera inicial generosa
        page.wait_for_selector("text=Carregando dados...", state="detached", timeout=60000)
        time.sleep(3)

        for gerencia in GERENCIAS:
            print(f"🔄 Processando: {gerencia}")
            
            try:
                # 1. ABRE O FILTRO DE GERÊNCIA
                # Estratégia: Acha o texto 'Gerência' e clica no elemento pai (div group), 
                # depois busca o ultimo div clicável dentro dele (o botão do filtro)
                filter_group = page.locator("div.group", has_text="Gerência").first
                
                # Clica na caixa do filtro (que geralmente tem borda ou texto 'Todos')
                # O seletor abaixo pega a div clicável irmã do label
                filter_btn = filter_group.locator("div").last 
                filter_btn.click()
                
                # 2. ESPERA O MENU ABRIR (CRUCIAL)
                # Só tenta digitar se o campo de busca aparecer
                page.wait_for_selector("input[placeholder='Buscar...']", state="visible", timeout=5000)

                # 3. Limpa filtros anteriores (se houver botão limpar visível)
                # O botão limpar fica dentro do portal que acabou de abrir
                btn_limpar = page.locator("button:has-text('Limpar')").last
                if btn_limpar.is_visible():
                    btn_limpar.click()
                
                # 4. Busca a Gerência
                page.fill("input[placeholder='Buscar...']", gerencia)
                time.sleep(1) # Espera visual para a lista filtrar

                # 5. Seleciona a opção
                # Clica na div que tem o texto da gerência e role='button' ou cursor-pointer
                # Usa 'visible=True' para garantir que não clica em algo oculto
                page.locator(f"div:has-text('{gerencia}')").last.click()

                # 6. Aplica
                page.click("button:has-text('Aplicar')")

                # 7. Espera o loading sumir (recarregamento dos dados)
                time.sleep(1)
                # Se aparecer loading, espera ele sumir
                if page.is_visible("text=Carregando dados..."):
                    page.wait_for_selector("text=Carregando dados...", state="detached")
                
                time.sleep(2) # Espera final para renderização dos gráficos

                # 8. Print
                screenshot_bytes = page.locator("#dashboard-content").screenshot()

                # 9. Envia
                enviar_email_formatado(gerencia, screenshot_bytes)

                # Fecha o menu de filtro se ele ainda estiver aberto (safety)
                # Clicando fora ou apertando ESC
                page.keyboard.press("Escape")
                time.sleep(0.5)

            except Exception as e:
                print(f"❌ Erro na gerência {gerencia}: {e}")
                # Recarrega a página para limpar o estado e tentar a próxima gerência limpa
                page.reload()
                page.wait_for_selector("text=Carregando dados...", state="detached")
                time.sleep(3)

        browser.close()

def enviar_email_formatado(gerencia, image_bytes):
    if not WEBHOOK_URL:
        print("⚠️ Webhook não configurado.")
        return

    b64_img = base64.b64encode(image_bytes).decode('utf-8')
    data_hoje = datetime.now().strftime("%d/%m/%Y às %H:%M")

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="max-width: 1000px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 20px; border: 1px solid #e0e0e0;">
            <div style="border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px;">
                <h2 style="color: #0056b3; margin: 0;">Status Diário: {gerencia}</h2>
                <p style="color: #666; font-size: 12px; margin-top: 5px;">Atualizado em: {data_hoje}</p>
            </div>
            <div style="text-align: center;">
                <img src="data:image/png;base64,{b64_img}" alt="Status Dashboard" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px;" />
            </div>
            <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999;">
                <p>Email automático - Sistema PCM</p>
            </div>
        </div>
    </body>
    </html>
    """

    payload = {
        "recipient": RECIPIENT_EMAIL,
        "subject": f"📍 Status Diário - {gerencia} - {datetime.now().strftime('%d/%m')}",
        "htmlContent": html_content
    }

    try:
        response = requests.post(WEBHOOK_URL, json=payload)
        if response.status_code in [200, 202]:
            print(f"✅ Email enviado: {gerencia}")
        else:
            print(f"⚠️ Erro Power Automate: {response.text}")
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")

if __name__ == "__main__":
    run()