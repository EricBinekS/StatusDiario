import React, { useMemo } from 'react';
import { CheckCircle2, Clock, XCircle, PieChart, AlertTriangle, MinusCircle } from 'lucide-react';
import { getDerivedStatus } from '../../utils/dataUtils';

const KPICards = ({ data }) => {
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
        return { aderencia: 0, realizados: 0, parcial: 0, andamento: 0, nao_iniciado: 0, cancelados: 0 };
    }

    const validData = data.filter(r => r);

    let realizados = 0;
    let parcial = 0;
    let andamento = 0;
    let nao_iniciado = 0;
    let cancelados = 0;

    validData.forEach(row => {
        const status = getDerivedStatus(row);
        
        switch(status) {
            case 'concluido': realizados++; break;
            case 'parcial': parcial++; break;
            case 'andamento': andamento++; break;
            case 'nao_iniciado': nao_iniciado++; break;
            case 'cancelado': cancelados++; break;
            default: break;
        }
    });

    const atividadesIgnoradas = [
      "DESLOCAMENTO", "DETECÇÃO - CARRO CONTROLE", "DETECÇÃO - RONDA 7 DIAS",
      "DETECÇÃO - ULTRASSOM - SPERRY", "INSPEÇÃO RIV", "INSPEÇÃO AUTO DE LINHA"
    ];

    const dataAderencia = validData.filter(r => 
        r.atividade && !atividadesIgnoradas.some(ign => r.atividade.toUpperCase().includes(ign))
    );
    
    const totalAderencia = dataAderencia.length;
    let pontos = 0;

    dataAderencia.forEach(row => {
        const st = getDerivedStatus(row);
        if (st === 'concluido') pontos += 1.0;
        else if (st === 'parcial') pontos += 0.5;
        // Cancelado, Andamento e Não Iniciado somam 0
    });

    const aderencia = totalAderencia > 0 
        ? ((pontos / totalAderencia) * 100).toFixed(1) 
        : 0;

    return { aderencia, realizados, parcial, andamento, nao_iniciado, cancelados };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
      <Card label="Aderência" value={`${stats.aderencia}%`} icon={<PieChart size={20} />} color="purple" subtext="Execução Global" />
      <Card label="Concluído" value={stats.realizados} icon={<CheckCircle2 size={20} />} color="green" subtext="Status 2 (> 90%)" />
      <Card label="Parcial" value={stats.parcial} icon={<AlertTriangle size={20} />} color="orange" subtext="Status 2 (50-90%)" />
      <Card label="Em Andamento" value={stats.andamento} icon={<Clock size={20} />} color="yellow" subtext="Status 1" />
      <Card label="Não Iniciado" value={stats.nao_iniciado} icon={<MinusCircle size={20} />} color="gray" subtext="Status Null" />
      <Card label="Não Executado" value={stats.cancelados} icon={<XCircle size={20} />} color="red" subtext="Status 0 ou < 50%" />
    </div>
  );
};

const Card = ({ label, value, icon, color, subtext }) => {
  const styles = {
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-600 dark:text-purple-400' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800', icon: 'text-green-600 dark:text-green-400' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', icon: 'text-orange-600 dark:text-orange-400' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800', icon: 'text-yellow-600 dark:text-yellow-400' },
    gray:   { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700', icon: 'text-gray-600 dark:text-gray-400' },
    red:    { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200', border: 'border-red-300 dark:border-red-700', icon: 'text-red-700 dark:text-red-400' },
  };
  
  const theme = styles[color] || styles.purple;
  
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