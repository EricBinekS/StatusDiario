import React, { useMemo } from 'react';
import { CheckCircle2, Clock, XCircle, PieChart } from 'lucide-react';

const KPICards = ({ data }) => {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return { aderencia: 0, realizados: 0, andamento: 0, cancelados: 0 };

    const validData = data.filter(r => r.status !== null && r.status !== undefined);
    
    const realizados = validData.filter(r => r.status === 2).length; 
    const andamento = validData.filter(r => r.status === 1).length;
    const cancelados = validData.filter(r => r.status === 0).length;

    const atividadesIgnoradas = [
      "DESLOCAMENTO", "DETECÇÃO - CARRO CONTROLE", "DETECÇÃO - RONDA 7 DIAS",
      "DETECÇÃO - ULTRASSOM - SPERRY", "INSPEÇÃO RIV", "INSPEÇÃO AUTO DE LINHA"
    ];

    const dataAderencia = validData.filter(r => !atividadesIgnoradas.includes(r.atividade));
    const totalAderencia = dataAderencia.length;
    const realizadosAderencia = dataAderencia.filter(r => r.status === 2).length;

    const aderencia = totalAderencia > 0 ? ((realizadosAderencia / totalAderencia) * 100).toFixed(1) : 0;

    return { aderencia, realizados, andamento, cancelados };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <Card label="Aderência" value={`${stats.aderencia}%`} icon={<PieChart size={20} />} color="purple" subtext="Execução Global (Ajustada)" />
      <Card label="Realizados" value={stats.realizados} icon={<CheckCircle2 size={20} />} color="green" subtext="Executados" />
      <Card label="Em Andamento" value={stats.andamento} icon={<Clock size={20} />} color="blue" subtext="Em Execução" />
      <Card label="Cancelados" value={stats.cancelados} icon={<XCircle size={20} />} color="red" subtext="Não Executados" />
    </div>
  );
};

const Card = ({ label, value, icon, color, subtext }) => {
  // CORREÇÃO DARK: Adicionado classes dark para bg, text e border
  const styles = {
    purple: { 
        bg: 'bg-purple-50 dark:bg-purple-900/20', 
        text: 'text-purple-700 dark:text-purple-300', 
        border: 'border-purple-200 dark:border-purple-800', 
        icon: 'text-purple-600 dark:text-purple-400' 
    },
    green: { 
        bg: 'bg-green-50 dark:bg-green-900/20', 
        text: 'text-green-700 dark:text-green-300', 
        border: 'border-green-200 dark:border-green-800', 
        icon: 'text-green-600 dark:text-green-400' 
    },
    blue: { 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        text: 'text-blue-700 dark:text-blue-300', 
        border: 'border-blue-200 dark:border-blue-800', 
        icon: 'text-blue-600 dark:text-blue-400' 
    },
    red: { 
        bg: 'bg-red-50 dark:bg-red-900/20', 
        text: 'text-red-700 dark:text-red-300', 
        border: 'border-red-200 dark:border-red-800', 
        icon: 'text-red-600 dark:text-red-400' 
    },
  };
  const theme = styles[color] || styles.blue;
  
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${theme.border} ${theme.bg} shadow-sm transition-all hover:shadow-md`}>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider opacity-70 ${theme.text}`}>{label}</p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className={`text-2xl font-black ${theme.text}`}>{value}</span>
          {subtext && <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">{subtext}</span>}
        </div>
      </div>
      <div className={`p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-opacity-50 dark:border-opacity-50 ${theme.border} ${theme.icon}`}>
        {icon}
      </div>
    </div>
  );
};

export default KPICards;