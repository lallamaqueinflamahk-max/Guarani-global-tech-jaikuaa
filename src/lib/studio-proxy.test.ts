import { describe, expect, it } from "vitest";
import { proxyStudio, studioTarget } from "./studio-proxy";

describe("Studio proxy", () => {
  it("maps /studio to the exact approved Vercel root", () => {
    expect(studioTarget("https://www.jaikuaa.com/studio")?.href).toBe("https://jaikuaa-studio.vercel.app/");
  });
  it("maps descendants and preserves query parameters", () => {
    expect(studioTarget("https://www.jaikuaa.com/studio/api/analyze?mode=1")?.href).toBe("https://jaikuaa-studio.vercel.app/api/analyze?mode=1");
  });
  it("does not intercept other Jaikuaa pages or allow an alternate upstream", () => {
    expect(studioTarget("https://www.jaikuaa.com/studios")).toBeNull();
    expect(studioTarget("https://www.jaikuaa.com/curso/guarani")).toBeNull();
    expect(studioTarget("https://www.jaikuaa.com/studio//example.com/x")?.origin).toBe("https://jaikuaa-studio.vercel.app");
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
  it("keeps redirects and separate secure cookies under /studio", async () => {
    const headers = new Headers({ location: "/lab" });
    headers.append("set-cookie", "a=1; Path=/; HttpOnly; Secure; SameSite=Strict");
    headers.append("set-cookie", "b=2; Domain=jaikuaa-studio.vercel.app; Path=/api; Secure");
    const fetcher = (async () => new Response(null, { status: 307, headers })) as typeof fetch;
    const response = await proxyStudio(new Request("https://www.jaikuaa.com/studio"), fetcher);
    expect(response.headers.get("location")).toBe("/studio/lab");
    expect(response.headers.getSetCookie()).toEqual([
      "a=1; Path=/studio; HttpOnly; Secure; SameSite=Strict",
      "b=2; Path=/studio/api; Secure",
    ]);
  });
});