export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  const assetUrl = "/fusion_logo_page1.png";
  return <img src={assetUrl} alt="FusionPro" className={className} />;
}
