import { buildWhatsAppShareUrl } from "@/lib/external-links";
import {
  giftLists,
  invitationGroups,
  pixDetails,
  sharedEvent,
  type InvitationGroup,
} from "@/lib/invitation-data";

import { BotanicalMark } from "./botanical-mark";
import { IndividualGiftList } from "./individual-gift-list";
import { PixCard } from "./pix-card";
import { RevealOnScroll } from "./reveal-on-scroll";

type InvitationPageProps = {
  group: InvitationGroup;
};

export function InvitationPage({ group }: InvitationPageProps) {
  const event = invitationGroups[group];
  const isPending = group === "amigos";
  const whatsappUrl = buildWhatsAppShareUrl(event.rsvpMessage);

  return (
    <main>
      <RevealOnScroll />

      <section className="hero" aria-labelledby="invitation-title">
        <div className="hero__content">
          <BotanicalMark />
          <p className="eyebrow">Chá de casa nova</p>
          <p className="audience-label">{event.audience}</p>
          <h1 id="invitation-title">
            Vitória
            <br />
            &amp; Felipe
          </h1>
          <p className="hero__quote">
            Nossa casa está ganhando forma, mas é a presença de quem amamos que faz dela um lar.
          </p>
          <p
            className={`date-pill${isPending ? " date-pill--pending" : ""}`}
            aria-label={
              isPending
                ? "Data e horário serão confirmados em breve"
                : `${event.dateLong}, às ${event.time}`
            }
          >
            {event.dateShort}
            {!isPending && (
              <>
                <span aria-hidden="true">•</span>
                {event.time}
              </>
            )}
          </p>
        </div>

        <div className="hero__art">
          <BotanicalMark large />
        </div>
      </section>

      <section className="details section-shell" aria-labelledby="details-title" data-reveal>
        <div className="section-heading">
          <p className="eyebrow">Um novo capítulo</p>
          <h2 id="details-title">Nossa casa está ganhando forma</h2>
          <p>
            Estamos preparando uma tarde especial para celebrar essa nova fase e queremos muito
            dividir esse momento com você.
          </p>
        </div>

        <div className="details__grid">
          <article className="info-card info-card--light">
            <p className="card-label">Quando?</p>
            <h3>{event.whenCopy}</h3>
            {event.dateTime ? (
              <time dateTime={event.dateTime}>{event.time}</time>
            ) : (
              <p>{event.time}</p>
            )}
            {isPending && (
              <span className="status-tag">Avisaremos assim que estiver confirmado</span>
            )}
          </article>

          <article className="info-card info-card--green">
            <p className="card-label">Onde?</p>
            <h3>{sharedEvent.venue}</h3>
            <p>
              {sharedEvent.address}
              <br />
              {sharedEvent.neighborhood}
            </p>
            <a href={sharedEvent.mapUrl} target="_blank" rel="noopener noreferrer">
              Abrir no mapa
            </a>
          </article>
        </div>
      </section>

      <section className="rsvp" id="confirmacao" aria-labelledby="rsvp-title" data-reveal>
        <p className="eyebrow">{isPending ? "Fique por perto" : "Confirmação"}</p>
        <h2 id="rsvp-title">{event.rsvpTitle}</h2>
        <p>{event.rsvpCopy}</p>
        <a className="button" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          {event.rsvpLabel}
        </a>
      </section>

      <section className="gifts section-shell" aria-labelledby="gifts-title" data-reveal>
        <div className="section-heading">
          <p className="eyebrow">Com carinho</p>
          <h2 id="gifts-title">Para o nosso novo cantinho</h2>
          <p>
            Sua presença já é muito especial. Se quiser nos presentear, reunimos algumas ideias
            para o nosso lar.
          </p>
        </div>

        <div className="gift-grid">
          {giftLists.map((list) => (
            <a
              className="gift-card"
              href={list.url}
              target="_blank"
              rel="noopener noreferrer"
              key={list.name}
            >
              <div className="gift-card__content">
                <small>Lista de presentes</small>
                <strong>{list.name}</strong>
                <p className="gift-card__description">{list.description}</p>
              </div>
              <span className="gift-card__action">
                {list.action} <span aria-hidden="true">↗</span>
              </span>
            </a>
          ))}

          <PixCard holder={pixDetails.holder} pixKey={pixDetails.key} />
        </div>

        <IndividualGiftList />
      </section>

      <footer data-reveal>
        <BotanicalMark />
        <blockquote>
          Que nossa nova casa seja cenário de encontros, risadas e muitas memórias felizes.
        </blockquote>
        <p>Vitória &amp; Felipe</p>
      </footer>
    </main>
  );
}
