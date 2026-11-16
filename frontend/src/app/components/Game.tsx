"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Container, Section } from "./ui/Section";
import { Reveal } from "./ui/Motion";
import { game } from "../../data/content";

/* ---------------------------------------------------------------------------
   A 5x5 dot-matrix alphabet, just the letters the two words need. Each string
   is one row; "1" is a brick. Keeping it as text rather than coordinates
   means the shapes are readable in the source — you can see the letters.
--------------------------------------------------------------------------- */
const GLYPHS: Record<string, string[]> = {
  H: ["10001", "10001", "11111", "10001", "10001"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  L: ["10000", "10000", "10000", "10000", "11111"],
  O: ["11111", "10001", "10001", "10001", "11111"],
  W: ["10001", "10001", "10101", "11011", "10001"],
  R: ["11110", "10001", "11110", "10010", "10001"],
  D: ["11110", "10001", "10001", "10001", "11110"],
};

const GLYPH_W = 5;
const GLYPH_H = 5;
const LETTER_GAP = 1;
const LINE_GAP = 1;

type Brick = { col: number; row: number; alive: boolean };

/** Lay the words out on a single grid of cells, and report the grid size. */
function buildBricks(words: string[]): {
  bricks: Brick[];
  cols: number;
  rows: number;
} {
  const bricks: Brick[] = [];

  const lineWidth = (word: string) =>
    word.length * GLYPH_W + (word.length - 1) * LETTER_GAP;
  const cols = Math.max(...words.map(lineWidth));
  const rows = words.length * GLYPH_H + (words.length - 1) * LINE_GAP;

  words.forEach((word, lineIndex) => {
    /* Centre each line on the widest one, so the block is symmetrical. */
    const offsetX = Math.floor((cols - lineWidth(word)) / 2);
    const offsetY = lineIndex * (GLYPH_H + LINE_GAP);

    word.split("").forEach((char, charIndex) => {
      const glyph = GLYPHS[char];
      if (!glyph) return;
      const charX = offsetX + charIndex * (GLYPH_W + LETTER_GAP);

      glyph.forEach((rowBits, r) => {
        rowBits.split("").forEach((bit, c) => {
          if (bit === "1") {
            bricks.push({ col: charX + c, row: offsetY + r, alive: true });
          }
        });
      });
    });
  });

  return { bricks, cols, rows };
}

type Status = "idle" | "playing" | "won" | "lost";

/**
 * The easter egg: a brick-breaker whose bricks spell HELLO WORLD.
 *
 * Drawn on a canvas rather than in the DOM. There are around 150 bricks plus
 * a ball moving every frame; as DOM nodes that is 150 elements being
 * restyled per frame, where the canvas is one element and a few hundred
 * fills.
 *
 * Nothing starts moving until the visitor presses Play, so this never runs a
 * loop in the background and never animates at people who did not ask for it
 * — which is also why it is safe under reduced motion: every frame it draws
 * is the direct result of an interaction.
 *
 * The whole section is optional and carries no information, so the canvas is
 * labelled and the rest is announced through a live region; a visitor who
 * cannot play it misses nothing.
 */
const Game: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  /* Everything the loop mutates lives in a ref. Putting the ball in state
     would re-render the whole section sixty times a second to redraw a
     canvas that React does not manage anyway. */
  const world = useRef({
    w: 0,
    h: 0,
    bricks: [] as Brick[],
    cols: 0,
    rows: 0,
    cell: 0,
    gridX: 0,
    gridY: 0,
    paddleX: 0.5, // 0–1 across the field
    ball: { x: 0, y: 0, vx: 0, vy: 0, r: 4 },
    running: false,
    raf: 0,
    last: 0,
  });

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

    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    const s = world.current;
    s.w = w;
    s.h = h;

    /* The block of letters takes ~68% of the width, centred, sitting in the
       upper half so there is room to play underneath it. */
    const target = w * 0.68;
    s.cell = target / s.cols;
    s.gridX = (w - s.cols * s.cell) / 2;
    s.gridY = h * 0.1;
    s.ball.r = Math.max(3.5, Math.min(6, w * 0.006));
  }, []);

  const resetBall = useCallback(() => {
    const s = world.current;
    s.ball.x = s.paddleX * s.w;
    s.ball.y = s.h - s.h * 0.1 - 14;
    const speed = Math.max(260, s.h * 0.78);
    /* Always launched upward, angled slightly so the first bounce is not a
       vertical corridor. */
    s.ball.vx = speed * 0.45 * (Math.random() > 0.5 ? 1 : -1);
    s.ball.vy = -speed;
  }, []);

  const resetBricks = useCallback(() => {
    const built = buildBricks(game.word);
    const s = world.current;
    s.bricks = built.bricks;
    s.cols = built.cols;
    s.rows = built.rows;
  }, []);

  /* ---- Drawing ---- */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const s = world.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, s.w, s.h);

    /* Near-white pieces vanish on the light page, so that theme draws them
       in garnet instead. Dark keeps the original value untouched. */
    const piece =
      document.documentElement.dataset.theme === "light"
        ? "#7a2238"
        : "#f4f4f4";

    /* Bricks */
    const pad = s.cell * 0.16;
    const size = s.cell - pad;
    ctx.fillStyle = piece;
    for (const brick of s.bricks) {
      if (!brick.alive) continue;
      ctx.fillRect(
        s.gridX + brick.col * s.cell,
        s.gridY + brick.row * s.cell,
        size,
        size,
      );
    }

    /* Paddle */
    const paddleW = Math.max(70, s.w * 0.14);
    const paddleH = Math.max(7, s.h * 0.016);
    const paddleY = s.h - s.h * 0.1;
    const paddleLeft = Math.min(
      Math.max(s.paddleX * s.w - paddleW / 2, 0),
      s.w - paddleW,
    );
    ctx.fillStyle = piece;
    ctx.beginPath();
    ctx.roundRect(paddleLeft, paddleY, paddleW, paddleH, paddleH / 2);
    ctx.fill();

    /* Ball */
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

      /* Walls */
      if (ball.x - ball.r < 0) {
        ball.x = ball.r;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.x + ball.r > s.w) {
        ball.x = s.w - ball.r;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y - ball.r < 0) {
        ball.y = ball.r;
        ball.vy = Math.abs(ball.vy);
      }

      /* Paddle */
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
           can aim instead of only keeping it alive. */
        const hit = (ball.x - (paddleLeft + paddleW / 2)) / (paddleW / 2);
        const speed = Math.hypot(ball.vx, ball.vy);
        const angle = hit * 1.05; // radians from vertical, capped by hit ∈ [-1,1]
        ball.vx = speed * Math.sin(angle);
        ball.vy = -Math.abs(speed * Math.cos(angle));
      }

      /* Bricks — the ball is small relative to a cell, so testing the cell
         under the ball's centre is enough and costs one lookup rather than a
         pass over every brick. */
      const col = Math.floor((ball.x - s.gridX) / s.cell);
      const row = Math.floor((ball.y - s.gridY) / s.cell);
      const hitBrick = s.bricks.find(
        (b) => b.alive && b.col === col && b.row === row,
      );

      if (hitBrick) {
        hitBrick.alive = false;
        /* Bounce off whichever face the ball entered through. */
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

      /* Dropped it */
      if (ball.y - ball.r > s.h) {
        s.running = false;
        setStatus("lost");
      }
    },
    [],
  );

  const start = useCallback(() => {
    const s = world.current;
    if (!s.bricks.some((b) => b.alive)) resetBricks();
    layout();
    resetBall();
    s.running = true;
    s.last = performance.now();
    setStatus("playing");

    /* Declared here rather than as its own useCallback so it can schedule
       itself by name without the hook depending on its own identity. */
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
  }, [draw, layout, resetBall, resetBricks, step]);

  const restart = useCallback(() => {
    const s = world.current;
    cancelAnimationFrame(s.raf);
    s.running = false;
    resetBricks();
    layout();
    resetBall();
    draw();
    setStatus("idle");
  }, [draw, layout, resetBall, resetBricks]);

  /* ---- Wiring ---- */
  useEffect(() => {
    resetBricks();
    layout();
    resetBall();
    draw();

    const onResize = () => {
      layout();
      draw();
    };
    window.addEventListener("resize", onResize);

    /* Repaint when the theme flips, so an idle board picks up the new
       piece colour without waiting for the next frame. */
    const themeWatcher = new MutationObserver(() => draw());
    themeWatcher.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const s = world.current;
    return () => {
      window.removeEventListener("resize", onResize);
      themeWatcher.disconnect();
      cancelAnimationFrame(s.raf);
      s.running = false;
    };
  }, [draw, layout, resetBall, resetBricks]);

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

  /* Keyboard steering, only while the field has focus — otherwise the arrow
     keys would stop scrolling the page for everyone. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const delta = e.key === "ArrowLeft" ? -0.05 : 0.05;
    world.current.paddleX = Math.min(
      Math.max(world.current.paddleX + delta, 0),
      1,
    );
    if (!world.current.running) draw();
  };

  const message =
    status === "won"
      ? game.clearedLabel
      : status === "lost"
        ? game.lostLabel
        : "";

  return (
    <Section className="py-24 sm:py-32">
      <Container className="relative z-10">
        {/* ---- Tagline and controls ---- */}
        <div className="flex items-start justify-between gap-6">
          <Reveal>
            <p className="label text-muted">{game.label}</p>
            <p className="mt-4 inline-block border-b border-line pb-2 text-sm font-medium text-bone">
              {game.tagline}
            </p>
          </Reveal>

          <button
            type="button"
            onClick={restart}
            aria-label={game.restartLabel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-bone transition-colors hover:border-bone"
          >
            <span aria-hidden="true" className="flex gap-1">
              <span className="block h-1 w-1 rounded-full bg-current" />
              <span className="block h-1 w-1 rounded-full bg-current" />
              <span className="block h-1 w-1 rounded-full bg-current" />
            </span>
          </button>
        </div>

        {/* ---- Field ---- */}
        <div
          ref={wrapRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="relative mt-10 aspect-[16/10] w-full touch-none select-none rounded-3xl border border-line bg-ink sm:aspect-[16/8]"
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${game.word.join(" ")} — ${game.srDescription}`}
            className="absolute inset-0 h-full w-full"
          />

          {/* Play overlay, shown whenever the ball is not in motion.
              It is offset with `bottom` rather than a percentage padding:
              a percentage padding resolves against the field's *width*, which
              on a wide screen pushes the button up into the bricks. */}
          {status !== "playing" && (
            <div className="absolute inset-x-0 bottom-[20%] flex justify-center">
              <button
                type="button"
                onClick={start}
                className="rounded-full border border-line bg-ink/70 px-8 py-3.5 label text-bone backdrop-blur transition-colors hover:border-bone hover:bg-bone hover:text-ink"
              >
                {status === "idle" ? game.playLabel : game.restartLabel}
              </button>
            </div>
          )}
        </div>

        {/* ---- Hint and result ---- */}
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
