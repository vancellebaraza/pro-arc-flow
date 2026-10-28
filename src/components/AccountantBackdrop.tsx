import bg480Avif from "@/assets/accountant/accountant-bg-480.avif";
import bg480Webp from "@/assets/accountant/accountant-bg-480.webp";
import bg735Avif from "@/assets/accountant/accountant-bg-735.avif";
import bg735Webp from "@/assets/accountant/accountant-bg-735.webp";

/**
 * Decorative grayscale picture behind the top of the accountant pages (header and first stat
 * strip). It is faint, anchored right, and masked to fade out before tables and forms begin.
 * The layer has a fixed height and sits behind the content, so it never shifts the layout.
 */
export function AccountantBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="accountant-backdrop pointer-events-none absolute right-0 top-0 -z-10 h-[300px] w-[min(1100px,100%)] opacity-[0.08]"
    >
      <picture>
        <source media="(min-width: 768px)" type="image/avif" srcSet={bg735Avif} />
        <source media="(min-width: 768px)" type="image/webp" srcSet={bg735Webp} />
        <source type="image/avif" srcSet={bg480Avif} />
        <img
          src={bg480Webp}
          width={735}
          height={490}
          alt=""
          decoding="async"
          className="h-full w-full object-cover object-[right_45%]"
        />
      </picture>
    </div>
  );
}
