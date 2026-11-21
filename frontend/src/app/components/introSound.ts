/* ===========================================================================
   introSound.ts — the intro's soundtrack, synthesised live with Web Audio.

   No audio files: every whoosh, clank, thud, grind and boom is generated, so
   nothing needs licensing and every hit lands exactly on its animation beat.
   IntroLoader passes in the event list (seconds from the intro's start), and
   `start(elapsed)` schedules everything still ahead — so if the browser
   blocked autoplay and the visitor taps "sound" halfway through, the track
   joins in sync rather than starting from zero.
--------------------------------------------------------------------------- */

export type SoundEvent = {
  t: number;
  kind: "letter" | "final" | "cut" | "grind" | "scrape" | "burst" | "riser" | "boom";
  dur?: number;
};

export interface IntroSound {
  ctx: AudioContext;
  start(elapsedSec: number): void;
  setMuted(muted: boolean): void;
  stop(fadeSec?: number): void;
}

const LEVEL = 0.75;

function noiseBuffer(ctx: AudioContext, sec: number) {
  const len = Math.floor(ctx.sampleRate * sec);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** A dark, decaying hall — gives the metal hits their size. */
function impulse(ctx: AudioContext, sec: number) {
  const len = Math.floor(ctx.sampleRate * sec);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return buf;
}

/**
 * @param musicUrl  Optional soundtrack file. When given, it is preloaded and
 *   played in place of the synthesised hits, aligned to the intro's first
 *   frame. If it fails to load or decode, the synthesised track plays
 *   instead, so the intro is never silent because of a missing file.
 */
export function createIntroSound(
  events: SoundEvent[],
  totalSec: number,
  musicUrl?: string,
): IntroSound | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;

  let ctx: AudioContext;
  try {
    ctx = new AC();
  } catch {
    return null;
  }

  const master = ctx.createGain();
  master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master.connect(comp);
  comp.connect(ctx.destination);

  const verb = ctx.createConvolver();
  verb.buffer = impulse(ctx, 2.8);
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  wet.connect(verb);
  verb.connect(master);

  const noise = noiseBuffer(ctx, 2);
  let started = false;
  let stopped = false;
  let muted = false;

  /** Route a voice to the dry bus and, scaled, to the reverb. */
  const send = (node: AudioNode, wetAmt = 1) => {
    node.connect(master);
    if (wetAmt > 0) {
      const g = ctx.createGain();
      g.gain.value = wetAmt;
      node.connect(g);
      g.connect(wet);
    }
  };

  const envelope = (g: AudioParam, at: number, attack: number, peak: number, end: number) => {
    g.setValueAtTime(0.0001, at);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + attack);
    g.exponentialRampToValueAtTime(0.0001, end);
  };

  function noiseVoice(
    at: number,
    dur: number,
    type: BiquadFilterType,
    f0: number,
    f1: number,
    q: number,
    peak: number,
    attack: number,
    wetAmt = 1,
  ) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, at);
    f.frequency.exponentialRampToValueAtTime(f1, at + dur);
    const g = ctx.createGain();
    envelope(g.gain, at, Math.min(attack, dur * 0.95), peak, at + dur);
    src.connect(f);
    f.connect(g);
    send(g, wetAmt);
    src.start(at, Math.random() * 1.5);
    src.stop(at + dur + 0.05);
    return g;
  }

  function tone(
    at: number,
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    peak: number,
    attack = 0.005,
    wetAmt = 1,
  ) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, at);
    o.frequency.exponentialRampToValueAtTime(f1, at + dur);
    const g = ctx.createGain();
    envelope(g.gain, at, Math.min(attack, dur * 0.95), peak, at + dur);
    o.connect(g);
    send(g, wetAmt);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  /* --- building blocks ---------------------------------------------------- */

  /** Struck metal: inharmonic partials ringing out, plus the strike click. */
  const clank = (at: number, base: number, peak: number) => {
    [1, 2.76, 5.4, 8.93].forEach((m, k) =>
      tone(at, "sine", base * m, base * m * 0.995, 0.9 / (k + 1) + 0.15, peak / (k + 1.2), 0.002, 1.2),
    );
    noiseVoice(at, 0.05, "highpass", 3500, 5000, 0.7, peak * 0.8, 0.002, 0.5);
  };

  /** Weight landing: a falling sub sine. */
  const thud = (at: number, peak: number, len = 0.5, f = 95) =>
    tone(at, "sine", f, 34, len, peak, 0.004, 0.3);

  /** Air rushing past, peaking right at `land`. */
  const whoosh = (land: number, len: number, peak: number) =>
    noiseVoice(land - len, len + 0.08, "bandpass", 350, 2600, 1.3, peak, len * 0.85, 0.6);

  function grind(at: number, dur: number) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 5;
    f.frequency.setValueAtTime(1600, at);
    f.frequency.linearRampToValueAtTime(2400, at + dur);
    const g = ctx.createGain();
    envelope(g.gain, at, 0.08, 0.28, at + dur);
    /* Chatter: a fast square LFO on the level, like metal juddering. */
    const trem = ctx.createGain();
    trem.gain.value = 0.6;
    const lfo = ctx.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 22;
    const depth = ctx.createGain();
    depth.gain.value = 0.4;
    lfo.connect(depth);
    depth.connect(trem.gain);
    src.connect(f);
    f.connect(g);
    g.connect(trem);
    send(trem, 0.6);
    src.start(at, Math.random());
    src.stop(at + dur + 0.05);
    lfo.start(at);
    lfo.stop(at + dur + 0.05);
    tone(at, "sawtooth", 110, 125, dur, 0.04, 0.08, 0.4);
    crackle(at + 0.1, dur - 0.1, 18);
  }

  /** Sparks: a scatter of tiny bright ticks. */
  function crackle(at: number, span: number, n: number) {
    for (let i = 0; i < n; i++) {
      const t = at + Math.random() * span;
      noiseVoice(t, 0.012 + Math.random() * 0.02, "highpass", 4000, 6500, 1, 0.08 + Math.random() * 0.22, 0.002, 0.4);
    }
  }

  function play(e: SoundEvent, t0: number) {
    const at = Math.max(t0 + e.t, ctx.currentTime + 0.01);
    const d = e.dur ?? 0.5;
    switch (e.kind) {
      case "letter":
        whoosh(at, 0.3, 0.35);
        thud(at, 0.9);
        clank(at, 170 + Math.random() * 70, 0.18);
        break;
      case "final":
        whoosh(at, 0.35, 0.4);
        thud(at, 1, 1.5, 80);
        clank(at, 140, 0.3);
        tone(at, "triangle", 220, 218, 2.4, 0.07, 0.01, 1.5);
        break;
      case "cut":
        whoosh(at, 0.18, 0.3);
        thud(at, 0.55, 0.35, 120);
        clank(at, 260 + Math.random() * 80, 0.14);
        break;
      case "grind":
        grind(at, d);
        break;
      case "scrape":
        noiseVoice(at, d, "bandpass", 3000, 5200, 6, 0.24, 0.05, 0.5);
        crackle(at, d, 22);
        break;
      case "burst":
        crackle(at, 0.45, 26);
        clank(at, 300, 0.12);
        break;
      case "riser":
        noiseVoice(at, d, "bandpass", 300, 7000, 2, 0.35, d * 0.95, 0.8);
        tone(at, "sawtooth", 70, 420, d, 0.06, d * 0.9, 0.5);
        break;
      case "boom":
        thud(at, 1.2, 2.2, 70);
        noiseVoice(at, 1.2, "lowpass", 400, 60, 0.7, 0.6, 0.005, 1);
        clank(at, 110, 0.3);
        break;
    }
  }

  /** Low drone under the whole piece; drops out for the black beat. */
  function drone(t0: number, from: number) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 380;
    const g = ctx.createGain();
    const p = g.gain;
    const now = ctx.currentTime;
    const at = (s: number) => Math.max(t0 + s, now);
    p.setValueAtTime(0, now);
    p.linearRampToValueAtTime(0.11, at(Math.max(from, 0) + 1.2));
    p.setValueAtTime(0.11, at(7.7));
    p.linearRampToValueAtTime(0, at(7.76));
    p.setValueAtTime(0, at(8));
    p.linearRampToValueAtTime(0.1, at(8.8));
    p.setValueAtTime(0.1, at(totalSec - 0.8));
    p.linearRampToValueAtTime(0, at(totalSec));
    lp.connect(g);
    send(g, 0.5);
    const end = t0 + totalSec + 0.1;
    (
      [
        ["sawtooth", 55],
        ["sawtooth", 55.5],
        ["triangle", 82.4],
      ] as const
    ).forEach(([type, f]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.connect(lp);
      o.start(now);
      o.stop(Math.max(end, now + 0.1));
    });
  }

  function playSynth(t0: number) {
    const elapsed = ctx.currentTime - t0;
    drone(t0, elapsed);
    for (const e of events) {
      if (e.t + (e.dur ?? 0.3) >= elapsed - 0.05) play(e, t0);
    }
  }

  /* ---- Soundtrack file ----
     Loading starts immediately so the buffer is usually ready by the time
     the context is allowed to run. `music` resolves to null on any failure,
     which routes start() to the synthesised track. */
  let musicSrc: AudioBufferSourceNode | null = null;
  const music: Promise<AudioBuffer | null> = musicUrl
    ? fetch(musicUrl)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((data) => ctx.decodeAudioData(data))
        .catch(() => null)
    : Promise.resolve(null);

  function playMusic(buffer: AudioBuffer, t0: number) {
    if (stopped) return;
    const offset = ctx.currentTime - t0;
    if (offset >= buffer.duration) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    /* The file goes straight out, dry: it is already mixed and mastered. */
    const g = ctx.createGain();
    g.gain.value = 1 / LEVEL;
    src.connect(g);
    g.connect(master);
    src.start(ctx.currentTime, Math.max(0, offset));
    musicSrc = src;
  }

  return {
    ctx,
    start(elapsed) {
      if (started || stopped) return;
      started = true;
      const now = ctx.currentTime;
      const t0 = now - elapsed;
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(muted ? 0 : LEVEL, now + 0.05);
      if (!musicUrl) {
        playSynth(t0);
        return;
      }
      /* Join at the current point once decoded, so a slow load still lands
         in sync rather than starting from the top late. */
      music.then((buffer) => {
        if (stopped) return;
        if (buffer) playMusic(buffer, t0);
        else playSynth(t0);
      });
    },
    setMuted(m) {
      muted = m;
      if (stopped) return;
      master.gain.setTargetAtTime(m ? 0 : LEVEL, ctx.currentTime, 0.05);
    },
    stop(fade = 0.4) {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + fade);
      setTimeout(() => {
        try {
          musicSrc?.stop();
        } catch {
          /* already ended */
        }
        ctx.close().catch(() => {});
      }, fade * 1000 + 120);
    },
  };
}
