type BotanicalMarkProps = {
  className?: string;
};

/**
 * O ramo é a marca da casa. Cinco folhas alternadas, cada uma com sua nervura,
 * diminuindo em direção ao broto do topo — e cada uma balançando no próprio
 * ritmo, presa ao ponto onde nasce do caule.
 */
export function BotanicalMark({ className }: BotanicalMarkProps) {
  return (
    <svg
      className={className ? `sprig ${className}` : "sprig"}
      viewBox="0 0 64 100"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="sprig__stem"
        d="M32 97C31 81 31 66 32 52c0-12 0-22 0-32"
        pathLength={1}
      />

      <g className="sprig__leaf sprig__leaf--1">
        <path d="M31 76c-10 1-20-5-27-18 12-2 24 5 27 18Z" />
        <path className="sprig__vein" d="M31 76c-9-5-19-12-26-18" />
      </g>

      <g className="sprig__leaf sprig__leaf--2">
        <path d="M31 64c10 1 20-5 27-18-12-2-24 5-27 18Z" />
        <path className="sprig__vein" d="M31 64c9-5 19-12 26-18" />
      </g>

      <g className="sprig__leaf sprig__leaf--3">
        <path d="M32 52c-8 1-17-4-23-15 10-2 20 4 23 15Z" />
        <path className="sprig__vein" d="M32 52c-8-4-16-10-22-15" />
      </g>

      <g className="sprig__leaf sprig__leaf--4">
        <path d="M32 41c8 1 16-4 22-13-9-2-19 3-22 13Z" />
        <path className="sprig__vein" d="M32 41c7-4 15-8 21-13" />
      </g>

      <g className="sprig__leaf sprig__leaf--5">
        <path d="M32 31c-6 1-13-3-18-10 8-2 16 2 18 10Z" />
        <path className="sprig__vein" d="M32 31c-6-3-12-6-17-10" />
      </g>

      <g className="sprig__leaf sprig__bud">
        <path d="M32 20c-4-4-4-10 0-15 4 5 4 11 0 15Z" />
      </g>
    </svg>
  );
}
