"use client";

import { useEffect } from "react";

export function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");

    root.classList.add("motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8%" },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      root.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
