const STUDIO_ORIGIN = "https://jaikuaa-studio.vercel.app";
const HOP_HEADERS = ["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "host"];

/** Only the two approved mount paths can reach the fixed upstream. */
export function studioTarget(input: string): URL | null {
  const url = new URL(input);
  if (url.pathname !== "/studio" && !url.pathname.startsWith("/studio/")) return null;
  const target = new URL(STUDIO_ORIGIN);
  target.pathname = url.pathname.slice("/studio".length) || "/";
  target.search = url.search;
  return target;
}

export async function proxyStudio(request: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const target = studioTarget(request.url);
  if (!target) return new Response(null, { status: 404 });
  const headers = new Headers(request.headers);
  for (const key of HOP_HEADERS) headers.delete(key);
  headers.delete("content-length");
  // Let Vercel retain its own trust boundary; do not forge an admin certificate.
  for (const key of [...headers.keys()]) {
    if (key.startsWith("x-forwarded-") || key.startsWith("cf-") || key === "forwarded") headers.delete(key);
  }
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
    // Fetch may decode the body; never retain stale transport lengths/encoding.
    outgoing.delete("content-length");
    outgoing.delete("content-encoding");
    const location = outgoing.get("location");
    if (location) {
      const redirect = new URL(location, target);
      if (redirect.origin === STUDIO_ORIGIN) {
        outgoing.set("location", `/studio${redirect.pathname}${redirect.search}${redirect.hash}`);
      }
    }
    // Scope Studio cookies to this mount, without relaxing Secure/HttpOnly/SameSite.
    const cookies = outgoing.getSetCookie();
    if (cookies.length) {
      outgoing.delete("set-cookie");
      for (const cookie of cookies) {
        const scoped = cookie.replace(/;\s*Domain=[^;]*/gi, "").replace(/;\s*Path=([^;]*)/gi, (_match, path: string) => `; Path=/studio${path === "/" ? "" : path}`);
        outgoing.append("set-cookie", /;\s*Path=/i.test(scoped) ? scoped : `${scoped}; Path=/studio`);
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