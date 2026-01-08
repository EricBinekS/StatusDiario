import React from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../authConfig";

const LoginPage = () => {
    const { instance } = useMsal();

    const handleLogin = () => {
        instance.loginPopup(loginRequest).catch(e => {
            console.error(e);
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            
            {/* Background Decorativo Suave */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>

            {/* CARD DE LOGIN 
                Responsividade:
                - Mobile/Notebook: max-w-md (450px)
                - Monitores Grandes (2xl): Escala 110% para não ficar pequeno demais
            */}
            <div className="w-full max-w-md 2xl:max-w-lg bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden z-10 border border-slate-100 transition-all duration-300 transform 2xl:scale-105">
                
                <div className="p-8 md:p-10 flex flex-col items-center text-center">
                    
                    {/* Área das Logos (Aumentada) */}
                    <div className="flex items-center justify-center gap-6 mb-8 w-full">
                         {/* Logo Rumo (Maior destaque) */}
                         <img 
                            src="/rumo-logo.svg" 
                            alt="Rumo Logística" 
                            className="h-16 md:h-20 w-auto object-contain" 
                         />
                        
                         {/* Logo PCM (Secundário) */}
                         <img 
                            src="/logo_pcm.svg" 
                            alt="PCM" 
                            className="h-12 md:h-16 w-auto object-contain" 
                         />
                    </div>

                    {/* Textos */}
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Status Diário</h2>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed max-w-[280px]">
                        Monitoramento de aderência e controle operacional.
                    </p>

                    {/* Botão de Login Microsoft (Mais compacto) */}
                    <button
                        onClick={handleLogin}
                        className="w-full group bg-[#2F2F2F] hover:bg-[#1a1a1a] text-white font-medium py-3 px-5 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                    >
                        {/* Logo Microsoft */}
                        <div className="bg-white/10 p-1 rounded group-hover:bg-white/20 transition-colors">
                            <svg className="w-4 h-4" viewBox="0 0 21 21" fill="none">
                                <path d="M10.5 0L0 0V10.5H10.5V0Z" fill="#F25022"/>
                                <path d="M21 0H10.5V10.5H21V0Z" fill="#7FBA00"/>
                                <path d="M10.5 10.5H0V21H10.5V10.5Z" fill="#00A4EF"/>
                                <path d="M21 10.5H10.5V21H21V10.5Z" fill="#FFB900"/>
                            </svg>
                        </div>
                        
                        <span className="text-sm">Entrar com conta Corporativa</span>
                    </button>

                    <div className="mt-6 pt-4 border-t border-slate-50 w-full">
                         <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                            Acesso Restrito &bull; PCM
                         </p>
                    </div>
                </div>
                
                {/* Rodapé com Gradiente Rumo Oficial 
                    Cores: #003865 -> #32A6E6 -> #1E9F7F -> #7FE06C
                */}
                <div 
                    className="h-2 w-full"
                    style={{
                        background: 'linear-gradient(90deg, #003865 0%, #32A6E6 35%, #1E9F7F 70%, #7FE06C 100%)'
                    }}
                ></div>
            </div>
            
            {/* Copyright */}
            <div className="mt-8 text-slate-400 text-xs text-center font-medium opacity-60">
                &copy; {new Date().getFullYear()} Rumo Logística S.A.
            </div>
        </div>
    );
};

export default LoginPage;