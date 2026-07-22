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
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Company */}
          <div>
            <Logo className="h-10 w-auto" />

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              FusionPro streamlines property operations for RealArc Estates,
              helping clients, engineers, and administrators manage every
              service request from inspection to completion.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground">Contact</h3>

            <div className="mt-5 space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <span>Nairobi, Kenya</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span>+254 700 123 456</span>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span>info@realarc.co.ke</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-foreground">Quick Links</h3>

            <nav className="mt-5 flex flex-col gap-3 text-sm">
              <a
                href="#services"
                className="text-muted-foreground transition hover:text-foreground"
              >
                Services
              </a>

              <a
                href="#about"
                className="text-muted-foreground transition hover:text-foreground"
              >
                About
              </a>

              <Link
                to="/auth"
                className="text-muted-foreground transition hover:text-foreground"
              >
                Sign In
              </Link>
            </nav>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-foreground">
              Connect With Us
            </h3>

            <p className="mt-5 text-sm text-muted-foreground">
              Follow RealArc Estates for updates and property management news.
            </p>

            <div className="mt-6 flex gap-3">
              {[
                { icon: Facebook, href: "#" },
                { icon: Instagram, href: "#" },
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

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-sm text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} RealArc Estates. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a href="#" className="transition hover:text-foreground">
              Privacy Policy
            </a>

            <a href="#" className="transition hover:text-foreground">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}