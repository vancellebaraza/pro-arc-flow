
import { Logo } from "@/components/Logo";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Footer Cards */}
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4">

          {/* Company Card */}
          <div className="flex h-full flex-col rounded-2xl bg-card/70 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-lg">
            <Logo className="h-20 w-auto object-contain object-left" />

            <p className="mt-6 text-sm leading-6 text-muted-foreground">
              FusionPro streamlines property operations for 
              clients, engineers, and administrators .We manage every
              service request from inspection to completion.
            </p>
          </div>

          {/* Contact Card */}



{/* Contact CTA Card */}
<div className="flex h-full flex-col rounded-2xl bg-card/70 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-lg">
  <div>
    <h3 className="text-lg font-semibold text-foreground">
      Our contact info
    </h3>

    {/* <p className="mt-3 text-sm leading-6 text-muted-foreground">
      Get in touch with us through the following contact information
    </p> */}
  </div>

  <div className="mt-7 space-y-3">

    {/* Phone 1 */}
    <a
      href="tel:+254106910483"
      className="flex w-full items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md"
    >
      <Phone className="h-4 w-4 shrink-0" />

      <span>+254 106 910 483</span>
    </a>

    {/* Phone 2 */}
    <a
      href="tel:+254100298453"
      className="flex w-full items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/20 hover:shadow-sm"
    >
      <Phone className="h-4 w-4 shrink-0 text-primary" />

      <span>+254 100 298 453</span>
    </a>

    {/* Email */}
    <a
      href="mailto:info@fusionproltd.com"
      className="flex w-full items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/20 hover:shadow-sm"
    >
      <Mail className="h-4 w-4 shrink-0 text-primary" />

      <span className="break-all">
        info@fusionproltd.com
      </span>
    </a>

  </div>
</div>





          {/* Navigation Card */}
          <div className="flex h-full flex-col rounded-2xl bg-card/70 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Quick Links
            </h3>

            <nav className="mt-6 flex flex-col gap-4 text-sm">

              <a
                href="#services"
                className="text-muted-foreground transition duration-200 hover:translate-x-1 hover:text-foreground"
              >
                Services
              </a>

              <Link to="/about" className="text-muted-foreground transition duration-200 hover:translate-x-1 hover:text-foreground" > About </Link>

              <Link
                to="/auth"
                className="text-muted-foreground transition duration-200 hover:translate-x-1 hover:text-foreground"
              >
                Sign In
              </Link>

            </nav>
          </div>

          {/* Social Card */}
          <div className="flex h-full flex-col rounded-2xl bg-card/70 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Connect With Us
            </h3>

            <p className="mt-6 text-sm leading-6 text-muted-foreground">
              Follow Fusion Pro Limited for updates and property management
              news.
            </p>

            <div className="mt-6 flex gap-3">
              {[
                { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61593030472174" },
                { icon: Instagram, href: "https://www.instagram.com/fusionproltd?igsh=OW9kbDBxN2V6NDRs" },
                { icon: Linkedin, href: "#" },
              ].map(({ icon: Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg border border-border bg-card p-2 transition hover:bg-accent"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-sm text-muted-foreground md:flex-row">

          <p className="text-center md:text-left">
            © {new Date().getFullYear()} Fusion Pro Limited. All rights reserved.
          </p>
          {/* Website Credit */} <p className="text-center"> Website created by{" "} <a href="#" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground transition hover:text-primary" > Vancelle Baraza  </a> </p>

          <div className="flex gap-6">
            <a
              href="#"
              className="transition hover:text-foreground"
            >
              Privacy Policy
            </a>

            <a
              href="#"
              className="transition hover:text-foreground"
            >
              Terms of Service
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
}

