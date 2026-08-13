
import {
  Award,
  CheckCircle2,
  Clock3,
  Eye,
  Handshake,
  Heart,
  SearchCheck,
  ShieldCheck,
  Target,
  Users,
  Wrench,
  Zap,
  Menu,
} from "lucide-react";
import Footer from "@/components/ui/footer";
import { Logo } from "@/components/Logo";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import aboutHero from "../assets/hero1.jpeg";
import WhatsAppButton from "./WhatsAppButton2";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AboutUs() {
  const approach = [
    {
      icon: Users,
      title: "Listen Carefully",
      description: "Understand the property's needs first.",
    },
    {
      icon: SearchCheck,
      title: "Assess Thoroughly",
      description: "Find the root cause, not just the symptoms.",
    },
    {
      icon: CheckCircle2,
      title: "Recommend Right",
      description: "Offer practical, cost-effective solutions.",
    },
    {
      icon: Wrench,
      title: "Work Efficiently",
      description: "Restore service with minimal disruption.",
    },
  ];

  const coreValues = [
    {
      icon: ShieldCheck,
      title: "Reliability",
      description:
        "We respond to maintenance needs and honor every commitment we make.",
    },
    {
      icon: Award,
      title: "Professionalism",
      description:
        "We maintain high standards in every assignment, without exception.",
    },
    {
      icon: Handshake,
      title: "Integrity",
      description:
        "Honest assessments, clear communication, and dependable workmanship.",
    },
    {
      icon: Wrench,
      title: "Quality",
      description:
        "Durable repairs and practical long-term solutions every time.",
    },
    {
      icon: Heart,
      title: "Customer Care",
      description:
        "Every service request is treated with urgency, respect, and attention.",
    },
    {
      icon: Zap,
      title: "Efficiency",
      description:
        "Minimizing disruption and restoring properties as quickly as possible.",
    },
  ];

  const whyChooseUs = [
    {
      icon: Wrench,
      title: "Dedicated Focus",
      description:
        "Repairs and maintenance are all we do — delivering deeper expertise and better results.",
    },
    {
      icon: Zap,
      title: "Responsive On-Site Service",
      description:
        "Practical solutions from a team that shows up fast and gets the job done right.",
    },
    {
      icon: CheckCircle2,
      title: "Clear Communication",
      description:
        "Transparent updates from start to finish, with no surprises or guesswork.",
    },
  ];

  const propertySolutions = [
    {
      icon: Clock3,
      title: "Routine Upkeep",
      description:
        "Ongoing maintenance that prevents problems.",
    },
    {
      icon: Zap,
      title: "Urgent Repairs",
      description:
        "Fast response when issues arise.",
    },
    {
      icon: ShieldCheck,
      title: "Long-Term Protection",
      description:
        "Preserve value, safety, and usability.",
    },
  ];

  return (
    <main className="bg-background">
<header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
  <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

    {/* Logo */}
    <Link to="/" className="flex items-center">
      <Logo className="h-14 w-auto sm:h-16" />
    </Link>

    {/* Desktop Navigation */}
    <nav className="hidden items-center gap-5 text-sm md:flex lg:gap-6">
      <Link
        to="/"
        className="text-muted-foreground transition hover:text-foreground"
      >
        Home
      </Link>

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background transition hover:bg-accent md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-52"
      >
        <DropdownMenuItem asChild>
          <Link to="/" className="w-full cursor-pointer">
            Home
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/about" className="w-full cursor-pointer">
            About
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            to="/auth"
            className="flex w-full cursor-pointer items-center justify-between"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

  </div>
</header>
{/* Hero */}
<section className="relative overflow-hidden border-b">
  {/* Background Image */}
  <div className="absolute inset-0">
    <img
      src={aboutHero}
      alt="FusionPro property maintenance"
      className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
    />

    {/* Overlay */}
    <div className="absolute inset-0 bg-black/45" />
  </div>

  {/* Hero Content */}
  <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-32">
    <div className="max-w-4xl">

      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
        About FusionPro
      </p>

      <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-6xl">
        Reliable Repairs. Professional Maintenance.
      </h1>

      <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 md:text-lg">
        FusionPro focuses exclusively on keeping properties functional,
        safe, and well-maintained through reliable repairs and
        professional maintenance services.
      </p>

    </div>
  </div>
</section>



      {/* Who We Are */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Who We Are
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                A Dedicated Repairs &amp; Maintenance Company
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
                FusionPro focuses exclusively on keeping properties functional,
                safe, and well-maintained.
              </p>
            </div>

            <div className="rounded-2xl bg-card p-8 shadow-sm md:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>

              <h3 className="mt-6 text-2xl font-semibold">
                Who We Serve
              </h3>

              <ul className="mt-5 space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Residential property owners and tenants</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Commercial property operators</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>Managed property portfolios</span>
                </li>
              </ul>

              <p className="mt-6 text-sm leading-6 text-muted-foreground">
                We deliver responsive, practical solutions across every
                property type.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">

          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Our Approach
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Every service call follows a disciplined four-step process.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {approach.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="text-sm font-semibold text-primary">
                    0{index + 1}
                  </span>

                  <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Mission */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">

          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Our Mission
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Service built around reliability and value.
              </h2>
            </div>

            <div className="rounded-2xl bg-card p-8 shadow-sm md:p-10">
              <blockquote className="border-l-4 border-primary pl-6 text-lg leading-8 text-foreground md:text-xl">
                To provide high-quality, prompt, reliable, and cost-effective
                repairs and maintenance services with integrity,
                professionalism, and a strong commitment to customer
                satisfaction.
              </blockquote>

              <div className="mt-8 space-y-4 text-muted-foreground">
                <p className="leading-7">
                  We respond quickly, communicate clearly, and deliver
                  workmanship that lasts.
                </p>

                <p className="leading-7">
                  Every job is completed with care, professionalism, and a
                  focus on value.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Vision */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">

            <div className="rounded-2xl bg-card p-8 shadow-sm md:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Our Vision
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                The Preferred Partner
              </h2>

              <p className="mt-4 text-lg font-medium leading-7">
                for reliable repairs and maintenance that keep Kenyan
                properties safe, functional, and looking their best.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {[
                  "Property Owners",
                  "Tenants",
                  "Property Managers",
                  "Businesses",
                ].map((audience) => (
                  <span
                    key={audience}
                    className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                  >
                    {audience}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="leading-7 text-muted-foreground">
                FusionPro aims to become one of Kenya&apos;s most trusted names
                in property repairs and maintenance — known for dependable
                service, consistent quality, and doing the job right the
                first time.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">

          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Our Core Values
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              The principles behind our service.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coreValues.map((value) => {
              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="rounded-2xl bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    {value.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Why Choose FusionPro */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">

          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Why Choose FusionPro?
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Focused expertise. Dependable service.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
              When repairs and maintenance matter, FusionPro brings focused
              expertise and dependable service.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {whyChooseUs.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl bg-card p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* FusionPro Keeps Properties Working */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">

          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Our Commitment
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                FusionPro Keeps Properties Working
              </h2>

              <p className="mt-5 leading-7 text-muted-foreground">
                We handle routine upkeep and urgent repairs to keep properties
                safe, functional, and in good condition.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {propertySolutions.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl bg-card p-6 shadow-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>

                    <h3 className="mt-5 font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">

          <div className="rounded-3xl bg-primary px-8 py-12 text-center md:px-16 md:py-16">

            <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
              Ready to get started?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-primary-foreground/80">
              Contact FusionPro Limited for reliable repairs and
              professional maintenance services.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">

              <a
                href="tel:+254106910483"
                className="inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Wrench className="h-4 w-4" />
                Call Us Now
              </a>

              <a
                href="mailto:info@fusionproltd.com"
                className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-foreground/10"
              >
                Email Us
              </a>

            </div>

            <p className="mt-6 text-sm text-primary-foreground/70">
              fusionproltd.com
            </p>

          </div>

        </div>
      </section>
      <Footer />
      <WhatsAppButton />
    </main>
  );
}

