import hero640Avif from "@/assets/login/login-engineer-640.avif";
import hero640Webp from "@/assets/login/login-engineer-640.webp";
import hero800Avif from "@/assets/login/login-engineer-800.avif";
import hero800Webp from "@/assets/login/login-engineer-800.webp";
import hero800Jpg from "@/assets/login/login-engineer-800.jpg";
import hero1512Avif from "@/assets/login/login-engineer-1512.avif";
import hero1512Webp from "@/assets/login/login-engineer-1512.webp";

export const LOGIN_HERO_SIZES = "max(50vw, 188vh)";
export const LOGIN_HERO = {
  mobile: { avif: hero640Avif, webp: hero640Webp },
  desktop: {
    avif: `${hero800Avif} 800w, ${hero1512Avif} 1512w`,
    webp: `${hero800Webp} 800w, ${hero1512Webp} 1512w`,
  },
  fallback: hero800Jpg,
};

const HOME_HERO = "/images/hero-engineer.png";
const warmed = new Set<string>();

// Detached elements stay referenced here so the downloads are not abandoned.
const inFlight: HTMLElement[] = [];

/**
 * Starts downloading the login hero the page will actually use. It builds the same
 * <picture> as /auth (same sources, media and sizes), so the browser picks the identical
 * file and format and the route finds it cached. Call it on hover, focus or touch of a
 * sign-in link, never on page load.
 */
export function warmLoginHero() {
  if (typeof window === "undefined" || warmed.has("login")) return;
  warmed.add("login");
  const picture = document.createElement("picture");
  const source = (media: string, type: string, srcset: string, sizes?: string) => {
    const el = document.createElement("source");
    el.media = media;
    el.type = type;
    el.srcset = srcset;
    if (sizes) el.sizes = sizes;
    picture.append(el);
  };
  source("(min-width: 768px)", "image/avif", LOGIN_HERO.desktop.avif, LOGIN_HERO_SIZES);
  source("(min-width: 768px)", "image/webp", LOGIN_HERO.desktop.webp, LOGIN_HERO_SIZES);
  source("(max-width: 767px)", "image/avif", LOGIN_HERO.mobile.avif);
  source("(max-width: 767px)", "image/webp", LOGIN_HERO.mobile.webp);
  const img = document.createElement("img");
  img.decoding = "async";
  img.src = LOGIN_HERO.fallback;
  picture.append(img);
  inFlight.push(picture);
}

/** Warms the home hero for the "Back to home" link, for visitors who landed on /auth first. */
export function warmHomeHero() {
  if (typeof window === "undefined" || warmed.has("home")) return;
  warmed.add("home");
  new Image().src = HOME_HERO;
}
