import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkCorpusAdmin } from "@/lib/corpus.functions";

/** Acceso al panel del corpus. Visible para administradores y docentes validadores. */
export function AdminCorpusLink() {
  const check = useServerFn(checkCorpusAdmin);
  const { data } = useQuery({
    queryKey: ["corpus-admin"],
    queryFn: () => check(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!data?.canAccess) return null;

  return (
    <Button asChild variant="outline" size="sm" aria-label="Panel de validación">
      <Link to="/admin/corpus">
        <Database className="h-4 w-4" />
        <span className="hidden sm:inline">Panel de validación</span>
      </Link>
    </Button>
  );
}
