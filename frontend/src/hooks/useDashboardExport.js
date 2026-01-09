import { useState } from 'react';
import html2canvas from 'html2canvas';

export const useDashboardExport = (ref) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportImage = async () => {
    if (!ref.current) return;
    setIsExporting(true);
    
    // Pequeno delay para garantir renderização
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(ref.current, {
        scale: 3, 
        backgroundColor: null, 
        logging: false,
        useCORS: true,
        allowTaint: true, 
        onclone: (clonedDoc) => {
          // Ajustes de estilo para a captura ficar bonita (Modo Light forçado)
          const style = clonedDoc.createElement('style');
          style.innerHTML = `* { -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }`;
          clonedDoc.head.appendChild(style);
          
          const element = clonedDoc.getElementById('dashboard-content');
          if(element) {
            element.style.backgroundColor = '#f4f6f8';
            element.classList.remove('dark'); 
          }
        }
      });
      
      canvas.toBlob(async (blob) => {
        try {
          if (!blob) throw new Error("Falha ao gerar imagem");
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          // Você pode adicionar um Toast/Notificação aqui se quiser
          console.log("Imagem copiada para a área de transferência!");
        } catch (err) {
          console.error("Erro clipboard:", err);
          alert("Verifique permissões do navegador.");
        }
      }, 'image/png', 1.0);

    } catch (err) {
      console.error("Erro html2canvas:", err);
      alert("Erro ao processar imagem.");
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, handleExportImage };
};