export default function PositionBadge({ pos }) {
  const className =
    pos <= 4
      ? "pos-cl"
      : pos <= 6
        ? "pos-el"
        : pos >= 18
          ? "pos-rel"
          : "pos-mid";

  return <span className={`pos-badge ${className}`}>{pos}</span>;
}
