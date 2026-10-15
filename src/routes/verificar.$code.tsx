import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, XCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { verifyCertificate } from "@/lib/certificates.functions";

export const Route = createFileRoute("/verificar/$code")({
  loader: ({ params }) => verifyCertificate({ data: { code: params.code } }),
  head: ({ params }) => ({
    meta: [
      { title: `Verificación de certificado ${params.code} | Jaikuaa` },
      { name: "description", content: "Verificá la autenticidad de un certificado del Curso de Guaraní de Jaikuaa." },
      { property: "og:title", content: "Verificación de certificado Jaikuaa" },
      { property: "og:description", content: "Constancia pública de autenticidad de certificados Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const cert = Route.useLoaderData();
  const { code } = Route.useParams();
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <Link to="/" className="font-display text-xl font-bold text-primary"><BrandLogo /></Link>
      <div className="mt-8 w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-elegant">
        {cert ? (
          <>
            <BadgeCheck className="mx-auto h-14 w-14 text-primary" aria-hidden />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Certificado auténtico</h1>
            <p className="mt-4 text-muted-foreground">Jaikuaa certifica que</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{cert.full_name}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              completó las {cert.lessons} lecciones del Curso de Guaraní el{" "}
              {new Date(cert.issued_at).toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Asuncion" })}.
            </p>
            <p className="mt-5 rounded-full bg-muted px-4 py-1 font-mono text-sm text-foreground">{cert.code}</p>
            <p className="mt-5 text-xs text-muted-foreground">Emitido por la Plataforma Jaikuaa. Certificado de curso en línea; no constituye un título oficial.</p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-14 w-14 text-destructive" aria-hidden />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Código no encontrado</h1>
            <p className="mt-3 text-sm text-muted-foreground">No existe ningún certificado Jaikuaa con el código <span className="font-mono">{code}</span>.</p>
          </>
        )}
      </div>
    </div>
  );
}
