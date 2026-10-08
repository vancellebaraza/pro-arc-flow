import { createFileRoute } from "@tanstack/react-router";
import GalleryShowcase from "@/components/GalleryShowcase";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery | FusionPro" },
      {
        name: "description",
        content: "Before and after photos from our recent FusionPro projects.",
      },
    ],
  }),
  component: GalleryShowcase,
});
