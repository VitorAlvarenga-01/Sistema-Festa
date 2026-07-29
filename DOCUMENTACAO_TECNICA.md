# Documentação Técnica — PDV Festa Junina

Este documento detalha as decisões de arquitetura, modelagem de dados e pontos de atenção técnicos do projeto. É voltado para quem for manter, estender ou dar deploy no sistema.

---

## 1. Visão de arquitetura

```
┌─────────────┐        ┌──────────────┐        ┌──────────────────┐
│  pdv.html    │ ─────▶ │              │        │                    │
│  (caixa)     │        │   Supabase    │ ─────▶ │  Postgres (RLS)    │
├─────────────┤        │  JS Client    │        │  Auth              │
│  admin.html  │ ─────▶ │  (via CDN)    │        │  Realtime          │
└─────────────┘        └──────────────┘        └──────────────────┘
        ▲
        │  fallback offline
        ▼
   IndexedDB (fila de vendas)
```

- **Sem backend próprio**: toda a lógica de negócio roda no cliente (browser) e as regras de segurança são garantidas via **RLS no Postgres**, não em uma API intermediária.
- **Sem build step**: os arquivos HTML carregam o Supabase JS Client diretamente via `<script src="https://cdn...">`, então o deploy é literalmente copiar os arquivos estáticos para o GitHub Pages.
- **Multi-dispositivo em rede local**: vários caixas rodam `pdv.html` simultaneamente na mesma rede WiFi do evento, todos apontando para a mesma instância Supabase na nuvem — a sincronização entre caixas acontece via Supabase Realtime.

---

## 2. Modelagem de dados

### 2.1 Escopo de vendas: `controle_caixa_id` vs `caixa_id`

Decisão central do projeto: as vendas (`vendas`) são associadas a **`controle_caixa_id`**, que representa uma **sessão de abertura de caixa** (um caixa físico aberto em um dia específico), e não diretamente ao **`caixa_id`** (o caixa físico, reutilizado dia após dia).

**Por quê:** se as vendas fossem escopadas apenas por `caixa_id`, vendas de dias diferentes usando o mesmo caixa físico se misturariam nos relatórios e na conferência de fechamento. Ao escopar por sessão (`controle_caixa_id`), cada abertura/fechamento de caixa é um recorte limpo e independente.

```
caixa (física)  1 ──── N  controle_caixa (sessão/abertura)  1 ──── N  vendas
```

### 2.2 Soft-delete de vendas

Cancelamentos não removem a linha da venda — usam uma coluna **`status`** (ex: `concluida`, `cancelada`). Isso preserva o histórico completo para auditoria/conferência e alimenta a aba **Cancelamentos** do admin com o log completo.

### 2.3 Estoque diário (`estoque_diario`)

O estoque de cada produto pode variar por dia de evento (ex: acabou o item X no segundo dia). A tabela `estoque_diario` **sobrescreve** o limite global do produto para uma data específica.

- O estoque exibido no PDV é a **agregação entre todos os caixas ativos no mesmo dia**, não por caixa isolado — ou seja, se dois caixas vendem o mesmo produto simultaneamente, o estoque cai de forma compartilhada entre eles.
- O admin tem uma função de **copiar estoque de uma data para outra**, útil para eventos de múltiplos dias com catálogo repetido.

### 2.4 Eventos

Cada evento tem um intervalo de datas (`data_inicio`, `data_fim`). O `pdv.html` faz **detecção automática do evento em andamento** no momento da abertura de caixa, comparando a data atual com o intervalo cadastrado.

---

## 3. Row Level Security (RLS)

O RLS é a principal camada de segurança do sistema, já que o cliente acessa o Postgres diretamente (sem API intermediária confiável).

### 3.1 Funções `security definer`

Duas funções centrais são usadas nas policies:

- **`is_admin()`** — verifica se o usuário autenticado tem papel de administrador
- **`current_caixa_id()`** — resolve o caixa/sessão atual do usuário autenticado, usado para restringir o que cada operador de caixa pode ver/editar

Essas funções rodam com `SECURITY DEFINER` para poderem consultar tabelas (como a de usuários/papéis) que o próprio usuário autenticado não teria permissão de ler diretamente.

### 3.2 Pitfall: RLS falhando com `controle_caixa_id` nulo

**Sintoma:** vendas não apareciam / eram bloqueadas pela policy quando `controle_caixa_id` estava nulo (situação que pode ocorrer antes de a sessão ser corretamente vinculada).

**Causa:** a policy original checava igualdade estrita contra `controle_caixa_id`, e comparações com `NULL` em SQL nunca retornam `true`.

**Correção:** adicionado um **fallback para `caixa_id`** na policy, garantindo que a checagem de acesso funcione mesmo quando a venda ainda não tem `controle_caixa_id` preenchido.

> ⚠️ Ao criar novas policies sobre tabelas que referenciam `controle_caixa_id`, sempre considerar o caso de valor nulo explicitamente.

### 3.3 Ambiguidade de Foreign Key

Quando uma tabela tem **múltiplas FKs apontando para a mesma tabela referenciada** (ex: `controle_caixa` pode referenciar `usuarios` tanto pelo usuário que abriu quanto pelo que fechou o caixa), o PostgREST/Supabase não consegue inferir automaticamente qual relação usar em joins implícitos.

**Solução:** usar o hint explícito de FK na query:

```js
supabase
  .from('controle_caixa')
  .select('*, usuarios!controle_caixa_usuario_id_fkey(*)')
```

---

## 4. Frontend

### 4.1 Por que sem framework

A escolha por HTML/CSS/JS puro (sem React, Vue, bundler, etc.) foi deliberada para:

- Eliminar qualquer etapa de build — o deploy é `git push` para o GitHub Pages
- Reduzir a curva de manutenção para quem não tem stack de frontend moderna configurada
- Evitar dependência de Node/npm no ambiente de desenvolvimento

### 4.2 Cuidado com o nome global `supabase`

O CDN do Supabase expõe um objeto global chamado `supabase`. **Nunca declarar uma variável local com esse mesmo nome** (ex: `const supabase = ...` dentro de uma função), pois isso sobrescreve o cliente global dentro daquele escopo e quebra chamadas subsequentes de forma silenciosa e difícil de depurar.

```js
// ❌ Evitar
const supabase = createClient(...)

// ✅ Preferir
const supabaseClient = createClient(...)
```

### 4.3 Chamadas dependentes de elementos DOM

Algumas funções de renderização (ex: `renderizarValoresRapidos`) assumem que um elemento específico do DOM já existe na página. Se essas funções forem chamadas em nível superior do script (fora de um handler de evento ou callback pós-render), podem falhar silenciosamente ou lançar erro caso o elemento ainda não tenha sido montado.

**Boa prática adotada:** escopar essas chamadas para dentro dos pontos do fluxo onde o elemento já está garantidamente renderizado (ex: após o carregamento da aba/tela correspondente), em vez de no topo do arquivo.

### 4.4 Autenticação simplificada no PDV

A chave anônima (`anon key`) do Supabase é **fixada como constante** diretamente no código do `pdv.html` e `admin.html`. Isso é seguro porque a `anon key` é pública por design (o Supabase espera que ela fique exposta no cliente) — toda a proteção real vem das policies de RLS, não do sigilo dessa chave. Essa decisão permite que o login do operador de caixa peça apenas e-mail e senha, sem etapa extra de configuração.

---

## 5. Modo offline (`pdv.html`)

- Vendas realizadas sem conectividade são armazenadas em uma fila local no **IndexedDB**.
- Ao detectar reconexão, o sistema sincroniza automaticamente a fila pendente com o Supabase.
- Esse recurso é crítico dado o contexto de uso: eventos com muitos dispositivos na mesma rede WiFi local, sujeita a instabilidade.

**Pontos de atenção para quem for estender esse fluxo:**
- Garantir idempotência ao sincronizar (evitar duplicar uma venda caso a sincronização seja interrompida no meio)
- Tratar conflitos de estoque: uma venda offline pode ter sido feita quando o estoque real já não suportava mais aquela quantidade

---

## 6. Realtime

O Supabase Realtime é usado em pelo menos três pontos:

1. **Estoque de produtos** no `pdv.html` — badges de estoque atualizados ao vivo conforme vendas ocorrem em outros caixas
2. **Dashboard** no `admin.html` — totais do período atualizados sem necessidade de refresh
3. **Estoque por Dia** no `admin.html` — refletindo mudanças feitas por outros administradores em tempo real

---

## 7. Glossário de domínio

| Termo | Significado |
|---|---|
| **Caixa** | Ponto de venda físico (ex: "Caixa 1") |
| **Controle de Caixa** | Uma sessão específica de abertura/fechamento de um caixa físico em um dia |
| **Sangria** | Retirada de dinheiro do caixa durante o expediente (por segurança/controle) |
| **Conferência** | Processo de revisão de um caixa fechado, comparando valores declarados com os registrados no sistema |
| **Estoque Diário** | Override do limite de estoque de um produto, válido apenas para uma data específica |

---

## 8. Pontos em aberto

- [ ] Testes automatizados (unitários/e2e)
- [ ] Pipeline de CI/CD
- [ ] Estratégia formal de rollback em caso de falha de sincronização offline
