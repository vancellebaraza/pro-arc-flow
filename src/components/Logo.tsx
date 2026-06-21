export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  const assetUrl = "/fusionpro-logo.svg";
  return <img src={assetUrl} alt="FusionPro" className={className} />;
}
