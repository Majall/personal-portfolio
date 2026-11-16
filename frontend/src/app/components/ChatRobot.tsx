import { useId } from "react";

/* ---------------------------------------------------------------------------
   The chat assistant's mascot: a small hovering armoured robot, drawn as
   inline SVG.

   The look is "night-armour": gunmetal plating, a cowl with two pointed ear
   fins, narrow glowing eyes, a glowing core in the chest and a short cape.
   It is an original character in that genre, not a copy of anyone's hero —
   there is deliberately no emblem on the chest and no recognisable mask.

   It is a drawing rather than an image or a 3D model so it costs no request,
   stays sharp at any size and can be animated part by part from CSS — the
   body bobs, the raised arm waves, the eyes blink, the cape sways and the
   hover ring pulses. Those animations live in globals.css (`.robot-*`),
   which also means the reduced-motion backstop there stills all of them.

   The armour colours are literal on purpose. Everywhere else the site uses
   role tokens that swap between themes, but a character has to look like
   the same character in both. Only the accent follows the theme, through
   the `cream` token and `--glow`.
--------------------------------------------------------------------------- */

const ARMOUR_LIGHT = "#6b7280";
const ARMOUR_MID = "#2e323c";
const ARMOUR_DARK = "#101216";
const FACE_TOP = "#1a1c22";
const FACE_BOTTOM = "#050506";
const CAPE = "#1c0a11";
const EYE = "#ffe3e8";
const CORE = "#fff1f3";
const ACCENT = "var(--color-cream)";

interface ChatRobotProps {
  className?: string;
  /** Swaps the eyes for three bouncing dots while a reply loads. */
  thinking?: boolean;
  /** A small side-to-side groove with both arms, used while the chat is open. */
  dancing?: boolean;
  /** Head and shoulders only, for the small avatar in the panel header. */
  bust?: boolean;
}

export default function ChatRobot({
  className,
  thinking = false,
  dancing = false,
  bust = false,
}: ChatRobotProps) {
  /* Two robots can be on screen at once (launcher and header avatar), so the
     gradient and filter ids must not collide. */
  const id = useId();
  const armour = `armour-${id}`;
  const face = `face-${id}`;
  const glow = `glow-${id}`;

  return (
    <svg
      viewBox={bust ? "14 0 92 88" : "0 0 120 132"}
      className={dancing ? `robot-dancing ${className ?? ""}` : className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={armour} cx="34%" cy="22%" r="90%">
          <stop offset="0%" stopColor={ARMOUR_LIGHT} />
          <stop offset="45%" stopColor={ARMOUR_MID} />
          <stop offset="100%" stopColor={ARMOUR_DARK} />
        </radialGradient>
        <linearGradient id={face} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={FACE_TOP} />
          <stop offset="100%" stopColor={FACE_BOTTOM} />
        </linearGradient>
        <filter id={glow} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ---- Hover ring: what it floats on instead of legs ---- */}
      <ellipse
        className="robot-ring"
        cx="60"
        cy="125"
        rx="13"
        ry="3.6"
        fill="none"
        stroke={ACCENT}
        strokeWidth="2.2"
        filter={`url(#${glow})`}
      />

      <g className="robot-float">
        {/* ---- Cape: behind everything, scalloped hem ---- */}
        <path
          className="robot-cape"
          d="M41 86 Q26 104 27 121 L36 114 L44 122 L52 115 L60 122 L68 115 L76 122 L84 114 L93 121 Q94 104 79 86 Z"
          fill={CAPE}
          stroke={ACCENT}
          strokeOpacity="0.35"
          strokeWidth="0.8"
        />

        {/* ---- Resting arm, with a finned gauntlet ---- */}
        <g className="robot-rest">
          <g transform="rotate(16 38 88)">
            <rect x="31" y="84" width="10" height="25" rx="5" fill={`url(#${armour})`} />
            <path d="M31 97 L26 94 L31 102 Z M31 103 L27 101 L31 107 Z" fill={ARMOUR_LIGHT} />
            <circle cx="36" cy="88" r="3" fill={ACCENT} />
          </g>
        </g>

        {/* ---- Waving arm: pivots at the shoulder ---- */}
        <g className="robot-wave">
          <path
            d="M80 91 L97 82"
            stroke={`url(#${armour})`}
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M97 82 L103 72"
            stroke={ARMOUR_MID}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="97" cy="82" r="3" fill={ACCENT} />
          {/* Open palm: three armoured fingers and a light in the hand. */}
          <path
            d="M102 71 L100 63 M104 71 L106 62 M106 73 L112 67"
            stroke={ARMOUR_LIGHT}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <circle cx="104" cy="71" r="2.4" fill={CORE} filter={`url(#${glow})`} />
        </g>

        {/* ---- Torso ---- */}
        <path
          d="M38 96 C38 80 82 80 82 96 C82 114 72 122 60 122 C48 122 38 114 38 96Z"
          fill={`url(#${armour})`}
        />
        {/* Plating seams. */}
        <path
          d="M45 88 L54 93 M75 88 L66 93 M50 104 L60 108 L70 104"
          fill="none"
          stroke="#000000"
          strokeOpacity="0.45"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Belt. */}
        <path
          d="M41.5 109 Q60 117 78.5 109"
          fill="none"
          stroke={ACCENT}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* Glowing core. */}
        <g className="robot-core" filter={`url(#${glow})`}>
          <circle cx="60" cy="97" r="6.2" fill={ACCENT} />
          <circle cx="60" cy="97" r="3.4" fill={CORE} />
        </g>

        {/* ---- Neck ---- */}
        <rect x="53" y="75" width="14" height="9" rx="2" fill={ARMOUR_DARK} />

        {/* ---- Head ---- */}
        <g className={thinking ? "robot-head robot-head-thinking" : "robot-head"}>
          {/* Ear fins. */}
          <path d="M28 30 L25 2 L47 15 Z" fill={`url(#${armour})`} />
          <path d="M92 30 L95 2 L73 15 Z" fill={`url(#${armour})`} />
          <path d="M29 24 L27.5 8 L39 15 Z" fill={ACCENT} opacity="0.55" />
          <path d="M91 24 L92.5 8 L81 15 Z" fill={ACCENT} opacity="0.55" />

          {/* Cowl. */}
          <ellipse cx="60" cy="44" rx="38" ry="34" fill={`url(#${armour})`} />
          {/* Rim light along the crown. */}
          <path
            d="M27 34 Q38 12 62 11"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.22"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Face plate: an angular dark inset under a heavy brow. */}
          <path
            d="M30 40 Q60 31 90 40 L86 58 Q60 74 34 58 Z"
            fill={`url(#${face})`}
          />
          <path
            d="M30 40 Q60 31 90 40"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {thinking ? (
            <g fill={EYE} filter={`url(#${glow})`}>
              <circle className="robot-dot" cx="48" cy="50" r="3.2" />
              <circle
                className="robot-dot"
                cx="60"
                cy="50"
                r="3.2"
                style={{ animationDelay: "0.15s" }}
              />
              <circle
                className="robot-dot"
                cx="72"
                cy="50"
                r="3.2"
                style={{ animationDelay: "0.3s" }}
              />
            </g>
          ) : (
            <>
              {/* Narrow, slanted eyes. */}
              <g className="robot-blink" fill={EYE} filter={`url(#${glow})`}>
                <path d="M38 45 L55 50 L53 55.5 L41 52.5 Z" />
                <path d="M82 45 L65 50 L67 55.5 L79 52.5 Z" />
              </g>
              {/* Mouth grille. */}
              <path
                d="M54 63.5 L66 63.5"
                stroke={ARMOUR_LIGHT}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </>
          )}
        </g>
      </g>
    </svg>
  );
}
