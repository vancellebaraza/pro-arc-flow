export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  // Try to use Lovable asset URL first, fall back to local SVG in dev environments
  const assetUrl = "/__l5e/assets-v1/bc16154a-5d57-4f8a-9cfa-362b46a0b857/fusionpro-logo.jpg";
  const fallbackUrl = "/fusionpro-logo.svg";
  
  return (
    <img 
      src={assetUrl} 
      alt="FusionPro" 
      className={className}
      onError={(e) => {
        // If Lovable asset fails to load, use the local fallback
        (e.target as HTMLImageElement).src = fallbackUrl;
      }}
    />
  );
}
