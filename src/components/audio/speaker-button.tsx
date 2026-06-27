import { Volume2 } from "lucide-react";
import { playGuarani } from "@/lib/audio";
import { cn } from "@/lib/utils";

type Props = {
  gn: string;
  size?: "sm" | "md";
  className?: string;
};

export function SpeakerButton({ gn, size = "sm", className }: Props) {
  const dims =
    size === "md" ? "h-9 w-9" : "h-8 w-8";
  const icon = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <button
      type="button"
      onClick={() => {
        void playGuarani(gn);
      }}
      aria-label={`Escuchar ${gn}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 active:scale-95",
        dims,
        className,
      )}
    >
      <Volume2 className={icon} />
    </button>
  );
}
