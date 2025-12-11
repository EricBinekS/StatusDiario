# Status Diário - Painel de Controle de Manutenção (PCM)

## Visão Geral

O **Status Diário** é uma aplicação web desenvolvida para o monitoramento e análise de intervalos de manutenção ferroviária. O sistema processa dados operacionais para fornecer duas visualizações estratégicas: um Painel Operacional para acompanhamento em tempo real de atividades e um Overview Gerencial para análise de indicadores de aderência (Programado vs. Realizado) por gerência e tipo de atividade.

## Arquitetura do Sistema

O projeto segue uma arquitetura separada (Client-Server), onde o Frontend e o Backend são implantados de forma independente.

### Stack Tecnológica

**Frontend:**

  * **Framework:** React (via Vite)
  * **Estilização:** Tailwind CSS
  * **Visualização de Dados:** Recharts
  * **Gerenciamento de Estado:** React Hooks e Context API

**Backend:**

  * **Linguagem:** Python
  * **Framework Web:** Flask
  * **Processamento de Dados:** Pandas
  * **ORM:** SQLAlchemy
  * **Banco de Dados:** PostgreSQL

**Infraestrutura e DevOps:**

  * **Frontend Hosting:** Vercel
  * **Backend Hosting:** Render
  * **CI/CD:** GitHub Actions (automação de relatórios e migração de dados)

-----

## Funcionalidades Principais

1.  **Painel Operacional (Dashboard):**

      * Tabela interativa com dados de manutenção.
      * Filtros dinâmicos (Data, Gerência, Trecho, Ativo, Status).
      * Cálculo automático de aderência com base nos filtros aplicados.

2.  **Overview Gerencial:**

      * Visualização gráfica de KPIs (Key Performance Indicators).
      * Gráficos de aderência segregados por tipo (Contrato e Oportunidade).
      * Filtros temporais com alternância entre visualização Semanal e Mensal.

3.  **Processamento de Regras de Negócio:**

      * Classificação automática de gerências baseada em ativos.
      * Segregação de visualização para atividades de mecanização.

-----

## Instalação e Configuração Local

### Pré-requisitos

  * Node.js (v18 ou superior)
  * Python (v3.10 ou superior)
  * Git

### 1\. Configuração do Backend

Navegue até o diretório do backend e configure o ambiente virtual:

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

Para iniciar o servidor localmente:

```bash
python main.py
```

O servidor iniciará em `http://localhost:8000`.

### 2\. Configuração do Frontend

Em um novo terminal, navegue até o diretório do frontend:

```bash
cd frontend
npm install
```

Crie um arquivo `.env` na raiz do diretório `frontend` com o seguinte conteúdo (ajuste a URL conforme necessário):

```env
VITE_API_URL=http://localhost:8000
```

Para iniciar a aplicação:

```bash
npm run dev
```

-----

## Regras de Negócio e Processamento de Dados

O sistema implementa regras específicas para a categorização de dados que alteram a forma como as informações são armazenadas e visualizadas.

### 1\. Regra de Modernização (Classificação Global)

  * **Localização:** `backend/modules/data_processor.py`
  * **Descrição:** Existe uma lista predefinida de ativos (`ATIVOS_MODERNIZACAO`). Durante o processamento dos dados brutos, qualquer registro cujo ativo conste nesta lista terá sua coluna de "Gerência" alterada para "MODERNIZAÇÃO".
  * **Impacto:** Esta alteração é persistente na visualização do sistema, afetando tanto os filtros do Dashboard quanto os agrupamentos do Overview.

### 2\. Regra de Mecanização (Filtro de Visualização)

  * **Localização:** `backend/services/overview_service.py`
  * **Descrição:** Existe uma lista de atividades específicas (`ATIVIDADES_MECANIZACAO`). O sistema gera um cartão de visualização adicional no Overview contendo apenas os dados destas atividades.
  * **Impacto:** Diferente da Modernização, esta regra não altera os dados originais na tabela do Dashboard. Ela serve apenas como uma "lente" analítica no painel gerencial.

-----

## Deploy e Infraestrutura

### Considerações sobre o Backend (Render)

O backend está hospedado no plano gratuito do Render. Este plano coloca o serviço em estado de hibernação após 15 minutos de inatividade.

  * **Comportamento:** A primeira requisição após um período inativo pode levar até 60 segundos para responder enquanto o serviço reinicia.
  * **Configuração CORS:** O arquivo `main.py` está configurado para aceitar requisições de qualquer origem (`origins: "*"`) para garantir compatibilidade com as URLs dinâmicas de deploy do Vercel.

### Considerações sobre o Frontend (Vercel)

O frontend é implantado na Vercel.

  * **Build Command:** `npm run build`
  * **Output Directory:** `dist`
  * **Roteamento:** Um arquivo `vercel.json` é utilizado para redirecionar todas as rotas para o `index.html`, garantindo o funcionamento do React Router.

### Automação e CI/CD

O projeto utiliza GitHub Actions para tarefas agendadas (relatórios diários e migração de dados).

  * **Prevenção de Loop de Deploy:** Todos os commits gerados automaticamente pelos scripts de automação incluem a tag `[skip ci]` na mensagem. Isso é mandatório para evitar que cada atualização de dados dispare um novo deploy na Vercel, o que consumiria a cota de build rapidamente.

-----

## Solução de Problemas Comuns

### Dados não aparecem no Dashboard

Verifique se o backend está ativo. Se estiver utilizando o Render no plano gratuito, aguarde alguns instantes e recarregue a página. Verifique também se a variável de ambiente `VITE_API_URL` no frontend está apontando corretamente para o backend.

### Filtros vazios ou incompletos

Os filtros são gerados dinamicamente com base nos dados recebidos. Se novas categorias (como "MODERNIZAÇÃO") forem introduzidas, o frontend detectará automaticamente. Caso as linhas não apareçam, verifique se o estado inicial do filtro no `DashboardPage.jsx` está configurado para aceitar todas as opções disponíveis.

### Erros de Data (Minified React Error \#31)

O React não renderiza objetos `Date` nativos diretamente. Certifique-se de formatar qualquer data para string (exemplo: `.toLocaleDateString()`) antes de exibi-la em componentes JSX.

-----

**Equipe PCM - Planejamento e Controle de Manutenção**
