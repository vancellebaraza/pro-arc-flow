import { Zap, Droplets, Trees, Paintbrush, Home, Container } from "lucide-react";

export type ServiceKey =
  | "electrical"
  | "plumbing"
  | "landscaping"
  | "painting"
  | "property_management"
  | "tank_cleaning";

export const SERVICES: Array<{
  key: ServiceKey;
  label: string;
  icon: typeof Zap;
  desc: string;
  image: string;
}> = [
  {
    key: "electrical",
    label: "Electrical",
    icon: Zap,
    desc: "Wiring, lighting, faults, certified installations.",
    image: "/images/svc-electrical-2.png",
  },
  {
    key: "plumbing",
    label: "Plumbing",
    icon: Droplets,
    desc: "Leaks, fittings, pressure issues, full installs.",
    image: "/images/svc-plumbing-2.png",
  },
  {
    key: "landscaping",
    label: "Landscaping",
    icon: Trees,
    desc: "Gardens, irrigation, hardscaping, upkeep.",
    image: "/images/svc-landscaping-2.png",
  },
  {
    key: "painting",
    label: "Painting",
    icon: Paintbrush,
    desc: "Interior & exterior, surface prep, finishing.",
    image: "/images/svc-painting-2.png",
  },
  {
    key: "property_management",
    label: "Property Management",
    icon: Home,
    desc: "Ongoing facility care across portfolios.",
    image: "/images/svc-property-2.png",
  },
  {
    key: "tank_cleaning",
    label: "Tank Cleaning",
    icon: Container,
    desc: "Potable water tanks, disinfection, reports.",
    image: "/images/svc-tank-2.png",
  },
];

export const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  inspected: "Inspected",
  quoted: "Quoted",
  approved: "Approved",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
};

export type StatusColorGroup = "pending" | "rejected" | "ongoing" | "completed";

export const STATUS_COLOR_GROUP: Record<string, StatusColorGroup> = {
  requested: "pending",
  inspected: "pending",
  quoted: "pending",
  approved: "ongoing",
  scheduled: "ongoing",
  in_progress: "ongoing",
  completed: "completed",
  rejected: "rejected",
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
