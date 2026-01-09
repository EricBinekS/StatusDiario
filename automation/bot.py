import os
import sys
import requests
import base64
import time
import argparse
from urllib.parse import quote  # Importante para codificar caracteres especiais
from datetime import datetime, timedelta
import pytz
from playwright.sync_api import sync_playwright

DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "http://localhost:5173") 
WEBHOOK_URL = os.environ.get("POWER_AUTOMATE_URL")
DEFAULT_RECIPIENT = os.environ.get("RECIPIENT_EMAIL", "eric.bine@rumolog.com")
MODE = os.environ.get("MODE", "auto")
BOT_BYPASS_KEY = os.environ.get("BOT_BYPASS_KEY")

GERENCIAS = ["FERRONORTE", "SP NORTE", "SP SUL"]

def get_target_date():
    try:
        tz_br = pytz.timezone('America/Sao_Paulo')
        now = datetime.now(tz_br)
    except:
        now = datetime.now()

    if MODE == 'today':
        return now.strftime('%Y-%m-%d')
    elif MODE == 'yesterday':
        return (now - timedelta(days=1)).strftime('%Y-%m-%d')
    
    if now.hour < 12:
        target_date = now - timedelta(days=1)
    else:
        target_date = now

    return target_date.strftime('%Y-%m-%d')

def run(email_destino=None):
    if not DASHBOARD_URL:
        sys.exit(1)
    
    final_email = email_destino if email_destino else DEFAULT_RECIPIENT
    target_date = get_target_date()
    
    # Remove barra final da URL para evitar duplicidade (http://...//?data)
    clean_base_url = DASHBOARD_URL.rstrip('/')
    
    if BOT_BYPASS_KEY:
        # quote() garante que espaços e símbolos na senha sejam convertidos para URL (ex: espaço -> %20)
        safe_key = quote(BOT_BYPASS_KEY)
        full_url = f"{clean_base_url}/?data={target_date}&bot_key={safe_key}"
        print(f"🔑 Chave de bypass detectada. Acessando modo robô...")
    else:
        full_url = f"{clean_base_url}/?data={target_date}"
        print(f"⚠️ Sem chave de bypass. Tentando acesso normal...")

    screenshots_data = [] 

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1400})
        page = context.new_page()

        print(f"🚀 Acessando URL (Mascarada): {full_url.replace(BOT_BYPASS_KEY if BOT_BYPASS_KEY else 'N/A', '***')}")
        
        try:
            page.goto(full_url, timeout=60000)
            
            # Tenta esperar o carregamento, mas segue se der timeout (às vezes já carregou)
            try:
                page.wait_for_selector("text=Carregando", state="detached", timeout=15000)
            except:
                pass
            
            # Injeção de CSS para ocultar Malha Central
            page.add_style_tag(content="""
                div[data-gerencia="MALHA CENTRAL"], 
                tr:contains("MALHA CENTRAL"),
                .card-malha-central { display: none !important; }
            """)
            
            time.sleep(5) # Espera técnica para garantir renderização dos gráficos

            for gerencia in GERENCIAS:
                try:
                    # Lógica de Filtro
                    filter_group = page.locator("div.group", has_text="Gerência").first
                    if filter_group.is_visible():
                        filter_btn = filter_group.locator("div").last 
                        filter_btn.click()
                        
                        page.wait_for_selector("input[placeholder='Buscar...']", state="visible", timeout=5000)

                        btn_limpar = page.locator("button:has-text('Limpar')").last
                        if btn_limpar.is_visible() and btn_limpar.is_enabled():
                            btn_limpar.click()
                            time.sleep(0.5)
                        
                        page.fill("input[placeholder='Buscar...']", gerencia)
                        time.sleep(1) 

                        page.locator(f"div:has-text('{gerencia}')").last.click()
                        page.click("button:has-text('Aplicar')")
                        
                        # Espera loading do filtro sumir
                        time.sleep(1)
                        if page.is_visible("text=Carregando dados..."):
                            try:
                                page.wait_for_selector("text=Carregando dados...", state="detached", timeout=10000)
                            except:
                                pass
                        time.sleep(2)
                        
                        page.keyboard.press("Escape")
                    
                    # Screenshot
                    if page.locator("#dashboard-content").is_visible():
                        screenshot_bytes = page.locator("#dashboard-content").screenshot()
                    else:
                        screenshot_bytes = page.screenshot(full_page=True)
                    
                    screenshots_data.append({
                        "nome": gerencia,
                        "img": screenshot_bytes
                    })
                    print(f"📸 Capturado: {gerencia}")

                except Exception as e:
                    print(f"❌ Erro na gerência {gerencia}: {e}")
                    page.reload()
                    time.sleep(5)

        except Exception as e:
            print(f"🔥 Erro fatal ao carregar página: {e}")
        
        finally:
            browser.close()
    
    if screenshots_data:
        enviar_email_unificado(screenshots_data, target_date, final_email)
    else:
        print("⚠️ Nenhuma imagem capturada. Abortando envio.")

def enviar_email_unificado(lista_prints, data_ref, email_destino):
    if not WEBHOOK_URL:
        print("⚠️ Webhook URL não configurada. Pulando envio.")
        return

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
        "recipient": email_destino,
        "subject": f"📊 Relatório Consolidado PCM - {data_fmt}",
        "htmlContent": html_body
    }

    try:
        r = requests.post(WEBHOOK_URL, json=payload)
        print(f"✅ Email enviado! Status: {r.status_code}")
    except Exception as e:
        print(f"❌ Falha no envio do email: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--email', type=str, help='Email de teste', default=None)
    args = parser.parse_args()
    
    run(email_destino=args.email)