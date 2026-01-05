# Status Diário - Painel de Controle de Manutenção (PCM)

## Visão Geral

O **Status Diário** é uma aplicação web desenvolvida para o
monitoramento e análise de intervalos de manutenção ferroviária. O
sistema processa dados operacionais para fornecer duas visualizações
estratégicas: um Painel Operacional para acompanhamento em tempo real de
atividades e um Overview Gerencial para análise de indicadores de
aderência (Programado vs. Realizado) por gerência e tipo de atividade.

## Arquitetura do Sistema

O projeto segue uma arquitetura separada (Client-Server), onde o
Frontend e o Backend são implantados de forma independente.

### Stack Tecnológica

### Frontend

-   **Framework:** React (via Vite)
-   **Estilização:** Tailwind CSS
-   **Visualização de Dados:** Recharts
-   **Gerenciamento de Estado:** React Hooks e Context API

### Backend

-   **Linguagem:** Python
-   **Framework Web:** Flask
-   **Processamento de Dados:** Pandas
-   **ORM:** SQLAlchemy
-   **Banco de Dados:** PostgreSQL

### Infraestrutura e DevOps

-   **Frontend Hosting:** Vercel
-   **Backend Hosting:** Render
-   **CI/CD:** GitHub Actions (automação de relatórios e migração de
    dados)

------------------------------------------------------------------------

## Funcionalidades Principais

### 1. Painel Operacional (Dashboard)

-   Tabela interativa com dados de manutenção.
-   Filtros dinâmicos (Data, Gerência, Trecho, Ativo, Status).
-   Cálculo automático de aderência com base nos filtros aplicados.

### 2. Overview Gerencial

-   Visualização gráfica de KPIs (Key Performance Indicators).
-   Gráficos de aderência segregados por tipo (Contrato e Oportunidade).
-   Filtros temporais com alternância entre visualização Semanal e
    Mensal.

### 3. Processamento de Regras de Negócio

-   Classificação automática de gerências baseada em ativos.
-   Segregação de visualização para atividades de mecanização.

------------------------------------------------------------------------

## Instalação e Configuração Local

### Pré-requisitos

-   Node.js (v18 ou superior)
-   Python (v3.10 ou superior)
-   Git

### 1. Configuração do Backend

``` bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

Para iniciar o servidor localmente:

``` bash
python main.py
```

Servidor disponível em: `http://localhost:8000`

### 2. Configuração do Frontend

``` bash
cd frontend
npm install
```

Crie o arquivo `.env`:

``` env
VITE_API_URL=http://localhost:8000
```

Inicie a aplicação:

``` bash
npm run dev
```

------------------------------------------------------------------------

## Regras de Negócio e Processamento de Dados

### 1. Regra de Modernização (Classificação Global)

-   **Localização:** `backend/modules/data_processor.py`
-   **Descrição:** Existe uma lista predefinida de ativos
    (`ATIVOS_MODERNIZACAO`). Durante o processamento dos dados brutos,
    qualquer registro cujo ativo conste nesta lista terá sua coluna de
    **Gerência** alterada para **MODERNIZAÇÃO**.
-   **Impacto:** Alteração persistente em todo o sistema (Dashboard e
    Overview).

### 2. Regra de Mecanização (Filtro de Visualização)

-   **Localização:** `backend/services/overview_service.py`
-   **Descrição:** Existe uma lista de atividades específicas
    (`ATIVIDADES_MECANIZACAO`). O sistema gera um cartão adicional no
    Overview contendo apenas estas atividades.
-   **Impacto:** Não altera os dados do Dashboard, apenas a visualização
    gerencial.

------------------------------------------------------------------------

## Deploy e Infraestrutura

### Backend (Render)

-   Plano gratuito com hibernação após 15 minutos de inatividade.
-   Primeira requisição pode levar até 60 segundos.
-   CORS liberado (`origins: "*"`) no `main.py`.

### Frontend (Vercel)

-   **Build Command:** `npm run build`
-   **Output Directory:** `dist`
-   **Roteamento:** `vercel.json` redirecionando todas as rotas para
    `index.html`.

### Automação e CI/CD

-   GitHub Actions para relatórios diários e migração de dados.
-   Commits automáticos utilizam a tag `[skip ci]` para evitar loop de
    deploy.

------------------------------------------------------------------------

## Solução de Problemas Comuns

### Dados não aparecem no Dashboard

-   Verifique se o backend está ativo.
-   Aguarde a retomada do serviço no Render (plano gratuito).
-   Confirme a variável `VITE_API_URL`.

### Filtros vazios ou incompletos

-   Filtros são dinâmicos e dependem dos dados recebidos.
-   Verifique o estado inicial dos filtros em `DashboardPage.jsx`.

### Erros de Data (Minified React Error #31)

-   Objetos `Date` não são renderizados diretamente no React.
-   Formate datas como string antes de exibir no JSX.

------------------------------------------------------------------------

**Equipe PCM - Planejamento e Controle de Manutenção**
