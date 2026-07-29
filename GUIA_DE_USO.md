# Guia de Uso — PDV Festa Junina

Guia prático para quem vai operar o sistema no dia do evento: operadores de caixa e administradores.

---

## Parte 1 — Guia do Operador de Caixa (`pdv.html`)

### 1.1 Login

1. Abra `pdv.html` no navegador do computador do caixa
2. Informe **e-mail e senha** cadastrados pelo administrador
3. Se você já estava logado anteriormente no mesmo navegador, a sessão é restaurada automaticamente

### 1.2 Abrindo o caixa

1. Ao logar, o sistema detecta automaticamente o **evento em andamento** (com base na data)
2. Conte o dinheiro inicial do caixa usando a tela de **contagem de cédulas** — informe a quantidade de cada cédula/moeda
3. Confirme a abertura

> ⚠️ A abertura de caixa cria uma nova sessão (`controle_caixa`). Todas as vendas feitas a partir daqui ficam vinculadas a essa sessão específica, não ao caixa físico de forma genérica.

### 1.3 Realizando uma venda

1. Selecione os produtos na grade — cada produto mostra o **estoque disponível em tempo real**
2. Ajuste a quantidade de cada item no carrinho
3. Clique em **Finalizar Venda**
4. Escolha a forma de pagamento:
   - **Dinheiro** — use a calculadora de troco por botões de cédula para calcular o troco automaticamente
   - **Cartão**
   - **Pix**
   - **Pagamento fracionado (split)** — combine mais de uma forma de pagamento na mesma venda
5. Confirme — a venda aparece na coluna de **vendas recentes**

### 1.4 Estoque crítico

Um banner de aviso aparece automaticamente quando um produto está com **estoque crítico**, para evitar vender além do disponível.

### 1.5 Sangria (retirada de caixa)

Quando for necessário retirar dinheiro do caixa durante o expediente (por segurança):

1. Acesse a opção de **Sangria**
2. Conte as cédulas retiradas na tela de contagem
3. Confirme — o valor fica registrado e reflete no resumo do caixa

### 1.6 Modo offline

Se a internet/WiFi cair:

- O sistema **continua funcionando normalmente** — vendas são guardadas localmente no dispositivo
- Assim que a conexão voltar, as vendas pendentes são **sincronizadas automaticamente** com o servidor
- Não é necessário fazer nada manualmente, mas evite fechar a aba do navegador enquanto estiver offline com vendas pendentes

### 1.7 Layout da tela

A tela é dividida em 3 colunas, cada uma com rolagem independente:

| Coluna | Conteúdo |
|---|---|
| Esquerda | Vendas recentes |
| Centro | Grade de produtos |
| Direita | Resumo do caixa + carrinho atual |

### 1.8 Tema claro/escuro

Use o botão 🌙/☀️ no canto da tela para alternar entre tema claro e escuro. A preferência fica salva no navegador.

---

## Parte 2 — Guia do Administrador (`admin.html`)

### 2.1 Login

Mesmo processo do PDV: e-mail e senha, com restauração de sessão automática.

### 2.2 Dashboard

Visão geral com totais do período selecionado, atualizados em tempo real conforme vendas acontecem nos caixas.

### 2.3 Cadastrando produtos (aba Produtos)

1. Acesse **Produtos → Novo Produto**
2. Preencha nome, preço, **URL da imagem**, e o **limite de quantidade** disponível
3. Use o campo de observações para notas sobre estoque diário, se necessário
4. Salve

### 2.4 Cadastrando caixas (aba Caixas)

Cadastre os caixas físicos que existirão no evento (ex: "Caixa 1", "Caixa 2"). Cada um poderá ser aberto por um operador no dia do evento.

### 2.5 Cadastrando eventos (aba Eventos)

1. Crie um evento com **data de início e fim**
2. O sistema usa esse intervalo para detectar automaticamente o evento ativo na abertura de caixa no `pdv.html`

### 2.6 Gerenciando estoque diário (aba Estoque por Dia)

1. Selecione a data desejada
2. Ajuste o limite de estoque de cada produto **especificamente para aquele dia** (sobrescreve o limite global)
3. Use **Copiar de outra data** para replicar rapidamente o estoque de um dia anterior, útil em eventos de múltiplos dias
4. As mudanças refletem em tempo real nos caixas já abertos

### 2.7 Relatórios

Acesse **Relatórios** para ver totais gerenciais e o detalhamento **por caixa**, útil para conferir o desempenho de cada ponto de venda.

### 2.8 Conferência de caixas fechados

1. Após um operador fechar o caixa, ele aparece na aba **Conferência** com status **Aguardando**
2. Compare os valores declarados no fechamento com os valores registrados no sistema
3. Marque como:
   - **Conforme** — valores batem
   - **Não Conforme** — é **obrigatório** informar uma justificativa

### 2.9 Fechamentos

Consulte o **histórico completo de fechamentos de caixa** já realizados, com todos os detalhes de cada sessão.

### 2.10 Cancelamentos

Veja o **log de vendas canceladas**, com filtro por período — útil para auditoria e identificar padrões de cancelamento.

### 2.11 Configurando cédulas (aba Cédulas)

Configure as imagens das cédulas/moedas usadas nas telas de contagem (abertura de caixa e sangria), tanto no admin quanto no PDV.

### 2.12 Criando usuários (aba Usuários)

1. Acesse **Usuários → Novo Usuário**
2. Preencha os dados do novo operador/administrador
3. O sistema cria o usuário usando um **cliente Supabase temporário**, o que garante que **você não é deslogado** durante o processo

---

## Dicas gerais

- **Antes do evento:** cadastre o evento, os caixas, os produtos e o estoque do primeiro dia com antecedência
- **No início de cada dia de evento:** confira/ajuste o estoque diário antes de os operadores abrirem os caixas
- **Durante o evento:** monitore o Dashboard e o banner de estoque crítico nos caixas
- **Ao final de cada dia:** faça a conferência dos fechamentos assim que possível, enquanto os detalhes ainda estão frescos
