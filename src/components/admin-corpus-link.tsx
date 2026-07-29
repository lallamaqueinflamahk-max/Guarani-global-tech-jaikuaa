import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkCorpusAdmin } from "@/lib/corpus.functions";

/** Acceso al panel del corpus. Solo se renderiza para administradores. */
export function AdminCorpusLink() {
  const check = useServerFn(checkCorpusAdmin);
  const { data } = useQuery({
    queryKey: ["corpus-admin"],
    queryFn: () => check(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!data?.isAdmin) return null;

  return (
    <Button asChild variant="outline" size="sm">
      <Link to="/admin/corpus">
        <Database className="mr-2 h-4 w-4" />
        Corpus
      </Link>
    </Button>
  );
}
