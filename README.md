# Status Diário - Painel de Controle de Manutenção (PCM)

## Visão Geral

O **Status Diário** é uma aplicação web desenvolvida para o monitoramento e análise de intervalos de manutenção ferroviária. O sistema processa dados operacionais para fornecer duas visualizações estratégicas:

* **Painel Operacional**: acompanhamento em tempo real das atividades.
* **Overview Gerencial**: análise de indicadores de aderência (*Programado vs. Realizado*) por gerência e tipo de atividade.

---

## Arquitetura do Sistema

O projeto adota uma arquitetura **Client–Server**, com Frontend e Backend implantados de forma independente. O Banco de Dados utiliza uma estrutura otimizada em **tabela única (`atividades`)**, reduzindo complexidade e melhorando a performance.

### Stack Tecnológica

#### Frontend

* **Framework:** React (Vite)
* **Estilização:** Tailwind CSS (com suporte a Dark Mode)
* **Visualização de Dados:** Recharts (gráficos) e Lucide React (ícones)
* **Gerenciamento de Estado:** React Hooks e Context API
* **Autenticação:** MSAL (Microsoft Authentication Library) integrado ao Azure AD

#### Backend

* **Linguagem:** Python
* **Framework Web:** Flask (API REST)
* **Banco de Dados:** PostgreSQL
* **ORM:** SQLAlchemy (consultas diretas e performáticas)

#### Infraestrutura e DevOps

* **Frontend Hosting:** Vercel
* **Backend Hosting:** Render
* **CI/CD:** GitHub Actions (deploy e automações)

---

## Funcionalidades Principais

### 1. Painel Operacional (Dashboard)

* **Tabela Interativa:** lista detalhada de atividades com status visual (indicadores coloridos).
* **Live Timer:** cronômetro em tempo real para atividades *Em Andamento*.
* **Filtros Dinâmicos:** data, gerência, trecho, ativo, status e tipo (Contrato/Oportunidade).
* **Cards de KPI:** contadores rápidos por status (Realizado, Parcial, Cancelado, etc).

### 2. Overview Gerencial

* **KPIs Globais:** aderência percentual total e horas (Programado vs. Realizado).
* **Gráficos Analíticos:**

  * Evolução diária/semanal (horas programadas vs realizadas).
  * Status global (gráfico de rosca com distribuição dos apontamentos).
* **Cards por Gerência:** visão segregada com metas individuais para Contrato e Oportunidade.
* **Visão de Mecanização:** card consolidado transversal agrupando atividades de maquinário pesado.

---

## Instalação e Configuração Local

### Pré-requisitos

* Node.js **v18+**
* Python **v3.10+**
* Git

---

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / Mac
source venv/bin/activate

pip install -r requirements.txt
```

Inicie o servidor local:

```bash
python -m backend.app
```

Servidor disponível em:

```
http://localhost:8000
```

---

### 2. Frontend

```bash
cd frontend
npm install
```

Crie o arquivo `.env` na raiz da pasta **frontend**:

```env
VITE_API_URL=http://localhost:8000/api
VITE_MSAL_CLIENT_ID=seu_client_id
VITE_MSAL_TENANT_ID=seu_tenant_id
```

Inicie a aplicação:

```bash
npm run dev
```

---

## Regras de Negócio e Processamento de Dados

### 1. Estrutura de Dados (DB Plano)

O sistema opera sobre uma **tabela única (`atividades`)**, contendo colunas explícitas para dados programados e realizados:

* `inicio_prog`
* `inicio_real`
* `tempo_prog`
* `tempo_real`

Essa abordagem elimina a necessidade de parsing complexo de JSON no Frontend.

---

### 2. Tratamento de Dados (ETL em Tempo Real)

Os serviços do Backend (`dashboard_service.py` e `overview_service.py`) aplicam regras de saneamento:

* Registros sem **Gerência válida** são descartados.
* Horários no formato `HH:MM` são convertidos para valores numéricos (`float`) para cálculo de KPIs.

---

### 3. Regra de Mecanização (Visão Transversal)

**Localização:** `backend/services/overview_service.py`

**Descrição:**

O sistema varre todas as atividades e, ao identificar palavras-chave como:

* `SOCARIA`
* `REGULADORA`
* `MECANIZADA`

é criada uma **cópia lógica** dessas atividades para um card específico chamado **MECANIZAÇÃO**.

**Impacto:**

Permite ao gestor de mecanização visualizar a produção consolidada sem remover a responsabilidade da gerência de origem.

---

## Deploy e Infraestrutura

### Backend (Render)

* Serviço Web Python com **Gunicorn**.
* Variáveis de ambiente:

  * `DATABASE_URL`
  * `FLASK_ENV`
* **Health Check:** rota `/api/last-update` para manter o serviço ativo.

### Frontend (Vercel)

* Build automático via **Git Push**.
* Arquivo `vercel.json` configurado para **SPA**, redirecionando rotas para `index.html`.

### Banco de Dados (PostgreSQL)

* Hospedagem externa (Neon, Supabase ou Render Postgres).
* Tabela `migration_log` controla a data/hora da última carga de dados, exibida no cabeçalho da aplicação.

---

## Solução de Problemas Comuns

### Tela branca ou "Carregando..." infinito

* Verifique se o Backend está em execução.
* Confirme se `VITE_API_URL` aponta corretamente para a API (incluindo `/api`).

### Gráfico de "Hoje" vazio

* O gráfico diário depende do campo `inicio_real`.
* Atividades com status `NAO_INICIADO` não aparecem como realizadas.

### Erro de CORS

* Caso o Frontend (`localhost:5173`) não acesse o Backend (`localhost:8000`), instale e configure o **flask-cors** no `app.py`.

---

## Equipe

**PCM – Planejamento e Controle de Manutenção**

**Versão Atual:** `v4.0`
