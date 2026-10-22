import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listUndoableValidations, undoValidation } from "@/lib/validation-circuit.functions";

function timeLeft(undoUntil: string, now: number): string {
  const seconds = Math.max(0, Math.ceil((new Date(undoUntil).getTime() - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ValidationUndoNotice() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listUndoableValidations);
  const undoFn = useServerFn(undoValidation);
  const [now, setNow] = useState(() => Date.now());
  const actionsQuery = useQuery({
    queryKey: ["validation-undo-actions"],
    queryFn: () => listFn(),
    refetchInterval: 15_000,
    retry: false,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const undo = useMutation({
    mutationFn: (id: string) => undoFn({ data: { id } }),
    onSuccess: async () => {
      toast.success("Publicación deshecha. La propuesta volvió a validación pendiente.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["validation-undo-actions"] }),
        queryClient.invalidateQueries({ queryKey: ["circuit-queue"] }),
        queryClient.invalidateQueries({ queryKey: ["my-proposals"] }),
        queryClient.invalidateQueries({ queryKey: ["corpus-words"] }),
        queryClient.invalidateQueries({ queryKey: ["corpus-overview"] }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo deshacer; la publicación no cambió.");
      void queryClient.invalidateQueries({ queryKey: ["validation-undo-actions"] });
    },
  });

  const actions = (actionsQuery.data?.actions ?? []).filter((action) => new Date(action.undoUntil).getTime() > now);
  if (actions.length === 0) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-3 z-[70] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-lg border border-amber-400/60 bg-background p-3 shadow-lg"
    >
      {actions.map((action) => (
        <div key={action.id} className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-sm text-foreground">
            <strong>{action.word}</strong> se publicó. Podés deshacer durante {timeLeft(action.undoUntil, now)}.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={undo.isPending}
            onClick={() => undo.mutate(action.id)}
          >
            <RotateCcw aria-hidden="true" />
            Deshacer
          </Button>
        </div>
      ))}
    </aside>
  );
}