"use client";

import { useEffect } from "react";

export function RevealOnScroll() {
  useEffect(() => {
    // A classe já entrou no <head>, antes do paint. Se não está aqui, é
    // movimento reduzido — e nesse caso tudo já nasce visível.
    if (!document.documentElement.classList.contains("motion-ready")) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      // A seção é o gatilho, não o alvo: quem se move são os filhos. Com
      // threshold 0 e margem inferior, seções altas disparam igual às baixas.
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((section) => {
      section
        .querySelectorAll<HTMLElement>("[data-reveal-item]")
        .forEach((item, index) => {
          item.style.setProperty("--reveal-index", String(Math.min(index, 7)));
        });
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
