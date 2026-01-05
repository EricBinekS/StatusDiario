import os
import sys
import requests
import base64
import time
from datetime import datetime, timedelta
import pytz
from playwright.sync_api import sync_playwright

# --- CONFIGURAÇÕES ---
# Pega URL do ambiente ou usa localhost como fallback
DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "http://localhost:5173") 
WEBHOOK_URL = os.environ.get("POWER_AUTOMATE_URL")
RECIPIENT_EMAIL = os.environ.get("RECIPIENT_EMAIL", "eric.bine@rumolog.com")
MODE = os.environ.get("MODE", "auto")

# Removemos "MALHA CENTRAL" da lista para não gerar print dela
GERENCIAS = ["FERRONORTE", "SP NORTE", "SP SUL"]

def get_target_date():
    """
    Define a data do relatório baseado no horário atual (BRT).
    - Manhã (antes das 12h): Pega dia ANTERIOR.
    - Tarde/Noite: Pega dia ATUAL.
    """
    tz_br = pytz.timezone('America/Sao_Paulo')
    now = datetime.now(tz_br)
    
    if MODE == 'today':
        return now.strftime('%Y-%m-%d')
    elif MODE == 'yesterday':
        return (now - timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Modo AUTO (Lógica do Cron)
    if now.hour < 12:
        print(f"🕒 Execução Matinal ({now.strftime('%H:%M')}). Selecionando Dia ANTERIOR.")
        target_date = now - timedelta(days=1)
    else:
        print(f"🌙 Execução Noturna ({now.strftime('%H:%M')}). Selecionando Dia ATUAL.")
        target_date = now

    return target_date.strftime('%Y-%m-%d')

def run():
    if not DASHBOARD_URL:
        print("❌ ERRO CRÍTICO: 'DASHBOARD_URL' não definida.")
        sys.exit(1)

    target_date = get_target_date()
    # Monta a URL já com a data correta para o filtro inicial
    full_url = f"{DASHBOARD_URL}/?data={target_date}"
    
    screenshots_data = [] 

    with sync_playwright() as p:
        print("🚀 Iniciando Browser...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1400})
        page = context.new_page()

        print(f"🌍 Acessando: {full_url}")
        page.goto(full_url)
        
        # Espera o carregamento inicial (ajuste o seletor conforme seu loading real)
        try:
            page.wait_for_selector("text=Carregando", state="detached", timeout=60000)
        except:
            print("⚠️ Timeout esperando loading sumir, prosseguindo...")
        
        # Injeta CSS para garantir que Malha Central suma (segurança extra)
        page.add_style_tag(content="""
            div[data-gerencia="MALHA CENTRAL"], 
            tr:contains("MALHA CENTRAL"),
            .card-malha-central { display: none !important; }
        """)
        
        time.sleep(5) # Tempo extra para renderização dos gráficos/tabelas

        for gerencia in GERENCIAS:
            print(f"🔄 Processando: {gerencia}")
            
            try:
                # --- LÓGICA DE UI DO SEU SCRIPT ORIGINAL ---
                
                # 1. Abre Filtro
                # Ajuste os seletores se o front mudou, mas mantive a lógica do seu script
                filter_group = page.locator("div.group", has_text="Gerência").first
                if filter_group.is_visible():
                    filter_btn = filter_group.locator("div").last 
                    filter_btn.click()
                    
                    # 2. Espera Menu e Busca
                    page.wait_for_selector("input[placeholder='Buscar...']", state="visible", timeout=5000)
                    
                    # 3. Limpar anteriores
                    btn_limpar = page.locator("button:has-text('Limpar')").last
                    if btn_limpar.is_visible() and btn_limpar.is_enabled():
                        btn_limpar.click()
                        time.sleep(0.5)
                    
                    # 4. Busca e Seleciona
                    page.fill("input[placeholder='Buscar...']", gerencia)
                    time.sleep(1) 
                    page.locator(f"div:has-text('{gerencia}')").last.click()

                    # 5. Aplica
                    page.click("button:has-text('Aplicar')")
                    
                    # Fecha menu clicando fora ou ESC (garantia)
                    page.keyboard.press("Escape")
                    
                    # 6. Espera recarregar
                    time.sleep(2) # Espera visual
                else:
                    print(f"⚠️ Botão de filtro não encontrado para {gerencia}")

                # 7. Print
                print(f"📸 Capturado: {gerencia}")
                
                # Tenta pegar apenas o conteúdo principal, senão pega a página toda
                if page.locator("#dashboard-content").is_visible():
                    screenshot_bytes = page.locator("#dashboard-content").screenshot()
                else:
                    screenshot_bytes = page.screenshot(full_page=True)
                
                screenshots_data.append({
                    "nome": gerencia,
                    "img": screenshot_bytes
                })

            except Exception as e:
                print(f"❌ Erro na gerência {gerencia}: {e}")
                # Tenta recuperar recarregando a página base
                page.reload()
                time.sleep(5)

        browser.close()
    
    # 9. ENVIA EMAIL
    if screenshots_data:
        enviar_email_unificado(screenshots_data, target_date)
    else:
        print("⚠️ Nenhuma imagem capturada. Email não enviado.")

def enviar_email_unificado(lista_prints, data_ref):
    if not WEBHOOK_URL:
        print("⚠️ Webhook (POWER_AUTOMATE_URL) não configurado. Pulando envio de email.")
        return

    print("📧 Montando email unificado...")
    # Formata a data para exibição no título (DD/MM/YYYY)
    data_fmt = datetime.strptime(data_ref, '%Y-%m-%d').strftime("%d/%m/%Y")
    
    html_body = f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e0e0e0; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            
            <div style="border-bottom: 2px solid #0056b3; padding-bottom: 15px; margin-bottom: 30px; text-align: center;">
                <h2 style="color: #0056b3; margin: 0; font-size: 24px;">Relatório Diário de Status</h2>
                <p style="color: #666; font-size: 14px; margin-top: 5px;">Consolidado - Data Base: <strong>{data_fmt}</strong></p>
            </div>
    """

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
        "subject": f"📊 Relatório Consolidado PCM - {data_fmt}",
        "htmlContent": html_body
    }

    try:
        response = requests.post(WEBHOOK_URL, json=payload)
        if response.status_code in [200, 202]:
            print(f"✅ Email UNIFICADO enviado com sucesso para {len(lista_prints)} gerências!")
        else:
            print(f"⚠️ Erro Power Automate: {response.text}")
    except Exception as e:
        print(f"❌ Erro de conexão ao enviar email: {e}")

if __name__ == "__main__":
    run()