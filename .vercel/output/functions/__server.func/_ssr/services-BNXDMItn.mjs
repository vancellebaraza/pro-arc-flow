import { Z as Zap, D as Droplets, p as Trees, q as Paintbrush, H as House, r as Container } from "../_libs/lucide-react.mjs";
const svcElectrical = "/assets/svc-electrical-BPkqxKCh.jpg";
const svcPlumbing = "/assets/svc-plumbing-D6zDUevo.jpg";
const svcLandscaping = "/assets/svc-landscaping-DKTFYCh9.jpg";
const svcPainting = "/assets/svc-painting-BcMm3r1e.jpg";
const svcProperty = "/assets/svc-property-BZaGF_kX.jpg";
const svcTank = "/assets/svc-tank-CBi8HqE2.jpg";
const SERVICES = [
  {
    key: "electrical",
    label: "Electrical",
    icon: Zap,
    desc: "Wiring, lighting, faults, certified installations.",
    image: svcElectrical
  },
  {
    key: "plumbing",
    label: "Plumbing",
    icon: Droplets,
    desc: "Leaks, fittings, pressure issues, full installs.",
    image: svcPlumbing
  },
  {
    key: "landscaping",
    label: "Landscaping",
    icon: Trees,
    desc: "Gardens, irrigation, hardscaping, upkeep.",
    image: svcLandscaping
  },
  {
    key: "painting",
    label: "Painting",
    icon: Paintbrush,
    desc: "Interior & exterior, surface prep, finishing.",
    image: svcPainting
  },
  {
    key: "property_management",
    label: "Property Management",
    icon: House,
    desc: "Ongoing facility care across portfolios.",
    image: svcProperty
  },
  {
    key: "tank_cleaning",
    label: "Tank Cleaning",
    icon: Container,
    desc: "Potable water tanks, disinfection, reports.",
    image: svcTank
  }
];
const STATUS_LABEL = {
  requested: "Requested",
  inspected: "Inspected",
  quoted: "Quoted",
  approved: "Approved",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected"
};
const BANK_DETAILS = {
  bank: "KCB",
  account_name: "Fusionpro Limited",
  branch: "KCB Gigiri Square Branch",
  bank_code: "323",
  account_number: "1351118463",
  swift_code: "KCBLKENX"
};
export {
  BANK_DETAILS as B,
  SERVICES as S,
  STATUS_LABEL as a
};
