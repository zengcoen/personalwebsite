const CANONICAL_ORIGIN = "https://coenzeng.com";
const WWW_HOST = "www.coenzeng.com";
const CANONICAL_HOST = "coenzeng.com";

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

function visitorUsedPlainHttp(request: Request): boolean {
  return request.headers.get("cf-visitor")?.includes('"scheme":"http"') ?? false;
}

function canonicalUrl(url: URL): string {
  return new URL(`${url.pathname}${url.search}`, CANONICAL_ORIGIN).toString();
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === WWW_HOST) {
      return Response.redirect(canonicalUrl(url), 301);
    }

    if (url.hostname === CANONICAL_HOST && visitorUsedPlainHttp(request)) {
      return Response.redirect(canonicalUrl(url), 301);
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
