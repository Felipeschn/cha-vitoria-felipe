/**
 * Planta baixa abstrata que vive atrás do hero. Não representa a casa real —
 * é o vocabulário de prancha (cômodo, arco de porta, linha de cota) que tira o
 * convite do território de casamento e o coloca no de obra e endereço.
 */
export function HousePlan() {
  return (
    <svg
      className="hero__plan"
      viewBox="0 0 420 380"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMaxYMid slice"
    >
      <g className="hero__plan-stroke">
        {/* perímetro */}
        <path d="M40 60h250v120H40z" />
        <path d="M290 60h90v260h-250v-140" />

        {/* divisórias internas */}
        <path d="M170 60v120M290 180v60" />

        {/* arcos de porta */}
        <path d="M170 152a28 28 0 0 0 28 28" />
        <path d="M290 240a30 30 0 0 1-30 30" />

        {/* janelas — traço duplo curto */}
        <path d="M78 60v-8M126 60v-8M78 56h48" />
        <path d="M380 130h8M380 178h8M384 130v48" />

        {/* linha de cota */}
        <path d="M40 344h250" />
        <path d="M40 338v12M290 338v12" />
      </g>

      <g className="hero__plan-sprig">
        <path d="M348 300v-42" />
        <path d="M348 276c-12-2-18-10-18-20 10 0 18 6 18 20Z" />
        <path d="M348 288c12-2 18-10 18-20-10 0-18 6-18 20Z" />
      </g>
    </svg>
  );
}
