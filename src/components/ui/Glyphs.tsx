/**
 * A rating and a tier meter, drawn rather than typed.
 *
 * These were literal characters: a row of five black stars, and filled and hollow circles for
 * the budget tier. They rendered, but they are not text. They land in the page source and in
 * anything that reads it, they take whatever a visitor's font decides a star looks like, and a
 * screen reader announces "black star black star black star black star black star" where a
 * person wanted "rated 5 out of 5".
 *
 * So the meaning goes into aria-label and the picture goes into SVG, which is what a picture is.
 * Nothing about the look changes: the same gold, the same spacing.
 */

type RatingProps = {
  /** How many of the marks are filled. Defaults to all of them. */
  value?: number;
  max?: number;
  size?: number;
  /** The gold. Overridable, because the tier meter uses the body colour. */
  color?: string;
  gap?: number;
  label?: string;
  className?: string;
};

const GOLD = "#c48f2b";

const STAR_PATH =
  "M12 2.6l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.41l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94z";

/**
 * Five stars, or as many as asked for.
 *
 * `max` separate from `value` so a four-star lodge shows one hollow star rather than four stars
 * and a reader counting.
 */
export function StarRating({
  value = 5,
  max = 5,
  size = 14,
  color = GOLD,
  gap = 1,
  label,
  className,
}: RatingProps) {
  const filled = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span
      className={className}
      role="img"
      aria-label={label ?? `Rated ${filled} out of ${max}`}
      style={{ display: "inline-flex", alignItems: "center", gap, lineHeight: 0 }}
    >
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          fill={i < filled ? color : "none"}
          stroke={color}
          strokeWidth={i < filled ? 0 : 1.6}
          strokeLinejoin="round"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

/**
 * The budget tier: filled dots up to the tier, hollow for the rest.
 *
 * Returns nothing at all when there is no tier, because the old string did the same and an
 * empty meter would claim the cheapest band rather than silence.
 */
export function TierDots({
  value,
  max = 5,
  size = 7,
  color = "currentColor",
  gap = 3,
  label,
  className,
}: RatingProps & { value?: number | null }) {
  if (!value) return null;
  const filled = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span
      className={className}
      role="img"
      aria-label={label ?? `Budget tier ${filled} of ${max}`}
      style={{ display: "inline-flex", alignItems: "center", gap, lineHeight: 0 }}
    >
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 10 10"
          aria-hidden="true"
          focusable="false"
          fill={i < filled ? color : "none"}
          stroke={color}
          strokeWidth={i < filled ? 0 : 1.4}
        >
          <circle cx="5" cy="5" r="4" />
        </svg>
      ))}
    </span>
  );
}
