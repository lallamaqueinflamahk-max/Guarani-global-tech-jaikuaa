import { describe, expect, it } from "vitest";
import { proxyStudio, studioTarget } from "./studio-proxy";

const ORIGIN = "https://jaikuua-studio-app.vercel.app";

describe("Studio proxy", () => {
  it("forwards /studio with its prefix, because Studio uses basePath /studio", () => {
    expect(studioTarget("https://www.jaikuaa.com/studio")?.href).toBe(`${ORIGIN}/studio`);
  });
  it("forwards descendants and query parameters unchanged", () => {
    expect(studioTarget("https://www.jaikuaa.com/studio/api/analyze?mode=1")?.href).toBe(`${ORIGIN}/studio/api/analyze?mode=1`);
    expect(studioTarget("https://www.jaikuaa.com/studio/_next/static/chunk.js")?.href).toBe(`${ORIGIN}/studio/_next/static/chunk.js`);
  });
  it("does not intercept other Jaikuaa pages or allow an alternate upstream", () => {
    expect(studioTarget("https://www.jaikuaa.com/studios")).toBeNull();
    expect(studioTarget("https://www.jaikuaa.com/curso/guarani")).toBeNull();
    expect(studioTarget("https://www.jaikuaa.com/studio//example.com/x")?.origin).toBe(ORIGIN);
  });
  it("preserves Vercel security denials", async () => {
    const fetcher = (async () => new Response("denied", { status: 403 })) as typeof fetch;
    const response = await proxyStudio(new Request("https://www.jaikuaa.com/studio/admin"), fetcher);
    expect(response.status).toBe(403);
    expect(await response.text()).toBe("denied");
  });
  it("forwards POST bodies without changing them", async () => {
    let body = "";
    const fetcher = (async (input, init) => {
      body = await new Request(input, init).text();
      return Response.json({ ok: true });
    }) as typeof fetch;
    await proxyStudio(new Request("https://www.jaikuaa.com/studio/api/analyze", { method: "POST", body: '{"text":"test"}' }), fetcher);
    expect(body).toBe('{"text":"test"}');
  });
  it("passes the visitor IP and never the client's own forwarded headers", async () => {
    let seen = new Headers();
    const fetcher = (async (_input, init) => {
      seen = new Headers(init?.headers);
      return new Response("ok");
    }) as typeof fetch;
    await proxyStudio(
      new Request("https://www.jaikuaa.com/studio/lab", { headers: { "cf-connecting-ip": "200.1.2.3", "x-forwarded-host": "evil.example" } }),
      fetcher,
    );
    expect(seen.get("x-forwarded-for")).toBe("200.1.2.3");
    expect(seen.get("x-forwarded-host")).toBe("www.jaikuaa.com");
  });
  it("keeps redirects under /studio without doubling the prefix", async () => {
    const already = (async () => new Response(null, { status: 307, headers: { location: `${ORIGIN}/studio/lab` } })) as typeof fetch;
    expect((await proxyStudio(new Request("https://www.jaikuaa.com/studio"), already)).headers.get("location")).toBe("/studio/lab");
    const relative = (async () => new Response(null, { status: 307, headers: { location: "/studio/lab?x=1" } })) as typeof fetch;
    expect((await proxyStudio(new Request("https://www.jaikuaa.com/studio"), relative)).headers.get("location")).toBe("/studio/lab?x=1");
  });
  it("scopes cookies under /studio without doubling the prefix", async () => {
    const headers = new Headers();
    headers.append("set-cookie", "a=1; Path=/studio; HttpOnly; Secure; SameSite=Strict");
    headers.append("set-cookie", "b=2; Domain=jaikuua-studio-app.vercel.app; Path=/; Secure");
    headers.append("set-cookie", "c=3; Secure");
    const fetcher = (async () => new Response(null, { status: 200, headers })) as typeof fetch;
    const response = await proxyStudio(new Request("https://www.jaikuaa.com/studio"), fetcher);
    expect(response.headers.getSetCookie()).toEqual([
      "a=1; Path=/studio; HttpOnly; Secure; SameSite=Strict",
      "b=2; Path=/studio; Secure",
      "c=3; Secure; Path=/studio",
    ]);
  });
});
