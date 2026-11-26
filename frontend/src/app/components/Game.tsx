"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Container, Section } from "./ui/Section";
import { ChapterHeading, Reveal, TextRoll } from "./ui/Motion";
import { game } from "../../data/content";
import { ALLOWED, rasterize, type Brick } from "./game/font5x7";

type Status = "idle" | "playing" | "won" | "lost";

/** Read a live CSS token, so the canvas follows the theme. */
function token(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/**
 * The easter egg: a brick-breaker whose wall is text, rasterised through a
 * 5x7 bitmap font — so whatever you type becomes the thing you knock down.
 *
 * Drawn on a canvas rather than in the DOM. The wall runs to a couple of
 * hundred bricks plus a ball moving every frame; as DOM nodes that is a few
 * hundred elements restyled per frame, where the canvas is one element and a
 * few hundred fills.
 *
 * Nothing moves until the visitor launches the ball, so this never runs a
 * loop in the background. That is also what makes it safe under reduced
 * motion: every frame it draws is the direct result of an interaction, and
 * the section renders as a still wall of text until asked otherwise.
 *
 * The whole thing is optional and carries no information, so the canvas is
 * labelled and results are announced through a live region; a visitor who
 * cannot play it misses nothing.
 */
const Game: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [lines, setLines] = useState<string[]>(game.defaultLines);
  const [draft, setDraft] = useState<string[]>(game.defaultLines);
  const [status, setStatus] = useState<Status>("idle");
  const [lives, setLives] = useState(game.lives);
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [muted, setMuted] = useState(true);

  /* Everything the frame loop mutates lives in a ref. Putting the ball in
     state would re-render the whole section sixty times a second to redraw a
     canvas React does not manage anyway. */
  const world = useRef({
    w: 0,
    h: 0,
    bricks: [] as Brick[],
    cols: 1,
    rows: 1,
    cell: 0,
    gridX: 0,
    gridY: 0,
    paddleX: 0.5,
    ball: { x: 0, y: 0, vx: 0, vy: 0, r: 4 },
    running: false,
    raf: 0,
    last: 0,
  });

  const audio = useRef<AudioContext | null>(null);

  const beep = useCallback(
    (frequency: number, length = 0.05) => {
      if (muted) return;
      try {
        audio.current ??= new AudioContext();
        const ctx = audio.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = frequency;
        gain.gain.value = 0.04;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + length,
        );
        osc.stop(ctx.currentTime + length);
      } catch {
        /* No audio available: the game is still perfectly playable silent. */
      }
    },
    [muted],
  );

  /* ---- Geometry ---- */
  const layout = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);

    const s = world.current;
    s.w = w;
    s.h = h;

    /* The wall takes ~82% of the width, and is capped by height too so a long
       line cannot push the bricks down over the paddle. */
    const byWidth = (w * 0.82) / s.cols;
    const byHeight = (h * 0.5) / s.rows;
    s.cell = Math.min(byWidth, byHeight);
    s.gridX = (w - s.cols * s.cell) / 2;
    s.gridY = h * 0.08;
    s.ball.r = Math.max(3.5, Math.min(6, w * 0.006));
  }, []);

  const resetBall = useCallback(() => {
    const s = world.current;
    s.ball.x = s.paddleX * s.w;
    s.ball.y = s.h - s.h * 0.1 - 14;
    const speed = Math.max(260, s.h * 0.78);
    s.ball.vx = speed * 0.45 * (Math.random() > 0.5 ? 1 : -1);
    s.ball.vy = -speed;
  }, []);

  const buildWall = useCallback(
    (source: string[]) => {
      const built = rasterize(source);
      const s = world.current;
      s.bricks = built.bricks;
      s.cols = Math.max(built.cols, 1);
      s.rows = Math.max(built.rows, 1);
      setTotal(built.bricks.length);
      setRemaining(built.bricks.length);
    },
    [],
  );

  /* ---- Drawing ---- */
  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    const s = world.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, s.w, s.h);

    const ink = token("--color-bone", "#f4f4f4");
    const pad = s.cell * 0.16;
    const size = Math.max(s.cell - pad, 1);

    ctx.fillStyle = ink;
    for (const brick of s.bricks) {
      if (!brick.alive) continue;
      ctx.fillRect(
        s.gridX + brick.col * s.cell,
        s.gridY + brick.row * s.cell,
        size,
        size,
      );
    }

    const paddleW = Math.max(70, s.w * 0.14);
    const paddleH = Math.max(7, s.h * 0.016);
    const paddleY = s.h - s.h * 0.1;
    const paddleLeft = Math.min(
      Math.max(s.paddleX * s.w - paddleW / 2, 0),
      s.w - paddleW,
    );

    /* The paddle picks up the skills grid's accents, which is the only other
       chromatic thing on the page — it reads as deliberate rather than a
       stray colour. */
    const grad = ctx.createLinearGradient(paddleLeft, 0, paddleLeft + paddleW, 0);
    grad.addColorStop(0, token("--accent-net", "#8bd450"));
    grad.addColorStop(1, token("--accent-dev", "#46c8d8"));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(paddleLeft, paddleY, paddleW, paddleH, paddleH / 2);
    ctx.fill();

    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  /* ---- Simulation ---- */
  const step = useCallback(
    (dt: number) => {
      const s = world.current;
      const ball = s.ball;

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x - ball.r < 0) {
        ball.x = ball.r;
        ball.vx = Math.abs(ball.vx);
        beep(220);
      } else if (ball.x + ball.r > s.w) {
        ball.x = s.w - ball.r;
        ball.vx = -Math.abs(ball.vx);
        beep(220);
      }
      if (ball.y - ball.r < 0) {
        ball.y = ball.r;
        ball.vy = Math.abs(ball.vy);
        beep(220);
      }

      const paddleW = Math.max(70, s.w * 0.14);
      const paddleH = Math.max(7, s.h * 0.016);
      const paddleY = s.h - s.h * 0.1;
      const paddleLeft = Math.min(
        Math.max(s.paddleX * s.w - paddleW / 2, 0),
        s.w - paddleW,
      );

      if (
        ball.vy > 0 &&
        ball.y + ball.r >= paddleY &&
        ball.y - ball.r <= paddleY + paddleH &&
        ball.x >= paddleLeft &&
        ball.x <= paddleLeft + paddleW
      ) {
        ball.y = paddleY - ball.r;
        /* Where it lands on the paddle sets the outgoing angle, so the player
           can aim rather than only keep it alive. */
        const hit = (ball.x - (paddleLeft + paddleW / 2)) / (paddleW / 2);
        const speed = Math.hypot(ball.vx, ball.vy);
        const angle = hit * 1.05;
        ball.vx = speed * Math.sin(angle);
        ball.vy = -Math.abs(speed * Math.cos(angle));
        beep(380);
      }

      /* The ball is small relative to a cell, so testing the cell under its
         centre is enough and costs one lookup rather than a pass over the
         whole wall. */
      const col = Math.floor((ball.x - s.gridX) / s.cell);
      const row = Math.floor((ball.y - s.gridY) / s.cell);
      const hitBrick = s.bricks.find(
        (b) => b.alive && b.col === col && b.row === row,
      );

      if (hitBrick) {
        hitBrick.alive = false;
        setRemaining((n) => Math.max(n - 1, 0));
        beep(640, 0.04);

        const bx = s.gridX + col * s.cell;
        const by = s.gridY + row * s.cell;
        const overlapX = Math.min(
          Math.abs(ball.x - bx),
          Math.abs(ball.x - (bx + s.cell)),
        );
        const overlapY = Math.min(
          Math.abs(ball.y - by),
          Math.abs(ball.y - (by + s.cell)),
        );
        if (overlapX < overlapY) ball.vx = -ball.vx;
        else ball.vy = -ball.vy;

        if (!s.bricks.some((b) => b.alive)) {
          s.running = false;
          setStatus("won");
        }
      }

      if (ball.y - ball.r > s.h) {
        s.running = false;
        beep(140, 0.18);
        setLives((n) => {
          const left = n - 1;
          setStatus(left > 0 ? "idle" : "lost");
          return Math.max(left, 0);
        });
      }
    },
    [beep],
  );

  const launch = useCallback(() => {
    const s = world.current;
    if (s.running || status === "won" || status === "lost") return;
    if (!s.bricks.some((b) => b.alive)) return;

    layout();
    resetBall();
    s.running = true;
    s.last = performance.now();
    setStatus("playing");

    const tick = (now: number) => {
      if (!s.running) return;
      /* Clamped so a backgrounded tab does not resume with one enormous step
         that tunnels the ball through the paddle. */
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      step(dt);
      draw();
      if (s.running) s.raf = requestAnimationFrame(tick);
    };

    s.raf = requestAnimationFrame(tick);
  }, [draw, layout, resetBall, status, step]);

  const reset = useCallback(
    (source: string[]) => {
      const s = world.current;
      cancelAnimationFrame(s.raf);
      s.running = false;
      buildWall(source);
      layout();
      resetBall();
      draw();
      setLives(game.lives);
      setStatus("idle");
    },
    [buildWall, draw, layout, resetBall],
  );

  /* ---- Wiring ---- */
  useEffect(() => {
    reset(lines);
    const onResize = () => {
      layout();
      draw();
    };
    window.addEventListener("resize", onResize);
    const s = world.current;
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(s.raf);
      s.running = false;
    };
    /* Only when the wall's text changes — `reset` is stable. */
  }, [lines, reset, layout, draw]);

  /* Redraw when the ball is parked, so losing a life or switching theme
     leaves a correct still frame. */
  useEffect(() => {
    if (status !== "playing") {
      layout();
      resetBall();
      draw();
    }
  }, [status, layout, resetBall, draw]);

  /* Pointer and touch steering. */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const move = (clientX: number) => {
      const rect = wrap.getBoundingClientRect();
      world.current.paddleX = Math.min(
        Math.max((clientX - rect.left) / rect.width, 0),
        1,
      );
      if (!world.current.running) draw();
    };

    const onPointer = (e: PointerEvent) => move(e.clientX);
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) move(touch.clientX);
    };

    wrap.addEventListener("pointermove", onPointer);
    wrap.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      wrap.removeEventListener("pointermove", onPointer);
      wrap.removeEventListener("touchmove", onTouch);
    };
  }, [draw]);

  /* Keyboard, only while the field has focus — otherwise space and the arrow
     keys would stop scrolling the page for everyone. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      launch();
      return;
    }
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    world.current.paddleX = Math.min(
      Math.max(world.current.paddleX + (e.key === "ArrowLeft" ? -0.05 : 0.05), 0),
      1,
    );
    if (!world.current.running) draw();
  };

  const clean = (value: string) =>
    value
      .toUpperCase()
      .split("")
      .filter((c) => ALLOWED.test(c))
      .join("")
      .slice(0, game.maxLineLength);

  const message =
    status === "won"
      ? game.clearedLabel
      : status === "lost"
        ? game.lostLabel
        : "";

  return (
    <Section id="play" surface className="py-24 sm:py-32">
      <Container>
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <p className="label text-muted">{game.label}</p>
          </Reveal>
          <ChapterHeading
            text={game.heading}
            accent={game.headingAccent}
            className="chrome-text mt-5 text-chapter"
          />
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-[52ch] text-sm leading-relaxed text-muted">
              {game.intro}
            </p>
          </Reveal>
        </div>

        {/* ---- Meta bar ---- */}
        <div className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-line pb-4">
          <span className="label text-bone">{game.matrixLabel}</span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />

          <span className="label tabular-nums text-muted">
            {remaining}/{total}
          </span>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? game.soundOff : game.soundOn}
            aria-pressed={!muted}
            className="text-muted transition-colors hover:text-bone"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
              {muted ? (
                <path d="M16 9.5l4 5M20 9.5l-4 5" />
              ) : (
                <path d="M16 9.6a3.5 3.5 0 010 4.8M18.4 7.4a7 7 0 010 9.2" />
              )}
            </svg>
          </button>

          <span className="flex items-center gap-2">
            <span className="label text-muted">{game.ballsLabel}</span>
            <span className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: game.lives }).map((_, i) => (
                <span
                  key={i}
                  className={`block h-2 w-2 rounded-full transition-colors ${
                    i < lives ? "bg-signal" : "bg-line"
                  }`}
                />
              ))}
            </span>
            <span className="sr-only">
              {lives} of {game.lives}
            </span>
          </span>
        </div>

        {/* ---- Field ---- */}
        <div
          ref={wrapRef}
          tabIndex={0}
          role="button"
          aria-label={game.launchHint}
          onKeyDown={onKeyDown}
          onClick={launch}
          className="relative mt-6 aspect-[16/10] w-full touch-none select-none overflow-hidden rounded-3xl border border-line bg-ink sm:aspect-[16/8]"
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${lines.join(" ")} — ${game.srDescription}`}
            className="absolute inset-0 h-full w-full"
          />

          {status !== "playing" && (
            <p className="label pointer-events-none absolute inset-x-0 bottom-[18%] text-center text-muted">
              {status === "lost" ? game.lostLabel : game.launchHint}
            </p>
          )}
        </div>

        {/* ---- Custom text ---- */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          {draft.map((line, i) => (
            <div key={i} className="min-w-0 flex-1">
              <label htmlFor={`game-line-${i}`} className="sr-only">
                {game.lineLabels[i]}
              </label>
              <input
                id={`game-line-${i}`}
                value={line}
                onChange={(e) =>
                  setDraft((d) =>
                    d.map((v, j) => (j === i ? clean(e.target.value) : v)),
                  )
                }
                placeholder={game.lineLabels[i]}
                spellCheck={false}
                className="w-full rounded-full border border-line bg-card px-5 py-3 font-mono text-sm uppercase tracking-wider text-bone outline-none transition-colors placeholder:text-muted focus:border-bone"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => setLines(draft)}
            data-goo
            className="group shrink-0 rounded-full bg-bone px-6 py-3.5 label text-ink transition-opacity hover:opacity-85"
          >
            <TextRoll label={game.rasterizeLabel} />
          </button>

          <button
            type="button"
            onClick={() => {
              setDraft(game.defaultLines);
              setLines(game.defaultLines);
            }}
            aria-label={game.resetLabel}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-bone hover:text-bone"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 11.5a8 8 0 10-2.3 6.2M20 5.5v6h-6" />
            </svg>
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="label text-muted">{game.hint}</p>
          <p role="status" aria-live="polite" className="label text-signal">
            {message}
          </p>
        </div>
      </Container>
    </Section>
  );
};

export default Game;
