export const painelData = [
  {
    id: 1,
    data: "09/12",
    status: 2, // 2 = Concluído (Verde)
    ativo: "TURMA FIXA VIA",
    atividade: "PDM - SUBSTITUIÇÃO - TRILHO",
    inicio: { prog: "08:00", real: "08:15" },
    tempo: { prog: "02:00", real: "01:45", isTimer: false },
    local: { prog: "ZMS1402", real: "ZMS1402" },
    quant: { prog: "55", real: "55" },
    detalhe: "TP pronto 09h01 / Em intervalo das 11h22 até 13h22 / Concluído com sucesso."
  },
  {
    id: 2,
    data: "09/12",
    status: 1, // 1 = Em Andamento (Amarelo)
    ativo: "SOCADORA 08",
    atividade: "MECANIZAÇÃO - SOCARIA",
    inicio: { prog: "09:30", real: "09:45" },
    tempo: { prog: "04:00", real: "01:30", isTimer: true }, // Timer ativo
    local: { prog: "KM 200", real: "KM 202" },
    quant: { prog: "1200", real: "400" },
    detalhe: "Iniciou socaria no km 200 sentido norte. Aguardando liberação de trecho à frente."
  },
  {
    id: 3,
    data: "09/12",
    status: 0, // 0 = Cancelado (Vermelho)
    ativo: "ESMERILHADORA",
    atividade: "MANUTENÇÃO CORRETIVA",
    inicio: { prog: "10:00", real: "--:--" },
    tempo: { prog: "06:00", real: "00:00", isTimer: false },
    local: { prog: "OFICINA", real: "-" },
    quant: { prog: "1", real: "0" },
    detalhe: "Cancelado devido à falta de peças de reposição no almoxarifado."
  },
  {
    id: 4,
    data: "09/12",
    status: 3, // 3 = Programado (Cinza)
    ativo: "EQUIPE SINALIZAÇÃO",
    atividade: "INSPEÇÃO DE AMV",
    inicio: { prog: "14:00", real: "--:--" },
    tempo: { prog: "02:00", real: "00:00", isTimer: false },
    local: { prog: "PÁTIO CENTRAL", real: "-" },
    quant: { prog: "4", real: "0" },
    detalhe: "Aguardando janela de manutenção programada para o período da tarde."
  },
  {
    id: 5,
    data: "09/12",
    status: 2,
    ativo: "CONTROLE VEGETAÇÃO",
    atividade: "CAPINA QUÍMICA",
    inicio: { prog: "07:00", real: "07:10" },
    tempo: { prog: "05:00", real: "04:50", isTimer: false },
    local: { prog: "LINHA TRONCO", real: "LINHA TRONCO" },
    quant: { prog: "15km", real: "15km" },
    detalhe: "Aplicação realizada conforme cronograma. Condições climáticas favoráveis."
  },
  {
    id: 6,
    data: "09/12",
    status: 1,
    ativo: "ULTRASSOM DE TRILHOS",
    atividade: "INSPEÇÃO CONTÍNUA",
    inicio: { prog: "08:00", real: "08:30" },
    tempo: { prog: "06:00", real: "03:00", isTimer: true },
    local: { prog: "TRECHO ZKA", real: "TRECHO ZKA" },
    quant: { prog: "30km", real: "12km" },
    detalhe: "Equipamento apresentou falha intermitente no sensor 2. Operando com velocidade reduzida."
  },
  {
    id: 7,
    data: "09/12",
    status: 3,
    ativo: "TURMA VOLANTE",
    atividade: "SUBSTITUIÇÃO DE DORMENTES",
    inicio: { prog: "13:00", real: "--:--" },
    tempo: { prog: "03:00", real: "00:00", isTimer: false },
    local: { prog: "KM 450", real: "-" },
    quant: { prog: "30", real: "0" },
    detalhe: "Material já posicionado no local. Aguardando equipe."
  },
  {
    id: 8,
    data: "09/12",
    status: 2,
    ativo: "SOLDA ALUMINOTÉRMICA",
    atividade: "ELIMINAÇÃO DE JUNTAS",
    inicio: { prog: "09:00", real: "09:05" },
    tempo: { prog: "02:00", real: "01:55", isTimer: false },
    local: { prog: "PÁTIO SUL", real: "PÁTIO SUL" },
    quant: { prog: "4", real: "4" },
    detalhe: "Todas as soldas aprovadas no teste visual."
  },
  {
    id: 9,
    data: "09/12",
    status: 0,
    ativo: "TRANSPORTE DE TRILHOS",
    atividade: "LOGÍSTICA",
    inicio: { prog: "06:00", real: "--:--" },
    tempo: { prog: "08:00", real: "00:00", isTimer: false },
    local: { prog: "TERMINAL 1", real: "-" },
    quant: { prog: "500t", real: "0" },
    detalhe: "Cancelado por falta de locomotiva disponível."
  },
  {
    id: 10,
    data: "09/12",
    status: 2,
    ativo: "SOCADORA 02",
    atividade: "NIVELAMENTO AUXILIAR",
    inicio: { prog: "10:00", real: "10:15" },
    tempo: { prog: "03:00", real: "02:45", isTimer: false },
    local: { prog: "TRECHO SERRA", real: "TRECHO SERRA" },
    quant: { prog: "800m", real: "800m" },
    detalhe: "Serviço concluído antecipadamente."
  },
  {
    id: 11,
    data: "09/12",
    status: 1,
    ativo: "DESGUARNECEDORA",
    atividade: "LIMPEZA DE LASTRO",
    inicio: { prog: "07:30", real: "08:00" },
    tempo: { prog: "06:00", real: "04:30", isTimer: true },
    local: { prog: "KM 150", real: "KM 152" },
    quant: { prog: "400m", real: "250m" },
    detalhe: "Solo com muita umidade dificultando o peneiramento."
  },
  {
    id: 12,
    data: "10/12",
    status: 3,
    ativo: "EQUIPE CIVIL",
    atividade: "REPARO DE DRENAGEM",
    inicio: { prog: "08:00", real: "--:--" },
    tempo: { prog: "04:00", real: "00:00", isTimer: false },
    local: { prog: "BUEIRO 42", real: "-" },
    quant: { prog: "1", real: "0" },
    detalhe: "Programado para amanhã."
  },
  {
    id: 13,
    data: "08/12",
    status: 2,
    ativo: "TURMA FIXA 03",
    atividade: "APERTO DE FIXAÇÕES",
    inicio: { prog: "08:00", real: "08:00" },
    tempo: { prog: "04:00", real: "03:50", isTimer: false },
    local: { prog: "KM 300-305", real: "KM 300-305" },
    quant: { prog: "5km", real: "5km" },
    detalhe: "Realizado reaperto em 100% das fixações do trecho."
  },
  {
    id: 14,
    data: "10/12",
    status: 3,
    ativo: "LUBRIFICADOR DE TRILHOS",
    atividade: "MANUTENÇÃO PREVENTIVA",
    inicio: { prog: "09:00", real: "--:--" },
    tempo: { prog: "02:00", real: "00:00", isTimer: false },
    local: { prog: "CURVA 15", real: "-" },
    quant: { prog: "1", real: "0" },
    detalhe: "Verificar nível de graxa e bicos injetores."
  },
  {
    id: 15,
    data: "08/12",
    status: 2,
    ativo: "VAGÃO HOPPER",
    atividade: "DESCARGA DE BRITA",
    inicio: { prog: "14:00", real: "14:20" },
    tempo: { prog: "03:00", real: "02:40", isTimer: false },
    local: { prog: "PÁTIO NORTE", real: "PÁTIO NORTE" },
    quant: { prog: "60m³", real: "60m³" },
    detalhe: "Descarga realizada para recomposição de perfil."
  }
];

export const overviewMock = [
  {
    id: "ferronorte",
    title: "Ferronorte",
    types: {
      contrato: { 
        percentual: 88, 
        meta: 85, 
        kpis: { prog_h: 120, real_h: 106, prog_int: 45, real_int: 42 }, 
        chartData: {
          semana: [
            { name: "Seg", prog: 20, real: 18 }, { name: "Ter", prog: 22, real: 21 },
            { name: "Qua", prog: 18, real: 15 }, { name: "Qui", prog: 24, real: 22 },
            { name: "Sex", prog: 20, real: 20 }, { name: "Sáb", prog: 16, real: 10 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 100, real: 90 }, { name: "Sem 2", prog: 110, real: 105 },
            { name: "Sem 3", prog: 95, real: 80 }, { name: "Sem 4", prog: 120, real: 115 }
          ]
        }
      },
      oportunidade: { 
        percentual: 65, 
        meta: 85, 
        kpis: { prog_h: 80, real_h: 52, prog_int: 30, real_int: 18 }, 
        chartData: {
          semana: [
            { name: "Seg", prog: 15, real: 10 }, { name: "Ter", prog: 15, real: 8 },
            { name: "Qua", prog: 15, real: 12 }, { name: "Qui", prog: 15, real: 10 },
            { name: "Sex", prog: 10, real: 8 }, { name: "Sáb", prog: 10, real: 4 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 60, real: 40 }, { name: "Sem 2", prog: 70, real: 35 },
            { name: "Sem 3", prog: 65, real: 50 }, { name: "Sem 4", prog: 80, real: 60 }
          ]
        }
      }
    }
  },
  {
    id: "sp_norte",
    title: "SP Norte",
    types: {
      contrato: { 
        percentual: 95, meta: 85, kpis: { prog_h: 100, real_h: 95, prog_int: 50, real_int: 50 }, 
        chartData: {
          semana: [
            { name: "Seg", prog: 20, real: 20 }, { name: "Ter", prog: 20, real: 19 },
            { name: "Qua", prog: 20, real: 20 }, { name: "Qui", prog: 20, real: 18 },
            { name: "Sex", prog: 20, real: 18 }, { name: "Sáb", prog: 0, real: 0 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 80, real: 78 }, { name: "Sem 2", prog: 85, real: 85 },
            { name: "Sem 3", prog: 90, real: 88 }, { name: "Sem 4", prog: 80, real: 80 }
          ]
        }
      },
      oportunidade: { 
        percentual: 40, meta: 85, kpis: { prog_h: 50, real_h: 20, prog_int: 20, real_int: 8 }, 
        chartData: {
          semana: [
            { name: "Seg", prog: 10, real: 2 }, { name: "Ter", prog: 10, real: 5 },
            { name: "Qua", prog: 10, real: 4 }, { name: "Qui", prog: 10, real: 5 },
            { name: "Sex", prog: 10, real: 4 }, { name: "Sáb", prog: 0, real: 0 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 40, real: 10 }, { name: "Sem 2", prog: 40, real: 15 },
            { name: "Sem 3", prog: 40, real: 12 }, { name: "Sem 4", prog: 50, real: 20 }
          ]
        }
      }
    }
  },
  {
    id: "sp_sul",
    title: "SP Sul",
    types: {
      contrato: { 
        percentual: 91, meta: 85, kpis: { prog_h: 90, real_h: 82, prog_int: 40, real_int: 38 }, 
        chartData: {
          semana: [
            { name: "Seg", prog: 18, real: 18 }, { name: "Ter", prog: 18, real: 16 }, { name: "Qua", prog: 18, real: 18 },
            { name: "Qui", prog: 18, real: 15 }, { name: "Sex", prog: 18, real: 15 }, { name: "Sáb", prog: 0, real: 0 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 70, real: 65 }, { name: "Sem 2", prog: 75, real: 70 },
            { name: "Sem 3", prog: 80, real: 75 }, { name: "Sem 4", prog: 70, real: 68 }
          ]
        }
      },
      oportunidade: { 
        percentual: 70, meta: 85, kpis: { prog_h: 60, real_h: 42, prog_int: 25, real_int: 15 }, 
        chartData: {
          semana: [
            { name: "Seg", prog: 12, real: 8 }, { name: "Ter", prog: 12, real: 10 }, { name: "Qua", prog: 12, real: 6 },
            { name: "Qui", prog: 12, real: 10 }, { name: "Sex", prog: 12, real: 8 }, { name: "Sáb", prog: 0, real: 0 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 50, real: 30 }, { name: "Sem 2", prog: 50, real: 35 },
            { name: "Sem 3", prog: 50, real: 40 }, { name: "Sem 4", prog: 60, real: 45 }
          ]
        }
      }
    }
  },
  {
    id: "central",
    title: "Malha Central",
    types: {
      contrato: { 
        percentual: 82, meta: 85, kpis: { prog_h: 110, real_h: 90, prog_int: 48, real_int: 40 },
        chartData: {
          semana: [
            { name: "Seg", prog: 22, real: 20 }, { name: "Ter", prog: 22, real: 18 }, { name: "Qua", prog: 22, real: 20 },
            { name: "Qui", prog: 22, real: 15 }, { name: "Sex", prog: 22, real: 17 }, { name: "Sáb", prog: 0, real: 0 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 100, real: 85 }, { name: "Sem 2", prog: 100, real: 80 },
            { name: "Sem 3", prog: 100, real: 90 }, { name: "Sem 4", prog: 100, real: 88 }
          ]
        }
      },
      oportunidade: { 
        percentual: 55, meta: 85, kpis: { prog_h: 70, real_h: 38, prog_int: 35, real_int: 20 },
        chartData: {
          semana: [
            { name: "Seg", prog: 14, real: 8 }, { name: "Ter", prog: 14, real: 6 }, { name: "Qua", prog: 14, real: 10 },
            { name: "Qui", prog: 14, real: 8 }, { name: "Sex", prog: 14, real: 6 }, { name: "Sáb", prog: 0, real: 0 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 60, real: 30 }, { name: "Sem 2", prog: 60, real: 35 },
            { name: "Sem 3", prog: 60, real: 40 }, { name: "Sem 4", prog: 70, real: 45 }
          ]
        }
      }
    }
  },
  {
    id: "modernizacao",
    title: "Modernização",
    types: {
      contrato: { 
        percentual: 98, meta: 85, kpis: { prog_h: 200, real_h: 196, prog_int: 10, real_int: 10 },
        chartData: {
          semana: [
            { name: "Seg", prog: 40, real: 40 }, { name: "Ter", prog: 40, real: 40 }, { name: "Qua", prog: 40, real: 38 },
            { name: "Qui", prog: 40, real: 40 }, { name: "Sex", prog: 40, real: 38 }, { name: "Sáb", prog: 0, real: 0 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 200, real: 198 }, { name: "Sem 2", prog: 200, real: 200 },
            { name: "Sem 3", prog: 200, real: 195 }, { name: "Sem 4", prog: 200, real: 199 }
          ]
        }
      },
      oportunidade: { 
        percentual: 0, meta: 85, kpis: { prog_h: 0, real_h: 0, prog_int: 0, real_int: 0 },
        chartData: { semana: [], mes: [] }
      }
    }
  },
  {
    id: "mecanizacao",
    title: "Mecanização",
    types: {
      contrato: { 
        percentual: 75, meta: 85, kpis: { prog_h: 150, real_h: 112, prog_int: 60, real_int: 45 },
        chartData: {
          semana: [
            { name: "Seg", prog: 30, real: 25 }, { name: "Ter", prog: 30, real: 20 }, { name: "Qua", prog: 30, real: 22 },
            { name: "Qui", prog: 30, real: 25 }, { name: "Sex", prog: 30, real: 20 }, { name: "Sáb", prog: 0, real: 0 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 150, real: 100 }, { name: "Sem 2", prog: 150, real: 120 },
            { name: "Sem 3", prog: 150, real: 110 }, { name: "Sem 4", prog: 150, real: 130 }
          ]
        }
      },
      oportunidade: { 
        percentual: 60, meta: 85, kpis: { prog_h: 40, real_h: 24, prog_int: 15, real_int: 10 },
        chartData: {
          semana: [
            { name: "Seg", prog: 8, real: 5 }, { name: "Ter", prog: 8, real: 6 }, { name: "Qua", prog: 8, real: 4 },
            { name: "Qui", prog: 8, real: 5 }, { name: "Sex", prog: 8, real: 4 }, { name: "Sáb", prog: 0, real: 0 }, { name: "Dom", prog: 0, real: 0 }
          ],
          mes: [
            { name: "Sem 1", prog: 30, real: 15 }, { name: "Sem 2", prog: 35, real: 20 },
            { name: "Sem 3", prog: 30, real: 18 }, { name: "Sem 4", prog: 40, real: 25 }
          ]
        }
      }
    }
  }
];