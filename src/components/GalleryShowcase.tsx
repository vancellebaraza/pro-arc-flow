import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Play, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { isVideoUrl } from "@/lib/media";

interface GallerySet {
  id: string;
  before_images: string[];
  after_images: string[];
  before_text: string;
  after_text: string;
  title: string;
  subtitle: string;
  before_heading: string;
  after_heading: string;
  footer_tags: string[];
}

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

function ImageCluster({
  urls,
  label,
  eager,
  near,
  onOpen,
}: {
  urls: string[];
  label: string;
  eager: boolean;
  near: boolean;
  onOpen: (url: string) => void;
}) {
  const count = Math.min(urls.length, 3);
  const layout =
    count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2";

  return (
    <div
      className={`grid aspect-[16/10] max-h-[30dvh] w-full gap-2 overflow-hidden rounded-2xl ${layout}`}
    >
      {urls.slice(0, 3).map((url, i) => (
        <button
          key={url}
          type="button"
          onClick={() => onOpen(url)}
          aria-label={
            isVideoUrl(url) ? `Play ${label} video ${i + 1}` : `Enlarge ${label} photo ${i + 1}`
          }
          className={`group/img relative h-full w-full overflow-hidden bg-muted ${
            count === 3 && i === 0 ? "row-span-2" : ""
          }`}
        >
          {isVideoUrl(url) ? (
            <>
              {/* Only nearby slides load the video's first frame, so the page stays light. */}
              {near ? (
                <video
                  src={`${url}#t=0.1`}
                  preload="metadata"
                  muted
                  playsInline
                  tabIndex={-1}
                  aria-hidden="true"
                  className="h-full w-full object-cover transition duration-700 group-hover/img:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition group-hover/img:scale-110">
                  <Play className="h-5 w-5 translate-x-0.5 fill-current" />
                </span>
              </span>
            </>
          ) : (
            <img
              src={url}
              alt={`${label} photo ${i + 1}`}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover transition duration-700 group-hover/img:scale-105"
            />
          )}
        </button>
      ))}
    </div>
  );
}

function SidePanel({
  side,
  heading,
  text,
  delay,
}: {
  side: "before" | "after";
  heading: string;
  text: string;
  delay: string;
}) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!heading.trim() && lines.length === 0) return null;

  const isBefore = side === "before";

  return (
    <div
      className={`mt-4 translate-y-10 rounded-2xl border bg-card/60 p-4 opacity-0 transition-all duration-700 md:p-5 ${EASE} ${delay} group-data-[revealed=true]:translate-y-0 group-data-[revealed=true]:opacity-100`}
    >
      {heading.trim() && (
        <>
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.25em] ${
              isBefore ? "text-muted-foreground" : "text-primary"
            }`}
          >
            {isBefore ? "The problem" : "The solution"}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight md:text-xl">{heading}</h3>
        </>
      )}

      {lines.length === 1 ? (
        <p className="mt-3 border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground md:text-base">
          {lines[0]}
        </p>
      ) : lines.length > 1 ? (
        <ul className="mt-3 space-y-1.5">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-5 text-muted-foreground">
              <span
                className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  isBefore ? "bg-red-500/15 text-red-600" : "bg-green-500/15 text-green-600"
                }`}
              >
                {isBefore ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function GalleryShowcase() {
  const [sets, setSets] = useState<GallerySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [current, setCurrent] = useState(0);
  const [enlarged, setEnlarged] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase
        .from("gallery_sets")
        .select(
          "id,before_images,after_images,before_text,after_text,title,subtitle,before_heading,after_heading,footer_tags",
        )
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!active) return;
      if (error) {
        console.error(error);
        setFailed(true);
      } else {
        setSets((data ?? []) as GallerySet[]);
      }
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  // Reveal a slide when it crosses the middle of the screen, and reset it only
  // once it has fully left the screen so the animation replays on the way back.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || sets.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setRevealed(sets.map(() => true));
      return;
    }

    setRevealed(sets.map(() => false));

    const indexOf = (el: Element) => Number((el as HTMLElement).dataset.index);

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = indexOf(entry.target);
          setCurrent(index);
          setRevealed((prev) =>
            prev[index] ? prev : prev.map((v, i) => (i === index ? true : v)),
          );
        }
      },
      { root, rootMargin: "-35% 0px -35% 0px", threshold: 0 },
    );

    const reset = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) continue;
          const index = indexOf(entry.target);
          setRevealed((prev) =>
            prev[index] ? prev.map((v, i) => (i === index ? false : v)) : prev,
          );
        }
      },
      { root, threshold: 0 },
    );

    for (const el of slideRefs.current) {
      if (!el) continue;
      reveal.observe(el);
      reset.observe(el);
    }

    return () => {
      reveal.disconnect();
      reset.disconnect();
    };
  }, [sets]);

  useEffect(() => {
    if (!enlarged) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEnlarged(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enlarged]);

  useEffect(() => {
    scrollRef.current?.focus({ preventScroll: true });
  }, [loading]);

  const goTo = useCallback((index: number) => {
    slideRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const total = sets.length;

  return (
    <div className="bg-background">
      <header className="relative z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-6">
        <Link to="/" aria-label="Back to home" className="flex items-center">
          <Logo className="h-10 w-auto sm:h-12" />
        </Link>

        <div className="flex items-center gap-4">
          {total > 0 && (
            <span className="text-xs font-medium tabular-nums tracking-[0.2em] text-muted-foreground">
              {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>

      <div
        ref={scrollRef}
        tabIndex={0}
        className="relative h-[calc(100dvh-4rem)] snap-y snap-proximity overflow-y-auto overflow-x-hidden scroll-smooth outline-none md:snap-mandatory"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading gallery…
          </div>
        ) : failed ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            We couldn't load the gallery right now. Please refresh and try again.
          </div>
        ) : total === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No projects have been added yet. Please check back soon.
          </div>
        ) : (
          sets.map((set, index) => (
            <section
              key={set.id}
              ref={(el) => {
                slideRefs.current[index] = el;
              }}
              data-index={index}
              data-revealed={revealed[index] ? "true" : "false"}
              className="group flex min-h-[calc(100dvh-4rem)] snap-start items-center px-4 py-6 sm:px-8"
            >
              <div className="mx-auto w-full max-w-6xl">
                {(set.title.trim() || set.subtitle.trim()) && (
                  <div
                    className={`mb-5 -translate-y-6 text-center opacity-0 transition-all duration-1000 ${EASE} group-data-[revealed=true]:translate-y-0 group-data-[revealed=true]:opacity-100`}
                  >
                    <p className="flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-primary">
                      <span className="h-px w-8 bg-primary/40" />
                      Our work
                      <span className="h-px w-8 bg-primary/40" />
                    </p>
                    {set.title.trim() && (
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-4xl">
                        {set.title}
                      </h2>
                    )}
                    {set.subtitle.trim() && (
                      <p className="mt-2 text-sm text-muted-foreground md:text-base">
                        {set.subtitle}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                  <figure
                    className={`-translate-x-[40vw] opacity-0 transition-all duration-1000 ${EASE} group-data-[revealed=true]:translate-x-0 group-data-[revealed=true]:opacity-100`}
                  >
                    <div className="relative">
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-background">
                        Before
                      </span>
                      <ImageCluster
                        urls={set.before_images}
                        label="Before"
                        eager={index === 0}
                        near={Math.abs(index - current) <= 1}
                        onOpen={setEnlarged}
                      />
                    </div>
                    <SidePanel
                      side="before"
                      heading={set.before_heading}
                      text={set.before_text}
                      delay="delay-[600ms]"
                    />
                  </figure>

                  <figure
                    className={`translate-x-[40vw] opacity-0 transition-all duration-1000 delay-150 ${EASE} group-data-[revealed=true]:translate-x-0 group-data-[revealed=true]:opacity-100`}
                  >
                    <div className="relative">
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                        After
                      </span>
                      <ImageCluster
                        urls={set.after_images}
                        label="After"
                        eager={index === 0}
                        near={Math.abs(index - current) <= 1}
                        onOpen={setEnlarged}
                      />
                    </div>
                    <SidePanel
                      side="after"
                      heading={set.after_heading}
                      text={set.after_text}
                      delay="delay-[750ms]"
                    />
                  </figure>
                </div>

                {set.footer_tags.length > 0 && (
                  <div
                    className={`mt-5 flex translate-y-8 items-center justify-between gap-3 rounded-2xl bg-muted/60 px-5 py-3 opacity-0 transition-all duration-1000 delay-[900ms] ${EASE} group-data-[revealed=true]:translate-y-0 group-data-[revealed=true]:opacity-100`}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground md:text-xs">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-foreground/70" />
                      {set.footer_tags.map((tag, i) => (
                        <Fragment key={`${tag}-${i}`}>
                          <span>{tag}</span>
                          {i < set.footer_tags.length - 1 && (
                            <span className="text-muted-foreground/50">/</span>
                          )}
                        </Fragment>
                      ))}
                    </div>
                    {index < total - 1 && (
                      <button
                        type="button"
                        onClick={() => goTo(index + 1)}
                        aria-label="Next project"
                        className="shrink-0 text-muted-foreground transition hover:text-foreground"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          ))
        )}
      </div>

      {total > 1 && (
        <nav
          aria-label="Gallery progress"
          className="fixed right-3 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex"
        >
          {sets.map((set, index) => (
            <button
              key={set.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Go to project ${index + 1}`}
              aria-current={index === current}
              className={`h-2.5 w-2.5 rounded-full border border-primary transition ${
                index === current ? "scale-125 bg-primary" : "bg-transparent hover:bg-primary/40"
              }`}
            />
          ))}
        </nav>
      )}

      {total > 1 && current < total - 1 && (
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          aria-label="Next project"
          className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 animate-bounce rounded-full border bg-background/90 p-2 text-muted-foreground shadow-md backdrop-blur transition hover:text-foreground"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}

      {enlarged && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setEnlarged(null)}
        >
          <button
            type="button"
            onClick={() => setEnlarged(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {isVideoUrl(enlarged) ? (
            <video
              src={enlarged}
              controls
              autoPlay
              playsInline
              className="max-h-[90dvh] max-w-[92vw] rounded-lg bg-black"
              onClick={(event) => event.stopPropagation()}
            />
          ) : (
            <img
              src={enlarged}
              alt="Enlarged project photo"
              className="max-h-[90dvh] max-w-[92vw] rounded-lg object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
