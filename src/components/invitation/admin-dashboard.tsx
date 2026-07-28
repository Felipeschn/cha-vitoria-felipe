"use client";

import { useCallback, useState } from "react";

import { GiftCreator } from "./gift-creator";
import { InvitationManager } from "./invitation-manager";

type AdminTab = "convites" | "presentes";

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("convites");
  const [counts, setCounts] = useState({ convites: 0, presentes: 0 });

  // Dois cuidados que precisam andar juntos, senão o painel entra em loop:
  // identidade estável (`useCallback` sem dependências, em vez de uma arrow
  // criada no JSX) e nenhum estado novo quando o número não mudou. Sem o
  // primeiro, cada render passa um callback diferente para os painéis; sem o
  // segundo, `setCounts` sempre devolveria um objeto novo, re-renderizando o
  // painel — e a volta seria carga → contagem → render → carga, sem parar.
  const countInvitations = useCallback((total: number) => {
    setCounts((current) =>
      current.convites === total ? current : { ...current, convites: total },
    );
  }, []);

  const countGifts = useCallback((total: number) => {
    setCounts((current) =>
      current.presentes === total ? current : { ...current, presentes: total },
    );
  }, []);

  return (
    <>
      <div className="adm__bar">
        <nav className="seg" role="tablist" aria-label="Seções do painel">
          {(["convites", "presentes"] as const).map((value) => (
            <button
              aria-controls={`panel-${value}`}
              aria-selected={tab === value}
              id={`tab-${value}`}
              key={value}
              role="tab"
              type="button"
              onClick={() => setTab(value)}
            >
              {value === "convites" ? "Convites" : "Presentes"}
              <span>{counts[value]}</span>
            </button>
          ))}
        </nav>
      </div>

      <section
        aria-labelledby="tab-convites"
        hidden={tab !== "convites"}
        id="panel-convites"
        role="tabpanel"
      >
        <InvitationManager onCount={countInvitations} />
      </section>

      <section
        aria-labelledby="tab-presentes"
        hidden={tab !== "presentes"}
        id="panel-presentes"
        role="tabpanel"
      >
        <GiftCreator onCount={countGifts} />
      </section>
    </>
  );
}
