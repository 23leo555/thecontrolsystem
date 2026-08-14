"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { site } from "@/lib/site";
import { CTA_LABEL } from "@/content/landing";

/** Progi raportowane raz na sesję (sekcja M7). */
const MILESTONES = [
  { at: 0.25, event: "vsl_25" },
  { at: 0.5, event: "vsl_50" },
  { at: 0.75, event: "vsl_75" },
] as const;

/** Po tylu ms bez odtwarzania pokazujemy komunikat awarii (M6). */
const STALL_TIMEOUT_MS = 8000;
/** Spinner dopiero po tym czasie bufferowania — krótkie zacięcia nie migają (M6). */
const SPINNER_DELAY_MS = 300;

type Phase = "idle" | "playing" | "ended" | "error";

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [showSpinner, setShowSpinner] = useState(false);

  // Zdarzenia raz na sesję — Set przeżywa re-rendery, więc trzymamy go w ref.
  const firedRef = useRef<Set<string>>(new Set());
  const spinnerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireOnce = useCallback((event: Parameters<typeof track>[0]) => {
    if (firedRef.current.has(event)) return;
    firedRef.current.add(event);
    track(event);
  }, []);

  /* --- vsl_visible: pierwsze wejście playera w widok (M7) --- */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            fireOnce("vsl_visible");
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fireOnce]);

  const clearTimers = useCallback(() => {
    if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
    if (stallTimer.current) clearTimeout(stallTimer.current);
    spinnerTimer.current = null;
    stallTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const handlePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setPhase("playing");
    fireOnce("vsl_play");
    v.play().catch(() => {
      // Nie pokazujemy kodu błędu użytkownikowi (M6) — tylko wewnętrzny event.
      track("vsl_error", { stage: "play_rejected" });
      setPhase("error");
    });
  }, [fireOnce]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const ratio = v.currentTime / v.duration;
    for (const m of MILESTONES) {
      if (ratio >= m.at) fireOnce(m.event);
    }
  }, [fireOnce]);

  const handleWaiting = useCallback(() => {
    if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
    spinnerTimer.current = setTimeout(() => setShowSpinner(true), SPINNER_DELAY_MS);

    if (stallTimer.current) clearTimeout(stallTimer.current);
    stallTimer.current = setTimeout(() => {
      track("vsl_error", { stage: "stalled" });
      setPhase("error");
      setShowSpinner(false);
    }, STALL_TIMEOUT_MS);
  }, []);

  const handlePlaying = useCallback(() => {
    clearTimers();
    setShowSpinner(false);
  }, [clearTimers]);

  const handleEnded = useCallback(() => {
    // Świadomie NIE przekierowujemy automatycznie (M4).
    setPhase("ended");
    fireOnce("vsl_complete");
  }, [fireOnce]);

  const handleRetry = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    clearTimers();
    setPhase("idle");
    setShowSpinner(false);
    v.load();
  }, [clearTimers]);

  const handleReplay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    track("vsl_replay");
    v.currentTime = 0;
    setPhase("playing");
    void v.play();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div
        ref={wrapperRef}
        className={[
          "relative isolate w-full overflow-hidden",
          "aspect-video", // rezerwuje wysokość -> CLS 0 (M1)
          "rounded-xl sm:rounded-[14px] lg:rounded-2xl",
          "border border-tcs-border bg-tcs-bg",
          "shadow-[0_18px_48px_-32px_rgba(0,0,0,0.9)]", // subtelny cień, bez glow (M1)
        ].join(" ")}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full"
          // Bez autoplay, szczególnie bez dźwięku (M4).
          preload="metadata"
          playsInline
          controls={phase === "playing" || phase === "ended"}
          // Bez atrybutu `poster` — nakładka niżej renderuje ten sam kadr w AVIF/WebP
          // już w HTML-u serwerowym. Atrybut powodowałby drugie pobranie (JPEG).
          aria-label="Film: Jak działa The Control System"
          onTimeUpdate={handleTimeUpdate}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onEnded={handleEnded}
          onError={() => {
            track("vsl_error", { stage: "media_error" });
            setPhase("error");
          }}
        >
          <source src={site.vsl.src} type="video/mp4" />
          {/* Napisy pl.vtt są blokerem P0 — track pojawia się dopiero, gdy plik istnieje (M5). */}
          {site.vsl.captions && (
            <track kind="captions" srcLang="pl" label="Polski" src={site.vsl.captions} default />
          )}
        </video>

        {/* --- Warstwa startowa: poster + Play (M2) --- */}
        {phase === "idle" && (
          <button
            type="button"
            onClick={handlePlay}
            className="group absolute inset-0 z-10 flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-tcs-blue"
            aria-label={`Odtwórz film: Jak działa The Control System, czas trwania ${site.vsl.durationLabel}`}
          >
            <picture>
              <source srcSet={`${site.vsl.poster}.avif`} type="image/avif" />
              <source srcSet={`${site.vsl.poster}.webp`} type="image/webp" />
              <img
                src={`${site.vsl.poster}.jpg`}
                alt=""
                width={1280}
                height={720}
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
              />
            </picture>
            {/* 18% czarnego overlayu dla czytelności kontrolki (M2) */}
            <span aria-hidden className="absolute inset-0 bg-black/[0.18]" />

            <span
              aria-hidden
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-tcs-gold transition-transform duration-200 group-hover:scale-105 sm:h-16 sm:w-16"
            >
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 sm:h-7 sm:w-7" fill="#fff">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="relative mt-4 text-[13px] font-semibold tracking-[0.12em] text-tcs-text sm:text-sm">
              OBEJRZYJ {site.vsl.durationLabel}
            </span>
          </button>
        )}

        {/* --- Spinner dopiero po 300 ms bufferowania (M6) --- */}
        {showSpinner && phase === "playing" && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span
              className="h-10 w-10 animate-spin rounded-full border-2 border-tcs-border border-t-tcs-gold"
              role="status"
              aria-label="Wczytywanie filmu"
            />
          </div>
        )}

        {/* --- End screen: spokojny, bez auto-przekierowania (M4) --- */}
        {phase === "ended" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-tcs-bg/95 px-6 text-center">
            <p className="max-w-[36ch] text-base text-tcs-text sm:text-lg">
              Jeśli rozpoznajesz siebie w tym materiale, zrób pierwszy krok.
            </p>
            <Link
              href={`${site.routes.apply}?source=vsl_complete`}
              className="inline-flex min-h-[56px] w-full max-w-[420px] items-center justify-center rounded-[14px] bg-tcs-gold px-5 text-[14px] font-bold tracking-[0.04em] text-[#07090C] transition-colors hover:bg-tcs-gold-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue focus-visible:ring-offset-[3px] focus-visible:ring-offset-tcs-bg sm:text-[15px]"
            >
              {CTA_LABEL}
            </Link>
            <button
              type="button"
              onClick={handleReplay}
              className="text-sm text-tcs-text-muted underline underline-offset-4 transition-colors hover:text-tcs-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tcs-blue"
            >
              Obejrzyj ponownie
            </button>
          </div>
        )}

        {/* --- Awaria: bez kodów technicznych (M6) --- */}
        {phase === "error" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-tcs-bg/95 px-6 text-center">
            <p className="max-w-[40ch] text-base text-tcs-text">
              Film nie może zostać teraz odtworzony. Sprawdź połączenie lub spróbuj ponownie.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex min-h-[48px] items-center justify-center rounded-[14px] border border-tcs-border px-6 text-[14px] font-bold tracking-[0.04em] text-tcs-text transition-colors hover:border-tcs-gold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue focus-visible:ring-offset-[3px] focus-visible:ring-offset-tcs-bg"
            >
              SPRÓBUJ PONOWNIE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
