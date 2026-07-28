"use client";

import { useState } from "react";

import { GiftCreator } from "./gift-creator";
import { InvitationManager } from "./invitation-manager";

type AdminTab = "convites" | "presentes";

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("convites");
  const [counts, setCounts] = useState({ convites: 0, presentes: 0 });

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
        <InvitationManager
          onCount={(total) =>
            setCounts((current) => ({ ...current, convites: total }))
          }
        />
      </section>

      <section
        aria-labelledby="tab-presentes"
        hidden={tab !== "presentes"}
        id="panel-presentes"
        role="tabpanel"
      >
        <GiftCreator
          onCount={(total) =>
            setCounts((current) => ({ ...current, presentes: total }))
          }
        />
      </section>
    </>
  );
}
