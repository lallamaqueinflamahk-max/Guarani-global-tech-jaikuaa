import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function NetworkStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online === null) return null;

  return (
    <div className="fixed bottom-24 right-3 z-40 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-1 md:bottom-4">
      <Badge variant={online ? "secondary" : "destructive"} role="status" aria-live="polite">
        {online ? "En línea" : "Sin conexión"}
      </Badge>
      {!online && (
        <p className="max-w-xs rounded-md border bg-background px-2 py-1 text-right text-xs text-foreground shadow-sm">
          Las propuestas y validaciones requieren conexión y no se guardan localmente.
        </p>
      )}
    </div>
  );
}