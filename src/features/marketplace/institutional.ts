import { formatBRL, FREE_SHIPPING_FROM, STANDARD_SHIPPING } from '@/features/marketplace/money';

export const COMPANY = {
  product: 'Gescom',
  marketplace: 'Gescom Marketplace',
  owner: 'RMSys',
  cnpj: '12.345.678/0001-00',
  segment: 'Sistema de gestão empresarial (ERP)',
} as const;

export type InstitutionalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'lead'; text: string }
  | { kind: 'h2'; id: string; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'facts'; items: { label: string; value: string }[] }
  | { kind: 'highlights'; items: { title: string; text: string }[] }
  | { kind: 'faq'; items: { question: string; answer: string }[] }
  | { kind: 'cta'; label: string; text: string };

export type InstitutionalPage = {
  title: string;
  description: string;
  /** Layout com logo e hierarquia institucional (Sobre / Corporativo). */
  presentation?: 'article' | 'brand';
  eyebrow?: string;
  /** Aviso discreto de que o checkout desta vitrine é demonstrativo. */
  demoNotice?: boolean;
  blocks: InstitutionalBlock[];
};

const PAGES: Record<string, InstitutionalPage> = {
  sobre: {
    title: 'Sobre a Gescom',
    description:
      'Conheça a Gescom, o sistema de gestão da RMSys, e o Marketplace como vitrine digital do catálogo.',
    presentation: 'brand',
    eyebrow: `${COMPANY.owner} · ${COMPANY.product}`,
    blocks: [
      {
        kind: 'lead',
        text: 'A Gescom é o sistema de gestão empresarial da RMSys. O Marketplace é a frente de loja desse ecossistema: o ponto em que o catálogo encontra quem pesquisa, compara e conclui um pedido.',
      },
      {
        kind: 'facts',
        items: [
          { label: 'Empresa', value: COMPANY.owner },
          { label: 'Produto', value: COMPANY.product },
          { label: 'Segmento', value: COMPANY.segment },
          { label: 'Vitrine', value: COMPANY.marketplace },
        ],
      },
      {
        kind: 'h2',
        id: 'quem-somos',
        text: 'Quem somos',
      },
      {
        kind: 'p',
        text: 'A RMSys desenvolve e mantém a Gescom para apoiar a operação comercial e administrativa das empresas que utilizam o sistema. O Marketplace nasce dessa mesma linha: organizar a experiência de compra com a identidade, a paleta e o rigor do produto Gescom.',
      },
      {
        kind: 'p',
        text: 'Nesta vitrine, o foco é a jornada do comprador — da busca ao pedido — com a clareza de que conta, favoritos, endereços e histórico permanecem neste aparelho, sem envio a um servidor externo.',
      },
      {
        kind: 'h2',
        id: 'o-que-oferecemos',
        text: 'O que o Marketplace oferece',
      },
      {
        kind: 'highlights',
        items: [
          {
            title: 'Catálogo organizado',
            text: 'Busca, categorias e filtros para localizar produtos com rapidez e comparar opções no mesmo fluxo.',
          },
          {
            title: 'Compra assistida',
            text: 'Carrinho, checkout e acompanhamento de pedidos reunidos na conta, com a linguagem visual da Gescom.',
          },
          {
            title: 'Dados no aparelho',
            text: 'Preferências e histórico da loja ficam no navegador deste dispositivo, sob controle de quem usa a vitrine.',
          },
          {
            title: 'Ecossistema Gescom',
            text: 'A loja dialoga com o propósito do ERP: tornar a operação comercial compreensível, consistente e confiável.',
          },
        ],
      },
      {
        kind: 'h2',
        id: 'compromisso',
        text: 'Nosso compromisso',
      },
      {
        kind: 'list',
        items: [
          'Manter a identidade Gescom em cada etapa da compra.',
          'Explicar com transparência o que a vitrine faz e o que ela não processa.',
          'Priorizar navegação clara, contraste legível e caminhos de ajuda acessíveis.',
          'Respeitar o caráter proprietário do software e o uso autorizado pela RMSys.',
        ],
      },
      {
        kind: 'p',
        text: 'Para informações legais, titularidade e propriedade intelectual, consulte a página de informações corporativas.',
      },
    ],
  },
  corporativo: {
    title: 'Informações corporativas',
    description:
      'Titularidade, identificação e propriedade intelectual do Gescom Marketplace, operado pela RMSys.',
    presentation: 'brand',
    eyebrow: 'Identificação institucional',
    blocks: [
      {
        kind: 'lead',
        text: 'O Gescom Marketplace integra o ecossistema Gescom e é de propriedade da RMSys. Esta página reúne a identificação institucional relevante para quem utiliza a vitrine.',
      },
      {
        kind: 'facts',
        items: [
          { label: 'Titular', value: COMPANY.owner },
          { label: 'Marca / produto', value: COMPANY.product },
          { label: 'Vitrine', value: COMPANY.marketplace },
          { label: 'CNPJ', value: COMPANY.cnpj },
        ],
      },
      {
        kind: 'h2',
        id: 'titularidade',
        text: 'Titularidade',
      },
      {
        kind: 'p',
        text: 'A RMSys é a titular do software Gescom e das superfícies digitais a ele vinculadas, incluindo este Marketplace. O uso do sistema e da vitrine é exclusivo da empresa e das pessoas ou organizações por ela autorizadas.',
      },
      {
        kind: 'p',
        text: 'O código-fonte, a marca, a identidade visual e os materiais associados são proprietários e confidenciais. Não constituem software de código aberto e não podem ser copiados, redistribuídos ou empregados fora do escopo autorizado.',
      },
      {
        kind: 'h2',
        id: 'escopo-desta-vitrine',
        text: 'Escopo desta vitrine',
      },
      {
        kind: 'highlights',
        items: [
          {
            title: 'Finalidade',
            text: 'Demonstrar e operar a experiência de loja do ecossistema Gescom: catálogo, conta local, carrinho e pedidos neste aparelho.',
          },
          {
            title: 'O que não publicamos',
            text: 'Esta página não divulga balanços, quadro societário, atas ou documentos societários além da identificação do titular.',
          },
          {
            title: 'Cobrança e entrega',
            text: 'Confirmar um pedido registra a escolha localmente. Não há cobrança bancária nem obrigação de entrega física nesta vitrine.',
          },
          {
            title: 'Contato institucional',
            text: 'Dúvidas sobre acesso, uso ou permissões devem ser encaminhadas à RMSys pelos canais oficiais da empresa.',
          },
        ],
      },
      {
        kind: 'h2',
        id: 'propriedade-intelectual',
        text: 'Propriedade intelectual',
      },
      {
        kind: 'list',
        items: [
          `Copyright © ${COMPANY.owner}. Todos os direitos reservados.`,
          'É proibida a reprodução, redistribuição, engenharia reversa ou sublicenciamento não autorizado.',
          'A marca Gescom e os elementos visuais da loja pertencem à RMSys ou são por ela licenciados.',
          'O acesso ao repositório e ao produto permanece restrito a colaboradores e parceiros com permissão explícita.',
        ],
      },
      {
        kind: 'p',
        text: 'Para condições de uso da vitrine, privacidade e cookies, utilize as páginas legais disponíveis no rodapé.',
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
    description:
      'Formas de pagamento aceitas na Gescom Marketplace: Pix, cartão de crédito e boleto, com orientações para finalizar a compra com segurança.',
    presentation: 'brand',
    eyebrow: 'Pagamentos · Gescom Marketplace',
    demoNotice: true,
    blocks: [
      {
        kind: 'lead',
        text: 'Aceitamos Pix, cartão de crédito e boleto bancário. Escolha a forma no checkout, confira o resumo do pedido e acompanhe a confirmação em Seus pedidos.',
      },
      {
        kind: 'facts',
        items: [
          { label: 'Pix', value: 'Confirmação em minutos' },
          { label: 'Cartão', value: 'Até 3x sem juros*' },
          { label: 'Boleto', value: 'Vencimento em 2 dias úteis' },
          { label: 'Acompanhamento', value: 'Conta → Seus pedidos' },
        ],
      },
      {
        kind: 'h2',
        id: 'pix',
        text: 'Pix',
      },
      {
        kind: 'p',
        text: 'O Pix é a opção mais rápida: após a confirmação do pagamento, o pedido segue para preparação. Use apenas o QR Code ou a chave exibidos no checkout oficial da Gescom — nunca em links recebidos por mensagem ou e-mail não solicitados.',
      },
      {
        kind: 'list',
        items: [
          'Confira o valor e o destinatário antes de autorizar a transferência no aplicativo do banco.',
          'Guarde o comprovante até o pedido constar como pago em Seus pedidos.',
          'Se o status não atualizar em poucos minutos, atualize a página ou fale com o suporte informando o código do pedido.',
        ],
      },
      {
        kind: 'h2',
        id: 'cartao',
        text: 'Cartão de crédito',
      },
      {
        kind: 'p',
        text: 'Informe número, nome impresso, validade e CVV apenas no formulário do checkout. Em pedidos elegíveis, o valor pode ser parcelado em até 3x sem juros; a condição aparece no resumo antes da confirmação.',
      },
      {
        kind: 'list',
        items: [
          'Verifique o limite disponível e os dados do titular antes de finalizar.',
          'A loja não solicita senha do cartão, token do banco ou fotos de documento por chat ou e-mail.',
          'Em caso de recusa, tente outro cartão ou escolha Pix ou boleto; o pedido só é confirmado após aprovação.',
        ],
      },
      {
        kind: 'p',
        text: '*Parcelamento em 3x sem juros quando o valor do pedido atender à regra exibida no checkout.',
      },
      {
        kind: 'h2',
        id: 'boleto',
        text: 'Boleto bancário',
      },
      {
        kind: 'p',
        text: 'O boleto é gerado ao finalizar o pedido, com vencimento em 2 dias úteis. Após o pagamento e a compensação bancária, o status é atualizado em Seus pedidos.',
      },
      {
        kind: 'list',
        items: [
          'Pague apenas a linha digitável ou o código de barras do boleto emitido no checkout da Gescom.',
          'Pedidos com boleto vencido e não pago podem ser cancelados automaticamente.',
          'A compensação costuma ocorrer em até 2 dias úteis após o pagamento; feriados podem estender esse prazo.',
        ],
      },
      {
        kind: 'h2',
        id: 'orientacoes',
        text: 'Orientações gerais',
      },
      {
        kind: 'highlights',
        items: [
          {
            title: 'Antes de confirmar',
            text: 'Revise itens, frete, endereço e forma de pagamento no resumo do checkout. Depois da confirmação, alterações dependem de análise do suporte.',
          },
          {
            title: 'Comprovante',
            text: 'Os dados da compra e da forma escolhida ficam no detalhe do pedido na conta. Use esse registro se precisar de atendimento.',
          },
          {
            title: 'Segurança',
            text: 'Nunca informe dados de pagamento fora do site oficial. Em dúvida, volte pelo menu ou pelo rodapé da loja.',
          },
          {
            title: 'Dúvidas',
            text: 'Consulte também a página de Segurança e a Central de Ajuda, ou informe o código do pedido ao suporte.',
          },
        ],
      },
    ],
  },
  frete: {
    title: 'Frete e prazo de entrega',
    description:
      'Valores de frete, frete grátis, prazos estimados por região e orientações de entrega na Gescom Marketplace.',
    presentation: 'brand',
    eyebrow: 'Entrega · Gescom Marketplace',
    demoNotice: true,
    blocks: [
      {
        kind: 'lead',
        text: `O frete padrão é ${formatBRL(STANDARD_SHIPPING)}. Ele deixa de ser cobrado a partir de ${formatBRL(FREE_SHIPPING_FROM)}, ou quando todos os itens do carrinho já têm frete grátis. O valor e o prazo estimados aparecem na página do produto (com CEP) e na revisão do checkout.`,
      },
      {
        kind: 'facts',
        items: [
          { label: 'Frete padrão', value: formatBRL(STANDARD_SHIPPING) },
          { label: 'Frete grátis a partir de', value: formatBRL(FREE_SHIPPING_FROM) },
          { label: 'Itens com frete grátis', value: 'Zerados no carrinho' },
          { label: 'Cálculo', value: 'CEP no produto ou checkout' },
        ],
      },
      {
        kind: 'h2',
        id: 'como-calcular',
        text: 'Como calcular o frete',
      },
      {
        kind: 'list',
        items: [
          'Na página do produto, informe o CEP para ver a estimativa de valor e prazo daquele item.',
          'No carrinho e no checkout, o frete considera o conjunto de itens e as regras de frete grátis.',
          'Endereço incompleto ou CEP inválido impede a conclusão da compra — confira rua, número, bairro e complemento.',
        ],
      },
      {
        kind: 'h2',
        id: 'prazos',
        text: 'Prazos estimados',
      },
      {
        kind: 'p',
        text: 'Os prazos abaixo são referências típicas de e-commerce no Brasil, contados em dias úteis a partir da confirmação do pagamento. O prazo exibido no checkout prevalece para o seu pedido.',
      },
      {
        kind: 'highlights',
        items: [
          {
            title: 'Capitais e regiões metropolitanas',
            text: 'Em geral de 2 a 5 dias úteis, conforme disponibilidade e modalidade de envio.',
          },
          {
            title: 'Interior',
            text: 'Costuma variar entre 4 e 10 dias úteis, dependendo da distância e da malha da transportadora.',
          },
          {
            title: 'Regiões Norte e Nordeste',
            text: 'Prazos podem chegar a 7–15 dias úteis em localidades mais distantes dos centros de distribuição.',
          },
          {
            title: 'Feriados e picos',
            text: 'Datas comemorativas e feriados nacionais podem alongar o prazo informado no momento da compra.',
          },
        ],
      },
      {
        kind: 'h2',
        id: 'entrega',
        text: 'Orientações de entrega',
      },
      {
        kind: 'list',
        items: [
          'Informe um endereço com referência clara e um telefone atualizado para eventual contato da transportadora.',
          'Em caso de ausência, a transportadora pode deixar aviso de tentativa; acompanhe o status em Seus pedidos.',
          'Conferência na entrega: verifique se a embalagem está íntegra antes de assinar o recebimento.',
          'Se houver avaria visível, registre com fotos e abra solicitação pela Central de Ajuda com o código do pedido.',
        ],
      },
      {
        kind: 'p',
        text: 'Dúvidas sobre valor de frete, prazo ou alteração de endereço após a compra: consulte a Central de Ajuda ou o suporte da loja.',
      },
    ],
  },
  devolucoes: {
    title: 'Devoluções e reembolsos',
    description:
      'Política de trocas, devoluções e reembolsos da Gescom Marketplace, incluindo direito de arrependimento e produtos com defeito.',
    presentation: 'brand',
    eyebrow: 'Pós-venda · Gescom Marketplace',
    demoNotice: true,
    blocks: [
      {
        kind: 'lead',
        text: 'Queremos que a compra seja transparente do pedido à entrega. Se precisar devolver um produto, siga os prazos e as condições abaixo — alinhados ao Código de Defesa do Consumidor (CDC) e às boas práticas de loja online.',
      },
      {
        kind: 'facts',
        items: [
          { label: 'Arrependimento', value: 'Até 7 dias corridos' },
          { label: 'Base legal', value: 'CDC · Art. 49' },
          { label: 'Defeito', value: 'Garantia legal aplicável' },
          { label: 'Reembolso', value: 'Mesmo meio de pagamento' },
        ],
      },
      {
        kind: 'h2',
        id: 'arrependimento',
        text: 'Direito de arrependimento',
      },
      {
        kind: 'p',
        text: 'Em compras pela internet, você pode desistir do pedido em até 7 dias corridos a partir do recebimento do produto, sem necessidade de justificar o motivo, desde que o item esteja em condições de revenda.',
      },
      {
        kind: 'list',
        items: [
          'Produto sem sinais de uso, com etiquetas e acessórios originais.',
          'Embalagem original sempre que possível, ou equivalente que proteja o item no retorno.',
          'Nota fiscal ou comprovante do pedido (código em Seus pedidos).',
        ],
      },
      {
        kind: 'h2',
        id: 'defeito',
        text: 'Produto com defeito ou divergente',
      },
      {
        kind: 'p',
        text: 'Se o item chegar com defeito, avaria de transporte ou diferente do anúncio, registre o problema o quanto antes. Fotos da embalagem, do produto e o código do pedido aceleram a análise.',
      },
      {
        kind: 'list',
        items: [
          'Abra a solicitação pela conta ou pela Central de Ajuda descrevendo o problema.',
          'Aguarde a autorização de postagem ou coleta antes de enviar o produto de volta.',
          'Após a conferência, a loja orienta troca, reparo ou reembolso conforme o caso.',
        ],
      },
      {
        kind: 'h2',
        id: 'como-solicitar',
        text: 'Como solicitar devolução ou reembolso',
      },
      {
        kind: 'highlights',
        items: [
          {
            title: '1. Solicite',
            text: 'Em Conta → Seus pedidos ou na Central de Ajuda, informe o código do pedido e o motivo da devolução.',
          },
          {
            title: '2. Aguarde autorização',
            text: 'A loja confirma se o pedido está dentro do prazo e das condições e envia as instruções de envio.',
          },
          {
            title: '3. Postagem',
            text: 'Embale o produto com segurança e use o código ou a etiqueta indicados. Guarde o comprovante de postagem.',
          },
          {
            title: '4. Reembolso',
            text: 'Após a conferência, o estorno é feito no mesmo meio de pagamento. Prazos de crédito no cartão ou Pix seguem o banco ou a adquirente.',
          },
        ],
      },
      {
        kind: 'h2',
        id: 'excecoes',
        text: 'Exceções e limitações',
      },
      {
        kind: 'p',
        text: 'Alguns produtos podem ter regras específicas por higiene, personalização ou natureza do item. Em geral, não se enquadram no arrependimento simples:',
      },
      {
        kind: 'list',
        items: [
          'Itens de uso íntimo ou de higiene pessoal após abertura da embalagem lacrada.',
          'Produtos personalizados sob encomenda, quando a personalização já tiver sido iniciada.',
          'Bens perecíveis ou com validade curta, conforme indicação no anúncio.',
          'Produtos com indícios claros de mau uso, mau armazenamento ou tentativa de reparo indevido.',
        ],
      },
      {
        kind: 'p',
        text: 'Em caso de dúvida sobre o seu pedido, fale com o suporte antes de postar o produto — isso evita custos desnecessários de frete de retorno.',
      },
    ],
  },
  seguranca: {
    title: 'Segurança',
    description:
      'Cuidados com senha, dados de pagamento e páginas oficiais da Gescom Marketplace para comprar com mais tranquilidade.',
    presentation: 'brand',
    eyebrow: 'Proteção · Gescom Marketplace',
    demoNotice: true,
    blocks: [
      {
        kind: 'lead',
        text: 'A segurança da compra depende da loja e de quem compra. Use apenas os canais oficiais da Gescom, proteja sua senha e desconfie de pedidos de dados fora do checkout.',
      },
      {
        kind: 'h2',
        id: 'o-que-fazemos',
        text: 'O que a loja faz',
      },
      {
        kind: 'highlights',
        items: [
          {
            title: 'Conexão protegida',
            text: 'Acesse a loja pelo endereço oficial e verifique o cadeado (HTTPS) no navegador antes de informar dados.',
          },
          {
            title: 'Pagamento no fluxo da compra',
            text: 'Dados de cartão, Pix ou boleto devem ser tratados apenas no checkout da Gescom — nunca em páginas paralelas.',
          },
          {
            title: 'Conta sob seu controle',
            text: 'Preferências, endereços e pedidos ficam associados à sua conta neste aparelho. Não compartilhe login com terceiros.',
          },
          {
            title: 'Canais oficiais',
            text: 'Links de ajuda, pagamento e frete estão no rodapé e no menu da loja. Prefira esses caminhos a atalhos recebidos por mensagem.',
          },
        ],
      },
      {
        kind: 'h2',
        id: 'boas-praticas',
        text: 'Boas práticas para você',
      },
      {
        kind: 'list',
        items: [
          'Não informe a senha da conta fora desta loja nem em formulários suspeitos.',
          'A Gescom não pede senha do cartão, código SMS do banco ou fotos de documento por WhatsApp, SMS ou e-mail não solicitado.',
          'Desconfie de páginas que peçam pagamento fora do checkout oficial ou que usem URL diferente da loja.',
          'Se a tela não carregar ou pedir os mesmos dados duas vezes, volte ao início e tente de novo antes de reenviar informações.',
          'Em redes públicas, evite concluir pagamento; use conexão confiável sempre que possível.',
        ],
      },
      {
        kind: 'h2',
        id: 'golpe',
        text: 'Se suspeitar de golpe',
      },
      {
        kind: 'p',
        text: 'Pare o preenchimento, não clique em links duvidosos e não autorize transferências pedidas por terceiros. Acesse a loja digitando o endereço conhecido ou pelos atalhos do rodapé.',
      },
      {
        kind: 'list',
        items: [
          'Anote o que aconteceu (mensagem, URL, horário) e o código do pedido, se houver.',
          'Altere a senha da conta e, se digitou dados de cartão em site suspeito, contate o banco ou a operadora do cartão.',
          'Fale com o suporte pela Central de Ajuda e descreva a ocorrência — nunca reenvie senha ou CVV nesse contato.',
        ],
      },
      {
        kind: 'p',
        text: 'Para privacidade dos dados guardados no navegador, consulte também a Notificação de Privacidade no rodapé.',
      },
    ],
  },
  ajuda: {
    title: 'Central de Ajuda',
    description:
      'Perguntas frequentes sobre pedidos, pagamento, frete, trocas e conta na loja Gescom Marketplace.',
    blocks: [
      {
        kind: 'p',
        text: 'Reunimos as dúvidas mais comuns de quem compra online. Abra o tópico que precisa; se ainda faltar algo, fale com o suporte da loja.',
      },
      {
        kind: 'h2',
        id: 'pedidos',
        text: 'Pedidos e conta',
      },
      {
        kind: 'faq',
        items: [
          {
            question: 'Como faço um pedido?',
            answer:
              'Busque o produto, confira as opções e adicione ao carrinho. No checkout, informe contato, endereço, forma de pagamento e revise o resumo antes de confirmar. O pedido fica registrado em Seus pedidos, na sua conta.',
          },
          {
            question: 'Preciso criar uma conta para comprar?',
            answer:
              'Sim. A conta guarda pedidos, favoritos e endereços neste aparelho, para você acompanhar a compra e repetir dados no próximo checkout com mais rapidez.',
          },
          {
            question: 'Onde acompanho meu pedido?',
            answer:
              'Em Conta → Seus pedidos. Lá você vê o código, os itens, o status e os dados de pagamento e entrega salvos nesta loja.',
          },
          {
            question: 'Posso cancelar ou alterar um pedido depois de confirmar?',
            answer:
              'Depois da confirmação, o pedido já fica no histórico. Se precisar de ajuste, use o botão de suporte no final desta página e informe o código do pedido e o que deseja alterar.',
          },
        ],
      },
      {
        kind: 'h2',
        id: 'pagamento',
        text: 'Pagamento',
      },
      {
        kind: 'faq',
        items: [
          {
            question: 'Quais formas de pagamento são aceitas?',
            answer:
              'No checkout você pode escolher Pix, cartão de crédito ou boleto. Em pedidos elegíveis, o valor também pode aparecer parcelado em até 3x sem juros. Veja os detalhes em Meios de pagamento.',
          },
          {
            question: 'Meu pagamento foi aprovado? Receberei comprovante?',
            answer:
              'A forma escolhida fica registrada no pedido. Nesta vitrine não há cobrança bancária nem envio de comprovante por e-mail; o comprovante visual fica no detalhe do pedido na conta.',
          },
          {
            question: 'É seguro digitar o cartão na loja?',
            answer:
              'O formulário valida os dados neste navegador e não os envia a um servidor. Mesmo assim, nunca informe senha da conta ou dados do cartão fora do checkout oficial da Gescom.',
          },
        ],
      },
      {
        kind: 'h2',
        id: 'frete-entrega',
        text: 'Frete e entrega',
      },
      {
        kind: 'faq',
        items: [
          {
            question: 'Quanto custa o frete e quando é grátis?',
            answer: `O frete padrão é ${formatBRL(STANDARD_SHIPPING)}. Ele deixa de ser cobrado a partir de ${formatBRL(FREE_SHIPPING_FROM)}, ou quando todos os itens do carrinho já têm frete grátis. O valor aparece na revisão do checkout.`,
          },
          {
            question: 'Qual o prazo de entrega?',
            answer:
              'O prazo estimado aparece no fluxo da compra conforme o endereço informado. Não há consulta em tempo real a transportadora nesta vitrine; use Seus pedidos para acompanhar o status registrado.',
          },
          {
            question: 'Posso alterar o endereço de entrega?',
            answer:
              'Sim, antes de confirmar o pedido no checkout. Depois da confirmação, atualize seus endereços em Conta → Endereços para as próximas compras e, se o pedido atual precisar de correção, fale com o suporte.',
          },
        ],
      },
      {
        kind: 'h2',
        id: 'trocas-devolucoes',
        text: 'Trocas e devoluções',
      },
      {
        kind: 'faq',
        items: [
          {
            question: 'Como solicito troca ou devolução?',
            answer:
              'Na prática de lojas online, o pedido costuma ser analisado após o recebimento. Aqui, como não há cobrança nem envio físico, não há reembolso a processar. Em dúvida sobre um pedido, use o suporte e informe o código.',
          },
          {
            question: 'O que fazer se o produto chegar com defeito ou diferente do anúncio?',
            answer:
              'Guarde fotos, o código do pedido e a descrição do problema. Em uma loja operacional, esse registro acelera a análise. Nesta vitrine, abra o suporte com esses dados para registrar a ocorrência.',
          },
        ],
      },
      {
        kind: 'h2',
        id: 'produtos-busca',
        text: 'Produtos e busca',
      },
      {
        kind: 'faq',
        items: [
          {
            question: 'Como encontro um produto específico?',
            answer:
              'Use a busca pelo nome do produto ou navegue pelas categorias. Os filtros ajudam a separar por preço, condição e frete.',
          },
          {
            question: 'O estoque e o preço podem mudar?',
            answer:
              'Sim. Preço, disponibilidade e condições exibidos valem para a consulta no momento da compra. Confira sempre o resumo do carrinho e do checkout antes de confirmar.',
          },
          {
            question: 'Como funcionam os favoritos?',
            answer:
              'Na página do produto ou na vitrine, salve o item nos favoritos pela conta. A lista fica neste aparelho para você voltar depois sem refazer a busca.',
          },
        ],
      },
      {
        kind: 'h2',
        id: 'privacidade',
        text: 'Privacidade e segurança',
      },
      {
        kind: 'faq',
        items: [
          {
            question: 'Onde ficam meus dados de conta e pedidos?',
            answer:
              'Conta, carrinho, favoritos, endereços e pedidos ficam no armazenamento deste navegador. Limpar os dados do aparelho apaga esse histórico local.',
          },
          {
            question: 'Recebi um e-mail ou link suspeito pedindo meus dados. O que faço?',
            answer:
              'Não clique e não informe senha nem cartão. Acesse a loja digitando o endereço conhecido ou pelos links do rodapé. Em caso de dúvida, use o suporte por esta página.',
          },
        ],
      },
      {
        kind: 'cta',
        label: 'Falar com o suporte',
        text: 'Não encontrou o que precisava? Fale direto com a loja. Informe o código do pedido, a página em que estava e o que tentou fazer — isso agiliza o atendimento.',
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
