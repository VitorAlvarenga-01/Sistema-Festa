# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

> **Nota:** este changelog foi reconstruído a partir do histórico de desenvolvimento iterativo do projeto. As entradas estão organizadas por área funcional. Ajuste as datas/versões conforme seus commits reais no Git.

---

## [Não lançado]

### A definir
- Licença do projeto
- Testes automatizados
- Pipeline de CI/CD (se aplicável)

---

## Landing page

### Adicionado
- `index.html` como página inicial do projeto

---

## Aplicativo do Caixa (`pdv.html`)

### Adicionado
- Login com e-mail e senha (chave anônima do Supabase fixada como constante para reduzir fricção)
- Restauração automática de sessão ao recarregar a página
- Abertura de caixa com contagem de cédulas para dinheiro inicial
- Detecção automática do evento em andamento no momento da abertura
- Grade de produtos com indicador de estoque em tempo real (via Supabase Realtime)
- Carrinho multi-item com controle de quantidade por produto
- Modal de pagamento com suporte a Dinheiro, Cartão, Pix e pagamento fracionado (split)
- Calculadora de troco por botões de cédula no pagamento em dinheiro
- Painel de resumo do caixa atualizado em tempo real
- Banner de aviso para estoque crítico
- Fluxo de sangria (retirada de caixa) com contagem de cédulas
- Modo offline com fila de vendas via IndexedDB e sincronização automática ao reconectar
- Layout em 3 colunas de viewport cheio (vendas recentes | produtos | resumo + carrinho) com rolagem independente por coluna
- Alternância de tema claro/escuro (🌙/☀️), persistida em `localStorage`

### Corrigido
- Chamadas de funções em nível superior que dependiam de elementos DOM ainda não presentes (ex: `renderizarValoresRapidos`), escopando a chamada para o momento correto

---

## Painel Administrativo (`admin.html`)

### Adicionado
- **Dashboard**: totais do período com filtro e atualização em tempo real
- **Produtos**: CRUD completo com imagem via URL, limites de quantidade e observações de estoque diário
- **Caixas**: CRUD dos caixas físicos
- **Relatórios**: totais gerenciais e detalhamento por caixa
- **Estoque por Dia**: gestão de estoque diário (`estoque_diario`), com opção de copiar estoque de outra data e atualização em tempo real
- **Eventos**: CRUD com intervalo de datas
- **Conferência**: revisão de caixas fechados com fluxo Aguardando → Conforme/Não Conforme e justificativa obrigatória para não conformidade
- **Fechamentos**: relatório histórico de fechamentos de caixa
- **Cancelamentos**: log de cancelamentos com filtro de período
- **Cédulas**: configuração das imagens de cédulas usadas nas contagens
- **Usuários**: criação de novos usuários via cliente Supabase temporário, sem deslogar o administrador atual
- Alternância de tema claro/escuro e restauração de sessão (mesmos recursos do `pdv.html`)

---

## Backend / Banco de dados (Supabase)

### Adicionado
- Modelagem de vendas escopada por `controle_caixa_id` (sessão de caixa) em vez de `caixa_id` (caixa físico), evitando mistura de dados entre dias diferentes
- Soft-delete de vendas via coluna `status`, preservando histórico em cancelamentos
- Tabela/lógica de `estoque_diario`, sobrescrevendo o limite global do produto por dia e agregando estoque entre todos os caixas ativos no mesmo dia
- Funções `security definer` (`is_admin()`, `current_caixa_id()`) para uso em policies de Row Level Security (RLS)

### Corrigido
- Policy de RLS em `vendas` que falhava quando `controle_caixa_id` era nulo — adicionado fallback para `caixa_id`
- Ambiguidade de Foreign Key em consultas com múltiplas FKs para a mesma tabela, resolvida com hints explícitos (ex: `usuarios!controle_caixa_usuario_id_fkey`)

### Notas técnicas
- Evitar nomear variáveis locais como `supabase` no JavaScript, pois colide com o objeto global carregado via CDN

---

## Infraestrutura

### Adicionado
- Hospedagem estática via GitHub Pages, sem etapa de build
- Uso do Supabase JS Client via CDN (sem gerenciador de pacotes/bundler)
