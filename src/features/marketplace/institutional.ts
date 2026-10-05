import { formatBRL, FREE_SHIPPING_FROM, STANDARD_SHIPPING } from '@/features/marketplace/money';

export type InstitutionalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; id: string; text: string }
  | { kind: 'list'; items: string[] };

export type InstitutionalPage = {
  title: string;
  description: string;
  blocks: InstitutionalBlock[];
};

const PAGES: Record<string, InstitutionalPage> = {
  sobre: {
    title: 'Sobre a Gescom',
    description: 'O que é o Gescom Marketplace e quem opera a vitrine.',
    blocks: [
      {
        kind: 'p',
        text: 'A Gescom é o sistema de gestão da RMSys. O Marketplace é a vitrine em que o catálogo aparece para quem compra: busca, categorias, carrinho e pedidos.',
      },
      {
        kind: 'p',
        text: 'A conta, os favoritos, os endereços e o histórico desta loja ficam salvos neste aparelho. Nada disso é enviado a um servidor.',
      },
    ],
  },
  corporativo: {
    title: 'Informações corporativas',
    description: 'Quem é a responsável pelo Gescom Marketplace.',
    blocks: [
      {
        kind: 'p',
        text: 'O Gescom Marketplace faz parte do ecossistema Gescom, de propriedade da RMSys. O software é de uso exclusivo da empresa e de quem ela autoriza.',
      },
      {
        kind: 'p',
        text: 'Esta vitrine não publica balanços, quadro societário nem dados cadastrais além da identificação da RMSys como titular do produto.',
      },
    ],
  },
  acessibilidade: {
    title: 'Acessibilidade',
    description: 'Como a loja trata navegação, contraste e rótulos.',
    blocks: [
      {
        kind: 'p',
        text: 'A vitrine pode ser percorrida pelo teclado. O primeiro foco da página oferece um atalho para pular ao conteúdo.',
      },
      {
        kind: 'list',
        items: [
          'Botões, links e campos têm nome acessível.',
          'O texto usa contraste definido pela paleta da loja.',
          'O movimento da interface respeita a preferência de reduzir animação do sistema.',
          'O rodapé repete os caminhos de conta, pagamento, frete e ajuda.',
        ],
      },
      {
        kind: 'p',
        text: 'Se algum fluxo impedir a conclusão de uma tarefa, use a página de ajuda e descreva a página e o que você tentou fazer.',
      },
    ],
  },
  pagamentos: {
    title: 'Meios de pagamento',
    description: 'Pix, cartão de crédito e boleto registrados no pedido local.',
    blocks: [
      {
        kind: 'p',
        text: 'No checkout, a forma escolhida fica registrada no pedido salvo neste aparelho. Nenhuma cobrança é enviada a banco, adquirente ou carteira.',
      },
      {
        kind: 'h2',
        id: 'pix',
        text: 'Pix',
      },
      {
        kind: 'p',
        text: 'A opção Pix confirma a escolha no pedido. A loja não gera código, QR Code nem transferência.',
      },
      {
        kind: 'h2',
        id: 'cartao',
        text: 'Cartão de crédito',
      },
      {
        kind: 'p',
        text: 'O formulário valida número, nome impresso, validade e CVV apenas neste navegador. Esses dados não são transmitidos. Em pedidos elegíveis, o preço também pode ser visto em 3x sem juros.',
      },
      {
        kind: 'h2',
        id: 'boleto',
        text: 'Boleto',
      },
      {
        kind: 'p',
        text: 'O boleto é uma opção do checkout, com vencimento simulado em 2 dias úteis. Não há linha digitável nem compensação.',
      },
    ],
  },
  frete: {
    title: 'Frete e prazo de entrega',
    description: 'Quando a loja cobra frete e quando o envio sai sem custo.',
    blocks: [
      {
        kind: 'p',
        text: `O frete padrão é ${formatBRL(STANDARD_SHIPPING)}. Ele deixa de ser cobrado a partir de ${formatBRL(FREE_SHIPPING_FROM)}, ou quando todos os itens do carrinho já têm frete grátis.`,
      },
      {
        kind: 'p',
        text: 'Não há consulta de transportadora nem prazo real de entrega. O pedido permanece neste aparelho, com o valor de frete calculado na revisão.',
      },
    ],
  },
  devolucoes: {
    title: 'Devoluções e reembolsos',
    description: 'Por que esta vitrine não processa reembolso.',
    blocks: [
      {
        kind: 'p',
        text: 'Como não há cobrança nem envio, não existe reembolso a solicitar. O status do pedido pode ser acompanhado em Seus pedidos, na conta.',
      },
    ],
  },
  seguranca: {
    title: 'Alertas de segurança',
    description: 'Cuidados com senha, cartão e páginas da loja.',
    blocks: [
      {
        kind: 'list',
        items: [
          'Não informe a senha da conta fora desta loja.',
          'O cartão digitado no checkout fica só na validação do formulário e não substitui um pagamento real.',
          'Desconfie de páginas que peçam pagamento fora do checkout da Gescom.',
          'Se a tela não carregar, volte ao início e tente de novo antes de preencher dados outra vez.',
        ],
      },
    ],
  },
  ajuda: {
    title: 'Ajuda',
    description: 'Caminhos para buscar, comprar e rever um pedido.',
    blocks: [
      {
        kind: 'p',
        text: 'A busca encontra produtos pelo nome. Os filtros separam preço, condição e frete. A conta reúne pedidos, favoritos e endereços.',
      },
      {
        kind: 'list',
        items: [
          'Início: vitrine com ofertas e destaques.',
          'Carrinho: revise quantidades antes do checkout.',
          'Checkout: contato, entrega, pagamento e revisão, sem cobrança.',
          'Pedidos: histórico salvo neste navegador.',
        ],
      },
      {
        kind: 'p',
        text: 'Este canal não abre chamado nem envia e-mail. As respostas estão nas páginas institucionais e no próprio fluxo da loja.',
      },
    ],
  },
  condicoes: {
    title: 'Condições de Uso',
    description: 'O que esta vitrine é e o que ela não contrata.',
    blocks: [
      {
        kind: 'p',
        text: 'O Gescom Marketplace é a frente de loja do sistema Gescom, da RMSys. Usar a vitrine não gera contrato de venda, nota fiscal nem obrigação de entrega.',
      },
      {
        kind: 'p',
        text: 'Preços, estoque e prazos exibidos servem para percorrer a compra neste aparelho. Confirmar um pedido grava o registro localmente e não reserva produto em um centro de distribuição.',
      },
    ],
  },
  privacidade: {
    title: 'Notificação de Privacidade',
    description: 'Onde ficam conta, carrinho, endereços e pedidos.',
    blocks: [
      {
        kind: 'p',
        text: 'Conta, carrinho, favoritos, endereços e pedidos ficam no armazenamento deste navegador. A loja não envia esses dados a um servidor.',
      },
      {
        kind: 'p',
        text: 'Limpar os dados do navegador apaga a conta local e o histórico. Não há cadastro central para recuperar essa informação.',
      },
    ],
  },
  cookies: {
    title: 'Cookies',
    description: 'O que a vitrine guarda no navegador.',
    blocks: [
      {
        kind: 'p',
        text: 'A loja não usa cookies de publicidade nem de medição de audiência. Preferências da compra usam o armazenamento local do próprio aparelho.',
      },
      {
        kind: 'p',
        text: 'Não há anúncio baseado em interesse para configurar ou recusar nesta vitrine.',
      },
    ],
  },
};

export function institutionalSlugs() {
  return Object.keys(PAGES);
}

export function getInstitutionalPage(slug: string) {
  return PAGES[slug];
}
