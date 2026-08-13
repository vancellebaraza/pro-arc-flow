import { createFileRoute, Link } from "@tanstack/react-router";
import { SERVICES } from "@/lib/services";
import { Logo } from "@/components/Logo";
import { ArrowRight, ShieldCheck, ClipboardList, BarChart3 } from "lucide-react";
import Footer from "@/components/ui/footer";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WhatsAppButton from "@/components/WhatsAppButton2";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FusionPro — RealArc Estates Operations" },
      {
        name: "description",
        content:
          "Property service operations for RealArc Estates: electrical, plumbing, landscaping, painting, property management, tank cleaning.",
      },
    ],
  }),
  component: Landing,
});



function Landing() {
  const [selectedService, setSelectedService] = useState<
  (typeof SERVICES)[number] | null
>(null);

const [open, setOpen] = useState(false);

const openService = (service: (typeof SERVICES)[number]) => {
  setSelectedService(service);
  setOpen(true);
};
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Logo className="h-29 w-auto" />
          <nav className="flex items-center gap-6 text-sm">
            <a href="#services" className="text-muted-foreground hover:text-foreground transition">
              Services
            </a>
            <Link
             to="/about"
             className="text-muted-foreground transition hover:text-foreground"
            >
            About
            </Link>


            <Link
              to="/auth"
              className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-white fade-in">
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/images/hero-engineer.png"
            alt="Engineer on site"
            className="absolute inset-0 h-full w-full object-cover object-[right_center]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.96),transparent_28%),linear-gradient(90deg,rgba(255,255,255,0.98),rgba(255,255,255,0.6) 35%,transparent 65%),linear-gradient(180deg,rgba(255,255,255,0.95),transparent 42%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 z-10">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                FusionPro limited · Repairs & Renovations 
              </p>
              <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
                Your trusted partner for repairs, renovations, and property improvement.
              </h1>
              <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
                FusionPro Limited delivers reliable repair, maintenance,renovation, and  home improvement services for home owners,landlords,businesses, and property managers. From small fixes to complete renovations, we handle every project with quality craftsmanship and attention to detail.
                </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:opacity-90 transition"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center rounded-md border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-accent transition"
                >
                  View services
                </a>
              </div>
            </div>
            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      <section id="services" className="border-t bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Services</h2>
              <p className="mt-2 text-muted-foreground">
                End-to-end coverage across property operations.
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
<article
  key={s.key}
  onClick={() => openService(s)}
  className="group cursor-pointer overflow-hidden rounded-xl border bg-card transition hover:border-foreground/30 hover:-translate-y-1 hover:shadow-xl"
>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.label}
                    width={1024}
                    height={640}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-background">
                    <div className="grid h-8 w-8 place-items-center rounded-md bg-background/15 backdrop-blur">
                      <s.icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium drop-shadow">{s.label}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* <section id="about" className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-3 gap-10">
          <div className="md:col-span-1">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">About</h2>
            <p className="mt-3 text-muted-foreground">
              Built for FusionPro Limited &apos; multi-trade operations team.
            </p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: ClipboardList,
                t: "Structured intake",
                d: "Clients submit requests with details and images. Engineers receive and inspect.",
              },
              {
                icon: ShieldCheck,
                t: "Quote & approve",
                d: "Excel-style quotation tables, client approval, admin scheduling.",
              },
              {
                icon: BarChart3,
                t: "Track & report",
                d: "Progress stages, quoted vs actual costs, PDF & CSV exports.",
              },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border bg-card p-5">
                <x.icon className="h-5 w-5" />
                <h3 className="mt-3 font-medium">{x.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      <Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-3xl p-0 overflow-hidden">
    {selectedService && (
      <>
        <img
          src={selectedService.image}
          alt={selectedService.label}
          className="h-72 w-full object-cover"
        />

        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedService.label}
            </DialogTitle>
          </DialogHeader>

          <p className="mt-4 text-muted-foreground leading-7">
            {selectedService.desc}
          </p>

          {/* Optional extra details */}
          <div className="mt-6 flex items-center gap-2">
            <selectedService.icon className="h-5 w-5 text-primary" />
            <span className="font-medium">
              FusionPro Services
            </span>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-5 py-2 text-primary-foreground hover:opacity-90"
            >
              ← Back
            </button>
          </div>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>

<Footer />

<WhatsAppButton />
    </div>
  );
}
