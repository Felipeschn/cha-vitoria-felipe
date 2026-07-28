export type InvitationGroup = "familia" | "amigos";

type InvitationDetails = {
  /** Ficha técnica do hero: linha forte e linha de apoio da célula "quando". */
  specWhen: string;
  specWhenNote: string;
  /** Lockup da data no desktop. `day` nulo quando a data ainda não existe. */
  weekday: string;
  day: string | null;
  monthYear: string;
  time: string;
  dateTime: string | null;
  /**
   * A mesma data como frase, para o celular. O numeral isolado só funciona
   * quando há coluna ao lado dele; em tela estreita vira uma torre.
   */
  compactDate: string;
  compactDateNote: string;
  /** Nota abaixo do horário. */
  whenNote: string;
  rsvpEyebrow: string;
  rsvpTitle: string;
  rsvpCopy: string;
  rsvpLabel: string;
  rsvpMessage: string;
  rsvpNote: string;
};

export const heroCopy = {
  eyebrow: "Chá de casa nova",
  titleLead: "Casa nova,",
  titleAccent: "porta aberta.",
  deck: "Uma casa nova pede gente dentro. Vem inaugurar a nossa.",
} as const;

export const sharedEvent = {
  venue: "Condomínio Terrace",
  space: "Salão de Festas",
  address: "R. Pedro Álvares Cabral, 279",
  neighborhood: "Nossa Senhora das Graças — Canoas/RS",
  // Sem `·` interno: a ficha técnica do hero já usa esse separador entre o
  // espaço e a cidade, e dois seguidos ficam ilegíveis.
  city: "Canoas, RS",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=Condom%C3%ADnio%20Terrace%2C%20R.%20Pedro%20%C3%81lvares%20Cabral%2C%20279%2C%20Canoas%2C%20RS",
  // Embed público do Google Maps: sem chave de API e sem script externo.
  // Aponta direto para o destino final — a forma `?q=…&output=embed` responde
  // 301 com `X-Frame-Options: SAMEORIGIN`, e pular o salto evita depender de
  // como cada navegador trata o cabeçalho no redirect.
  mapEmbedUrl:
    "https://www.google.com/maps/embed?origin=mfe&pb=!1m2!2m1!1sCondom%C3%ADnio+Terrace,+R.+Pedro+%C3%81lvares+Cabral,+279,+Nossa+Senhora+das+Gra%C3%A7as,+Canoas+-+RS",
} as const;

export const invitationGroups = {
  familia: {
    specWhen: "Domingo, 20 de setembro",
    specWhenNote: "2026 · a partir das 15h",
    weekday: "domingo",
    day: "20",
    monthYear: "setembro de 2026",
    time: "15h",
    dateTime: "2026-09-20T15:00:00-03:00",
    compactDate: "20 de setembro",
    compactDateNote: "domingo, a partir das 15h",
    whenNote: "A gente fica por lá a tarde toda.",
    rsvpEyebrow: "Confirmação",
    rsvpTitle: "Você vem?",
    rsvpCopy:
      "Diz pra gente com alguma antecedência — assim a comida e o gelo dão conta.",
    rsvpLabel: "Confirmar pelo WhatsApp",
    rsvpMessage:
      "Oi, Vitória e Felipe! Confirmo minha presença no chá de casa nova da família, dia 20 de setembro, às 15h. 💚",
    rsvpNote: "Se aparecer um imprevisto, avisa também. Sem cerimônia.",
  },
  amigos: {
    specWhen: "Ainda escolhendo o dia",
    specWhenNote: "Avisamos assim que estiver de pé",
    weekday: "ainda escolhendo o dia",
    day: null,
    monthYear: "em breve · 2026",
    time: "Horário a confirmar",
    dateTime: null,
    compactDate: "Data em breve",
    compactDateNote: "ainda escolhendo o dia",
    whenNote: "Avisamos assim que estiver de pé.",
    rsvpEyebrow: "Fique por perto",
    rsvpTitle: "Queremos você com a gente",
    rsvpCopy:
      "Estamos organizando uma segunda comemoração para os amigos próximos. Assim que a data estiver definida, avisamos por aqui.",
    rsvpLabel: "Quero receber a data",
    rsvpMessage:
      "Oi, Vitória e Felipe! Quero receber a data do chá de casa nova com os amigos. 💚",
    rsvpNote: "Pode chamar quando quiser saber como estão as obras.",
  },
} as const satisfies Record<InvitationGroup, InvitationDetails>;

/**
 * `logo` aponta para um arquivo em `public/logos/`. Sem ele, o cartão mostra o
 * nome da loja em tipografia de display.
 */
export const giftLists = [
  {
    name: "Camicado",
    logo: "/logos/camicado.png" as string | null,
    label: "Lista de presentes",
    description:
      "Nossa lista está montada no site. Dá para comprar de casa e receber em casa.",
    action: "Abrir a lista",
    note: null,
    tone: "paper",
    url: "https://lista.camicado.com.br/livi",
  },
  {
    // O link abre a lista, mas não vende: serve para conferir os itens antes de
    // sair de casa. Por isso o cartão traz as duas coisas — a visita ao site e
    // o aviso de que a compra continua sendo no balcão.
    name: "Casa Maria",
    logo: "/logos/casa-maria.png" as string | null,
    label: "Lista de presentes",
    description:
      "Dá para ver os itens pelo site antes de ir, mas a compra não sai por lá: é só pedir a lista de Vitória e Felipe no balcão da loja.",
    action: "Ver os itens da lista",
    note: "A compra é só na loja",
    tone: "forest",
    url: "https://bazarcasamaria.com.br/lista-de-presente-individual/?gift_list=cha-de-casa-nova-vitoria-e-felipe",
  },
] as const;

export const pixDetails = {
  key: "6b74c209-5149-4efb-8e49-1d57b41e34bf",
  holder: "Vitória Moreira Padilha",
  kind: "Chave aleatória",
  logo: "/logos/pix.png",
} as const;
