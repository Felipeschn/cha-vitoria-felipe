export type InvitationGroup = "familia" | "amigos";

type InvitationDetails = {
  audience: string;
  dateLong: string;
  dateShort: string;
  dateTime: string | null;
  rsvpCopy: string;
  rsvpLabel: string;
  rsvpMessage: string;
  rsvpTitle: string;
  time: string;
  whenCopy: string;
};

export const sharedEvent = {
  venue: "Condomínio Terrace — Salão de Festas",
  address: "R. Pedro Álvares Cabral, 279",
  neighborhood: "Nossa Senhora das Graças — Canoas/RS",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=Condom%C3%ADnio%20Terrace%2C%20R.%20Pedro%20%C3%81lvares%20Cabral%2C%20279%2C%20Canoas%2C%20RS",
} as const;

export const invitationGroups = {
  familia: {
    audience: "Um convite para a família",
    dateShort: "20 SETEMBRO",
    dateLong: "20 de setembro de 2026",
    dateTime: "2026-09-20T15:00:00-03:00",
    time: "15h",
    whenCopy: "20 de setembro de 2026",
    rsvpTitle: "Você vem?",
    rsvpCopy:
      "Ficaremos muito felizes em celebrar com você. Confirme sua presença para prepararmos tudo com carinho.",
    rsvpLabel: "Confirmar pelo WhatsApp",
    rsvpMessage:
      "Oi, Vitória e Felipe! Confirmo minha presença no chá de casa nova da família, dia 20 de setembro, às 15h. 💚",
  },
  amigos: {
    audience: "Um convite para amigos queridos",
    dateShort: "DATA EM BREVE",
    dateLong: "Data em breve",
    dateTime: null,
    time: "Horário a confirmar",
    whenCopy: "A data será confirmada em breve",
    rsvpTitle: "Queremos você com a gente",
    rsvpCopy:
      "Estamos organizando uma segunda comemoração para os amigos próximos. Assim que a data estiver definida, avisaremos por aqui.",
    rsvpLabel: "Quero receber a data",
    rsvpMessage:
      "Oi, Vitória e Felipe! Quero receber a data do chá de casa nova com os amigos. 💚",
  },
} as const satisfies Record<InvitationGroup, InvitationDetails>;

export const giftLists = [
  {
    name: "Camicado",
    description: "Você pode comprar pelo site ou em uma loja física da Camicado.",
    action: "Ver lista",
    url: "https://lista.camicado.com.br/livi",
  },
  {
    name: "Casa Maria",
    description:
      "A compra é feita somente nas lojas físicas. Informe a lista ao atendente, que dará baixa no presente pelo sistema.",
    action: "Ver detalhes",
    url: "https://bazarcasamaria.com.br/lista-de-presente-individual/?gift_list=cha-de-casa-nova-vitoria-e-felipe",
  },
] as const;

export const pixDetails = {
  key: "6b74c209-5149-4efb-8e49-1d57b41e34bf",
  holder: "Vitória Moreira Padilha",
} as const;
