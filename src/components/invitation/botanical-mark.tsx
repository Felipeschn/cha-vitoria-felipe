type BotanicalMarkProps = {
  large?: boolean;
};

export function BotanicalMark({ large = false }: BotanicalMarkProps) {
  const className = large ? "botanical botanical--large" : "botanical";

  return (
    <div className={className} aria-hidden="true">
      <span className="branch" />
      <span className="leaf leaf--one" />
      <span className="leaf leaf--two" />
      <span className="leaf leaf--three" />
      <span className="leaf leaf--four" />
    </div>
  );
}
