import { createFileRoute } from "@tanstack/react-router";
import AboutUs from "@/components/aboutus";

export const Route = createFileRoute("/about")({
  component: AboutUs,
});