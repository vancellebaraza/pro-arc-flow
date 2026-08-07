import { Zap, Droplets, Trees, Paintbrush, Camera,  HardHat, Shield,Sun, Hammer,Warehouse } from "lucide-react";

export type ServiceKey =
  | "electrical"
  | "plumbing"
  | "landscaping"
  | "painting"
  | "cctv"
  | "solar"
  | "civil"
  | "electric_fence"
  | "renovation"
  | "tank_cleaning";

export const SERVICES: Array<{
  key: ServiceKey;
  label: string;
  icon: typeof Zap;
  desc: string;
  image: string;
}> = [  {
    key: "painting",
    label: "Painting",
    icon: Paintbrush,
    desc: "Interior and exterior painting, surface preparation,wall repairs,waterproofing,repainting and application of decorative and protective coatings.",
    image: "/images/svc-painting-2.png",
  },
    {
    key: "electric_fence",
    label: "Electric Fence Installation",
    icon: Shield,
    desc: " Installation, maintenance, repair, and servicing of electric fencing systems, including energizers, HT cables, insulators, earth systems, and fence accessories.",
    image: "/electric.jpeg",
  },
    {
    key: "cctv",
    label: "CCTV",
    icon: Camera,
    desc: "Installation, configuration, maintenance, repair, and upgrading of CCTV surveillance systems, cameras, NVRs, DVRs, monitors, and networking infrastructure.",
    image: "/cctv.jpeg",
  },
    {
    key: "civil",
    label: "Civil Works",
    icon: HardHat,
    desc: "Construction, repair, and maintenance of masonry, concrete works, paving, drainage, walls, floors, manholes, structural repairs, and other building-related works.",
    image: "/civil.jpeg",
  },
  {
    key: "renovation",
    label: "Renovation",
    icon: Hammer,
    desc: "Building improvement and refurbishment works, including repairs, tiling, ceilings, partitions, doors, windows, flooring, fittings, and general property upgrades.",
    image: "/renovations.jpeg",
  },
    {
    key: "tank_cleaning",
    label: "Tank Cleaning",
    icon: Warehouse,
    desc: "Professional  cleaning and disinfection of water storage tanks, including removal of sludge,sediments,algae and other contaminants to maintain clean and safe water storage.",
    image: "/images/svc-tank-2.png",
  },
    {
    key: "plumbing",
    label: "Plumbing",
    icon: Droplets,
    desc: "Installation,repair and maintenance of water supply,drainage,sewage systems,sanitary fittings,pumps, and related plumbing works.",
    image: "/plumbing.jpeg",
  },
  {
    key: "solar",
    label: "Solar Installation",
    icon: Sun,
    desc: " Supply, installation, maintenance, and repair of solar power systems, including solar panels, batteries, inverters, solar lighting, and solar water pumping systems.",
    image: "/solar.jpeg",
  },
  {
    key: "electrical",
    label: "Electrical",
    icon: Zap,
    desc: "Installation,maintenance,repair and troubleshooting of electrical systems,lighting,power supply,distribution boards and related equipment",
    image: "/images/svc-electrical-2.png",
  },
  {
    key: "landscaping",
    label: "Landscaping",
    icon: Trees,
    desc: "Design, installation, and maintenance of lawns,gardens,trees,plants,irrigation systems,and other outdoor spaces.",
    image: "/landscaping.jpeg",
  },



];

export const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  inspected: "Scope of Work",
  quoted: "Quoted",
  approved: "Approved",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
};

export type StatusColorGroup = "pending" | "rejected" | "ongoing" | "completed" | "scope";

export const STATUS_COLOR_GROUP: Record<string, StatusColorGroup> = {
  requested: "pending",
  inspected: "scope",
  quoted: "pending",
  approved: "ongoing",
  scheduled: "ongoing",
  in_progress: "ongoing",
  completed: "completed",
  rejected: "rejected",
  scope: "scope",
};

export const STATUS_COLOR_CLASSES: Record<StatusColorGroup, { dot: string; badge: string }> = {
  pending: {
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-700 border border-red-200",
  },
  rejected: {
    dot: "bg-orange-500",
    badge: "bg-orange-500/10 text-orange-700 border border-orange-200",
  },
  ongoing: {
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-700 border border-blue-200",
  },
  completed: {
    dot: "bg-green-500",
    badge: "bg-green-500/10 text-green-700 border border-green-200",
  },
  scope: {
    dot: "bg-green-500",
    badge: "bg-green-500/10 text-green-700 border border-green-200",
  },
};

export function statusColorGroup(status: string): StatusColorGroup {
  return STATUS_COLOR_GROUP[status] ?? "pending";
}

export function statusColorClasses(status: string) {
  return STATUS_COLOR_CLASSES[statusColorGroup(status)];
}

export const BANK_DETAILS = {
  bank: "KCB",
  account_name: "Fusionpro Limited",
  branch: "KCB Gigiri Square Branch",
  bank_code: "323",
  account_number: "1351118463",
  swift_code: "KCBLKENX",
};
