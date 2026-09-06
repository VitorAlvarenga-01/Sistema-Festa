/* ==========================================================================
   impressao-cupom.js — Impressão via driver da impressora (window.print)
   para PDV Festa Junina

   Pontos de impressão suportados:
   1. imprimirAberturaCaixa(dados)      — na abertura de caixa
   2. imprimirFichas(itens, numeroVenda) — uma ficha por unidade vendida
   3. imprimirFechamentoCaixa(dados)     — no fechamento de caixa

   Como funciona:
   1. Monta um HTML formatado (largura de cupom térmico, 58mm ou 80mm)
      dentro de um <div> escondido no próprio pdv.html
   2. Uma <style> com @media print esconde TODO o resto da página e
      mostra só esse conteúdo no momento da impressão
   3. Chama window.print() — abre o diálogo nativo do navegador,
      o operador escolhe a impressora térmica (já instalada como
      impressora padrão do Windows) e confirma

   Requisitos de instalação (uma vez, no PC do caixa):
   - Instalar o driver oficial da impressora térmica no Windows
     (ela aparece como uma impressora normal, ex: "EPSON TM-T20")
   - Nas configurações da impressora, ajustar o tamanho do papel para
     58mm ou 80mm (o que for compatível com o modelo)
   - Opcional (recomendado): configurar o Chrome/Edge com a política de
     "kiosk printing" para pular o diálogo de impressão e imprimir
     direto na impressora padrão. Veja seção no final deste arquivo.
   ========================================================================== */

const LARGURA_CUPOM_MM = 80; // trocar para 58 se a impressora for de 58mm

/**
 * Formata a data/hora atual no padrão brasileiro.
 */
function formatarDataHoraCupom(data = new Date()) {
  return data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/**
 * Formata um valor numérico como moeda brasileira.
 */
function formatarMoedaCupom(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Garante que existe na página o container + estilos de impressão
 * necessários. É chamada automaticamente por cada função de impressão
 * na primeira vez que for usada — não precisa chamar manualmente.
 */
function garantirContainerCupom() {
  if (document.getElementById('cupom-impressao-container')) return;

  const container = document.createElement('div');
  container.id = 'cupom-impressao-container';
  document.body.appendChild(container);

  const estilo = document.createElement('style');
  estilo.id = 'cupom-impressao-estilo';
  estilo.textContent = `
    #cupom-impressao-container {
      display: none;
    }

    @media print {
      /* Esconde tudo da aplicação normal */
      body > *:not(#cupom-impressao-container) {
        display: none !important;
      }

      #cupom-impressao-container {
        display: block !important;
        width: ${LARGURA_CUPOM_MM}mm;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: #000;
      }

      @page {
        size: ${LARGURA_CUPOM_MM}mm auto;
        margin: 2mm;
      }

      .cupom-header {
        text-align: center;
        margin-bottom: 4px;
      }

      .cupom-titulo {
        font-size: 14px;
        font-weight: bold;
      }

      .cupom-sub {
        font-size: 10px;
      }

      .cupom-linha-tracejada {
        border-top: 1px dashed #000;
        margin: 4px 0;
      }

      .linha-item {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }

      .cupom-total {
        font-weight: bold;
        font-size: 13px;
      }

      .cupom-rodape {
        text-align: center;
        margin-top: 6px;
        font-size: 10px;
      }

      /* Ficha individual — uma por unidade vendida, cortada em página própria */
      .ficha {
        text-align: center;
        padding: 6mm 0;
        page-break-after: always;
      }

      .ficha:last-child {
        page-break-after: auto;
      }

      .ficha-titulo {
        font-size: 20px;
        font-weight: bold;
        text-transform: uppercase;
      }

      .ficha-sub {
        font-size: 10px;
        margin-top: 2px;
      }
    }
  `;
  document.head.appendChild(estilo);
}

/* ==========================================================================
   ABERTURA DE CAIXA
   ========================================================================== */

/**
 * @param {Object} dados
 * @param {string} dados.nomeEvento
 * @param {string} dados.caixa - ex: "Caixa 1"
 * @param {string} [dados.operador] - nome do operador que abriu
 * @param {Array<{cedula: string, quantidade: number, valorUnitario: number}>} dados.contagemCedulas
 * @param {number} dados.totalAbertura
 */
function montarHtmlAberturaCaixa(dados) {
  const linhasCedulas = dados.contagemCedulas.map(c => {
    const subtotal = c.quantidade * c.valorUnitario;
    return `
      <div class="linha-item">
        <span>${c.quantidade}x ${c.cedula}</span>
        <span>${formatarMoedaCupom(subtotal)}</span>
      </div>`;
  }).join('');

  return `
    <div class="cupom-header">
      <div class="cupom-titulo">ABERTURA DE CAIXA</div>
      <div class="cupom-sub">${dados.nomeEvento || ''}</div>
      <div class="cupom-sub">${dados.caixa || ''}</div>
      ${dados.operador ? `<div class="cupom-sub">Operador: ${dados.operador}</div>` : ''}
      <div class="cupom-sub">${formatarDataHoraCupom()}</div>
    </div>
    <div class="cupom-linha-tracejada"></div>
    ${linhasCedulas}
    <div class="cupom-linha-tracejada"></div>
    <div class="linha-item cupom-total">
      <span>TOTAL ABERTURA</span>
      <span>${formatarMoedaCupom(dados.totalAbertura)}</span>
    </div>
    <div class="cupom-linha-tracejada"></div>
    <div class="cupom-rodape">Assinatura: ____________________</div>
  `;
}

/**
 * Imprime o comprovante de abertura de caixa.
 * Chamar logo após o operador confirmar a contagem de cédulas na abertura.
 *
 *   imprimirAberturaCaixa({
 *     nomeEvento: 'Festa Junina 2026',
 *     caixa: 'Caixa 1',
 *     operador: 'Maria',
 *     contagemCedulas: [{ cedula: 'R$ 50,00', quantidade: 2, valorUnitario: 50 }],
 *     totalAbertura: 100
 *   });
 */
function imprimirAberturaCaixa(dados) {
  garantirContainerCupom();
  const container = document.getElementById('cupom-impressao-container');
  container.innerHTML = montarHtmlAberturaCaixa(dados);
  window.print();
}

/* ==========================================================================
   FICHAS — uma impressão individual por unidade vendida
   ========================================================================== */

/**
 * Monta o HTML de uma única ficha (um item, sem quantidade — é sempre "1").
 */
function montarHtmlFichaUnica(nomeItem, numeroVenda) {
  return `
    <div class="ficha">
      <div class="ficha-titulo">${nomeItem}</div>
      ${numeroVenda ? `<div class="ficha-sub">Venda #${numeroVenda}</div>` : ''}
      <div class="ficha-sub">${formatarDataHoraCupom()}</div>
    </div>
  `;
}

/**
 * Imprime uma ficha separada para CADA UNIDADE vendida, agrupada por item.
 *
 * Exemplo: se a venda tem 5 sucos e 2 águas, isso gera 7 fichas no total
 * (5 fichas de "Suco" + 2 fichas de "Água"), todas no MESMO trabalho de
 * impressão (um único diálogo), cada uma cortada como página separada.
 *
 * @param {Array<{nome: string, quantidade: number}>} itens
 * @param {string} [numeroVenda]
 *
 *   imprimirFichas([
 *     { nome: 'Suco', quantidade: 5 },
 *     { nome: 'Água', quantidade: 2 }
 *   ], venda.id);
 */
function imprimirFichas(itens, numeroVenda) {
  garantirContainerCupom();
  const container = document.getElementById('cupom-impressao-container');

  let html = '';
  itens.forEach(item => {
    for (let i = 0; i < item.quantidade; i++) {
      html += montarHtmlFichaUnica(item.nome, numeroVenda);
    }
  });

  container.innerHTML = html;
  window.print();
}

/* ==========================================================================
   FECHAMENTO DE CAIXA
   ========================================================================== */

/**
 * @param {Object} dados
 * @param {string} dados.nomeEvento
 * @param {string} dados.caixa
 * @param {string} [dados.operador]
 * @param {Array<{cedula: string, quantidade: number, valorUnitario: number}>} dados.contagemCedulas - contagem física no fechamento
 * @param {number} dados.totalAbertura
 * @param {number} dados.totalVendasDinheiro
 * @param {number} dados.totalVendasCartao
 * @param {number} dados.totalVendasPix
 * @param {number} [dados.totalSangrias]
 * @param {number} dados.totalContado - soma da contagem física de fechamento
 * @param {number} dados.totalEsperado - o que o sistema calcula que deveria ter
 */
function montarHtmlFechamentoCaixa(dados) {
  const linhasCedulas = dados.contagemCedulas.map(c => {
    const subtotal = c.quantidade * c.valorUnitario;
    return `
      <div class="linha-item">
        <span>${c.quantidade}x ${c.cedula}</span>
        <span>${formatarMoedaCupom(subtotal)}</span>
      </div>`;
  }).join('');

  const diferenca = dados.totalContado - dados.totalEsperado;
  const linhaSangria = dados.totalSangrias > 0 ? `
      <div class="linha-item">
        <span>Sangrias</span>
        <span>${formatarMoedaCupom(dados.totalSangrias)}</span>
      </div>` : '';

  return `
    <div class="cupom-header">
      <div class="cupom-titulo">FECHAMENTO DE CAIXA</div>
      <div class="cupom-sub">${dados.nomeEvento || ''}</div>
      <div class="cupom-sub">${dados.caixa || ''}</div>
      ${dados.operador ? `<div class="cupom-sub">Operador: ${dados.operador}</div>` : ''}
      <div class="cupom-sub">${formatarDataHoraCupom()}</div>
    </div>
    <div class="cupom-linha-tracejada"></div>
    <div class="linha-item">
      <span>Abertura</span>
      <span>${formatarMoedaCupom(dados.totalAbertura)}</span>
    </div>
    <div class="linha-item">
      <span>Vendas Dinheiro</span>
      <span>${formatarMoedaCupom(dados.totalVendasDinheiro)}</span>
    </div>
    <div class="linha-item">
      <span>Vendas Cartão</span>
      <span>${formatarMoedaCupom(dados.totalVendasCartao)}</span>
    </div>
    <div class="linha-item">
      <span>Vendas Pix</span>
      <span>${formatarMoedaCupom(dados.totalVendasPix)}</span>
    </div>
    ${linhaSangria}
    <div class="cupom-linha-tracejada"></div>
    <div class="linha-item cupom-total">
      <span>ESPERADO EM CAIXA</span>
      <span>${formatarMoedaCupom(dados.totalEsperado)}</span>
    </div>
    <div class="cupom-linha-tracejada"></div>
    <div class="cupom-sub" style="text-align:center; font-weight:bold;">CONTAGEM FÍSICA</div>
    ${linhasCedulas}
    <div class="linha-item cupom-total">
      <span>TOTAL CONTADO</span>
      <span>${formatarMoedaCupom(dados.totalContado)}</span>
    </div>
    <div class="cupom-linha-tracejada"></div>
    <div class="linha-item cupom-total">
      <span>DIFERENÇA</span>
      <span>${formatarMoedaCupom(diferenca)}</span>
    </div>
    <div class="cupom-linha-tracejada"></div>
    <div class="cupom-rodape">Assinatura: ____________________</div>
  `;
}

/**
 * Imprime o comprovante de fechamento de caixa, incluindo a diferença
 * entre o valor esperado (calculado pelo sistema) e o contado fisicamente
 * — útil já como registro para a conferência feita depois no admin.
 *
 *   imprimirFechamentoCaixa({
 *     nomeEvento: 'Festa Junina 2026',
 *     caixa: 'Caixa 1',
 *     operador: 'Maria',
 *     contagemCedulas: [{ cedula: 'R$ 50,00', quantidade: 4, valorUnitario: 50 }],
 *     totalAbertura: 100,
 *     totalVendasDinheiro: 350,
 *     totalVendasCartao: 200,
 *     totalVendasPix: 150,
 *     totalSangrias: 100,
 *     totalContado: 200,
 *     totalEsperado: 200
 *   });
 */
function imprimirFechamentoCaixa(dados) {
  garantirContainerCupom();
  const container = document.getElementById('cupom-impressao-container');
  container.innerHTML = montarHtmlFechamentoCaixa(dados);
  window.print();
}

/* ==========================================================================
   OPCIONAL — Pulando o diálogo de impressão (kiosk printing)

   Por padrão, window.print() abre o diálogo do navegador pedindo para o
   operador confirmar a impressora e clicar em "Imprimir". Isso é mais
   seguro/portável, mas adiciona um clique extra por venda.

   Se quiser eliminar esse clique (recomendado só depois de validar que
   tudo funciona com o diálogo normal), é possível configurar o Chrome/Edge
   para imprimir direto na impressora padrão, sem diálogo:

   1. Feche todas as janelas do Chrome/Edge
   2. Crie um atalho para o navegador com a flag:
        --kiosk-printing
      Exemplo (Windows, ajustando o caminho conforme instalação):
        "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing
   3. Sempre abra o sistema usando esse atalho no dia do evento
   4. Configure a impressora térmica como impressora PADRÃO do Windows

   Com isso, window.print() imprime direto, sem diálogo.
   ========================================================================== */
