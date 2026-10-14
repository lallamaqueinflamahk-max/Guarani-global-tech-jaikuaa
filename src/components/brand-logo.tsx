import logoAsset from "@/assets/aranduka-logo.png.asset.json";

type BrandLogoProps = {
  className?: string;
  size?: number;
  withWordmark?: boolean;
};

export function BrandLogo({ className = "", size = 36, withWordmark = true }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold text-primary ${className}`}>
      <img
        src={logoAsset.url}
        alt="Jaikuaa"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        // En modo oscuro el jaguar (azul marino) se pierde sobre el fondo: le damos una base clara.
        className="object-contain dark:rounded-lg dark:bg-white dark:p-0.5"
        draggable={false}
      />
      {withWordmark && <span className="text-xl tracking-tight">Jaikuaa</span>}
    </span>
  );
}
