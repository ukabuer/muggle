import path from "node:path";
import { Hono } from "hono";
import type { PageModule } from "./render.js";

export function transformPathToRoute(filepath: string): string {
  const ext = path.extname(filepath);
  let route = filepath.substring(0, filepath.length - ext.length);

  const customExt = path.extname(route);
  if (!(customExt || route.endsWith("/"))) {
    route += "/";
  }

  const prefix = "/pages";
  if (route.startsWith(prefix)) {
    route = route.substring(prefix.length);
  }

  const postfix = "index/";
  if (route.endsWith(postfix)) {
    route = route.substring(0, route.length - postfix.length);
  }

  const paramsRegExp = new RegExp(/\[(\w+)]/g);
  return route.replace(paramsRegExp, (_, token) => `:${token}`);
}

export type MatchedRoute = {
  customExt: string;
  page: PageModule;
  params: Record<string, string>;
};

export function createRouter(pages: Record<string, PageModule>) {
  const app = new Hono<{ Bindings: { store: { matched?: MatchedRoute } } }>();

  Object.entries(pages).forEach(([filepath, page]) => {
    const route = transformPathToRoute(filepath);
    const customExt = path.extname(route);

    app.get(route, (c) => {
      c.env.store.matched = {
        customExt,
        page,
        params: c.req.param(),
      };
      return c.body(null);
    });
  });

  return {
    async match(url: string): Promise<MatchedRoute | null> {
      async function matchPath(path: string) {
        const store: { matched?: MatchedRoute } = {};
        const response = await app.request(path, {}, { store });
        return response.status === 404 ? null : (store.matched ?? null);
      }

      return (await matchPath(url)) ?? (await matchPath(`${url}/`));
    },
  };
}
