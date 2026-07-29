# PDV Festa Junina 🎉

Sistema de ponto de venda (PDV) open-source para gestão de eventos como Festa Junina, projetado para rodar em múltiplos computadores conectados na mesma rede WiFi local.

## Visão geral

O projeto foi construído com foco total em **simplicidade e manutenibilidade**:

- HTML/CSS/JavaScript puro — **sem frameworks, sem build tools**
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction) via CDN
- Hospedagem estática no **GitHub Pages**
- Backend em **Supabase** (Postgres + Auth + Realtime + RLS)

Essa combinação permite que qualquer pessoa clone o repositório, configure as credenciais do Supabase e tenha um sistema de PDV funcional rodando em minutos, sem etapa de compilação.

---

## Estrutura do projeto

```
├── index.html      # Landing page
├── pdv.html        # Aplicativo do operador de caixa
└── admin.html       # Painel administrativo
```

### `pdv.html` — Aplicativo do Caixa

Interface usada pelos operadores de caixa durante o evento. Principais recursos:

- Login com restauração automática de sessão
- Abertura de caixa com contagem de cédulas (dinheiro inicial) e detecção automática do evento em andamento
- Grade de produtos com indicador de estoque em tempo real
- Carrinho multi-item com controle de quantidade
- Modal de pagamento: Dinheiro, Cartão, Pix e pagamento fracionado (split), com calculadora de troco por botões de cédula
- Painel de resumo do caixa em tempo real
- Aviso de estoque crítico
- Fluxo de sangria (retirada de caixa) com contagem de cédulas
- **Modo offline** via IndexedDB, com sincronização automática ao reconectar

**Layout:** 3 colunas em viewport cheio (vendas recentes | produtos | resumo + carrinho), com rolagem independente por coluna.

> A chave anônima (anon key) do Supabase é fixada como constante no código, simplificando o login para apenas e-mail e senha.

### `admin.html` — Painel Administrativo

Interface de gestão com as seguintes abas:

| Aba | Função |
|---|---|
| **Dashboard** | Totais do período com filtro e atualização em tempo real |
| **Produtos** | CRUD com imagem (URL), limites de quantidade e observações de estoque diário |
| **Caixas** | CRUD dos caixas físicos |
| **Relatórios** | Totais gerenciais e detalhamento por caixa |
| **Estoque por Dia** | Gestão de estoque diário, com cópia de estoque de outra data e atualização em tempo real |
| **Eventos** | CRUD de eventos com intervalo de datas |
| **Conferência** | Revisão de caixas fechados (fluxo Aguardando → Conforme/Não Conforme) com justificativa obrigatória |
| **Fechamentos** | Relatório histórico de fechamentos de caixa |
| **Cancelamentos** | Log de cancelamentos com filtro de período |
| **Cédulas** | Configuração das imagens das cédulas usadas nas contagens |
| **Usuários** | Criação de usuários via cliente Supabase temporário (sem deslogar o admin) |

### `index.html` — Landing page

Página inicial do projeto.

### Recursos compartilhados

- **Dark/Light mode** (alternável via 🌙/☀️, persistido em `localStorage`)
- **Restauração de sessão** ao recarregar a página

---

## Arquitetura e decisões técnicas

### Modelagem de dados

- Vendas são escopadas por **`controle_caixa_id`** (ID da sessão de caixa), e não por `caixa_id` (caixa físico). Isso evita mistura de dados entre dias diferentes que usam o mesmo caixa físico.
- Cancelamentos usam **soft-delete** via coluna `status`, preservando o histórico.
- **`estoque_diario`** sobrescreve o limite global do produto por dia, com o estoque agregado entre todos os caixas ativos no mesmo dia.

### RLS (Row Level Security)

- Funções `security definer` (`is_admin()`, `current_caixa_id()`) são usadas nas policies de RLS.
- **Pitfall conhecido:** RLS em `vendas` falhava quando `controle_caixa_id` era nulo — corrigido adicionando um fallback para `caixa_id` na policy.

### Outras decisões

- **Ambiguidade de Foreign Key:** quando múltiplas FKs referenciam a mesma tabela, é necessário usar a sintaxe explícita de hint (ex: `usuarios!controle_caixa_usuario_id_fkey`).
- **Colisão de nomes via CDN:** evitar nomear variáveis locais como `supabase`, pois colide com o global carregado pelo CDN.
- **Referências DOM obsoletas:** chamadas de funções em nível superior que dependem de elementos DOM (ex: `renderizarValoresRapidos`) podem falhar se o elemento não existir no momento da chamada — é preciso escopar essas chamadas corretamente.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Cliente Supabase | `@supabase/supabase-js` via CDN |
| Backend | Supabase (Postgres, Auth, Realtime, RLS) |
| Hospedagem | GitHub Pages |
| Armazenamento offline | IndexedDB |

---

## Como rodar localmente

1. Clone este repositório
2. Configure um projeto no [Supabase](https://supabase.com) com as tabelas e policies do sistema
3. Atualize a URL e a `anon key` do Supabase nos arquivos `pdv.html` e `admin.html`
4. Sirva os arquivos estaticamente (ex: `npx serve .` ou extensão Live Server) ou publique via GitHub Pages
5. Acesse `index.html` como ponto de partida

## Deploy

O projeto é hospedado como site estático no **GitHub Pages**, sem qualquer etapa de build — os arquivos HTML/CSS/JS são servidos diretamente.

---

## Filosofia do projeto

- **Simplicidade acima de tudo:** sem pipeline de build, sem frameworks, dependências via CDN
- **Explícito é melhor que implícito:** hints de FK nomeados, funções security definer, constantes fixas quando fazem sentido para reduzir fricção
- **Resiliência offline como requisito de primeira classe**, dado o contexto de eventos dependentes de WiFi compartilhado em múltiplos dispositivos
- **Desenvolvimento iterativo**, construído funcionalidade por funcionalidade

---

## Licença

Este projeto está licenciado sob os termos da [Apache License 2.0](./LICENSE).
