import { createFileRoute, Link } from "@tanstack/react-router";
import { SERVICES } from "@/lib/services";
import { Logo } from "@/components/Logo";
import { ArrowRight, Menu,ShieldCheck, ClipboardList, BarChart3 } from "lucide-react";
import Footer from "@/components/ui/footer";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import WhatsAppButton from "@/components/WhatsAppButton2";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FusionPro — Property Operations Platform" },
      { name: "author", content: "Vancelle Baraza" },
      {
        name: "description",
        content:
          "FusionPro property service operations platform by Vancelle Baraza: electrical, plumbing, landscaping, painting, property management, tank cleaning.",
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
  const [inquiryService, setInquiryService] = useState<{ key: string; label: string } | null>(null);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  async function submitInquiry() {
    if (!inquiryService) return;
    if (!inquiryName.trim() || (!inquiryEmail.trim() && !inquiryPhone.trim())) {
      toast.error("Please provide your name and at least an email or phone number.");
      return;
    }
    setInquirySubmitting(true);
    const { error } = await supabase.from("inquiries").insert({
      service_key: inquiryService.key,
      name: inquiryName.trim(),
      email: inquiryEmail.trim() || null,
      phone: inquiryPhone.trim() || null,
      message: inquiryMessage.trim() || null,
    });
    setInquirySubmitting(false);
    if (error) {
      toast.error("Could not send your inquiry. Please try again.");
      return;
    }
    toast.success("Thank you! We'll be in touch shortly.");
    setInquiryService(null);
    setInquiryName("");
    setInquiryEmail("");
    setInquiryPhone("");
    setInquiryMessage("");
  }

const openService = (service: (typeof SERVICES)[number]) => {
  setSelectedService(service);
  setOpen(true);
};
  return (
    <div className="min-h-screen bg-background text-foreground">
<header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
  <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

    {/* Logo */}
    <Link to="/" className="flex items-center">
      <Logo className="h-16 w-auto sm:h-20" />
    </Link>

    {/* Desktop Navigation */}
    <nav className="hidden items-center gap-6 text-sm md:flex">
      <a
        href="#services"
        className="text-muted-foreground transition hover:text-foreground"
      >
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
        className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Sign in
        <ArrowRight className="h-4 w-4" />
      </Link>
    </nav>

    {/* Mobile Navigation */}
    <div className="md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <a href="#services" className="w-full">
              Services
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/about" className="w-full">
              About
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              to="/auth"
              className="flex w-full items-center justify-between"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

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
                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInquiryService({ key: s.key, label: s.label });
                      }}
                    >
                      Enquire Now
                    </Button>
                  </div>
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

<Dialog open={inquiryService !== null} onOpenChange={(o) => !o && setInquiryService(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Enquire about {inquiryService?.label}</DialogTitle>
      <DialogDescription>Tell us a bit about what you need and we'll get back to you.</DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inquiry-name">Name</Label>
        <Input id="inquiry-name" value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inquiry-email">Email</Label>
        <Input id="inquiry-email" type="email" value={inquiryEmail} onChange={(e) => setInquiryEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inquiry-phone">Phone</Label>
        <Input id="inquiry-phone" value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inquiry-message">Message (optional)</Label>
        <Textarea id="inquiry-message" value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} rows={3} />
      </div>
      <Button onClick={submitInquiry} disabled={inquirySubmitting} className="w-full">
        {inquirySubmitting ? "Sending…" : "Send Enquiry"}
      </Button>
    </div>
  </DialogContent>
</Dialog>

<Footer />

<WhatsAppButton />
    </div>
  );
}
