// Studio (Next.js, desplegado aparte en Vercel con basePath "/studio").
// jaikuaa.com lo sirve Lovable, no Vercel: por eso el desvío se hace acá, en una ruta de servidor,
// y no con un vercel.json (que este hosting no lee).
const STUDIO_ORIGIN = "https://jaikuua-studio-app.vercel.app";
const MOUNT = "/studio";
const HOP_HEADERS = ["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "host"];

function isMounted(pathname: string): boolean {
  return pathname === MOUNT || pathname.startsWith(`${MOUNT}/`);
}

/** Solo /studio y /studio/* llegan al origen fijo. La ruta se envía completa: Studio usa basePath "/studio". */
export function studioTarget(input: string): URL | null {
  const url = new URL(input);
  if (!isMounted(url.pathname)) return null;
  const target = new URL(STUDIO_ORIGIN);
  // Colapsa barras repetidas para que nunca se pueda apuntar a otro host.
  target.pathname = url.pathname.replace(/\/{2,}/g, "/");
  target.search = url.search;
  return target;
}

/** IP real del visitante, para que la seguridad de Studio no vea a todos como el servidor de Jaikuaa. */
function clientIp(headers: Headers): string | null {
  const direct = headers.get("cf-connecting-ip") || headers.get("x-real-ip");
  if (direct) return direct.trim();
  const forwarded = headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : null;
}

export async function proxyStudio(request: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const target = studioTarget(request.url);
  if (!target) return new Response(null, { status: 404 });
  const headers = new Headers(request.headers);
  const ip = clientIp(request.headers);
  for (const key of HOP_HEADERS) headers.delete(key);
  headers.delete("content-length");
  // Vercel conserva su propia frontera de confianza: no se inventa ningún certificado de administrador.
  for (const key of [...headers.keys()]) {
    if (key.startsWith("x-forwarded-") || key.startsWith("cf-") || key === "forwarded" || key === "x-real-ip") headers.delete(key);
  }
  if (ip) headers.set("x-forwarded-for", ip);
  headers.set("x-forwarded-host", new URL(request.url).host);
  headers.set("x-forwarded-proto", "https");
  try {
    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers,
      redirect: "manual",
      signal: request.signal,
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
      init.duplex = "half";
    }
    const upstream = await fetcher(target, init);
    const outgoing = new Headers(upstream.headers);
    for (const key of HOP_HEADERS) outgoing.delete(key);
    // fetch puede descomprimir el cuerpo: nunca dejar longitudes ni codificaciones viejas.
    outgoing.delete("content-length");
    outgoing.delete("content-encoding");
    const location = outgoing.get("location");
    if (location) {
      const redirect = new URL(location, target);
      if (redirect.origin === STUDIO_ORIGIN) {
        // Studio ya responde con rutas bajo /studio: se conserva la ruta y se quita el host de Vercel.
        const path = isMounted(redirect.pathname) ? redirect.pathname : `${MOUNT}${redirect.pathname === "/" ? "" : redirect.pathname}`;
        outgoing.set("location", `${path}${redirect.search}${redirect.hash}`);
      }
    }
    // Cookies de Studio: solo para este sitio y siempre dentro de /studio, sin aflojar Secure/HttpOnly/SameSite.
    const cookies = outgoing.getSetCookie();
    if (cookies.length) {
      outgoing.delete("set-cookie");
      for (const cookie of cookies) {
        const noDomain = cookie.replace(/;\s*Domain=[^;]*/gi, "");
        const scoped = noDomain.replace(/;\s*Path=([^;]*)/gi, (_match, raw: string) => {
          const path = raw.trim() || "/";
          return `; Path=${isMounted(path) ? path : `${MOUNT}${path === "/" ? "" : path}`}`;
        });
        outgoing.append("set-cookie", /;\s*Path=/i.test(scoped) ? scoped : `${scoped}; Path=${MOUNT}`);
      }
    }
    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outgoing,
    });
  } catch {
    return new Response("Studio no está disponible en este momento.", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }
}

export const studioHandlers = Object.fromEntries(
  ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].map((method) => [method, ({ request }: { request: Request }) => proxyStudio(request)]),
);
