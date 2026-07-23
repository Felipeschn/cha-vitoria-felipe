"use client";

import { useState } from "react";

type PixCardProps = {
  holder: string;
  pixKey: string;
};

export function PixCard({ holder, pixKey }: PixCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyPixKey() {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="gift-card gift-card--pix">
      <div className="gift-card__content">
        <small>Outra forma de presentear</small>
        <strong>Pix</strong>
        <p className="gift-card__description">
          Se preferir, você também pode nos presentear diretamente por Pix.
        </p>
        <p className="pix-key" aria-label={`Chave Pix: ${pixKey}`}>
          {pixKey}
        </p>
        <p className="pix-holder">Titular: {holder}</p>
      </div>

      <button className="gift-card__action pix-copy" type="button" onClick={copyPixKey}>
        {copied ? "Chave copiada!" : "Copiar chave Pix"}
      </button>
    </article>
  );
}
