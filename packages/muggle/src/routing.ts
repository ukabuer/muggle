import { extname } from "node:path";
import FindMyWay from "find-my-way";
import { PageModule } from "./server.js";

export function transformPathToRoute(filepath: string): string {
  const ext = extname(filepath);
  let route = filepath.substring(0, filepath.length - ext.length);

  if (!route.endsWith("/")) {
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

export function createRouter(pages: Record<string, PageModule>) {
  const router = FindMyWay({
    ignoreTrailingSlash: true,
  });

  Object.entries(pages).forEach(([filepath, page]) => {
    const route = transformPathToRoute(filepath);

    router.get(route, (_req, _res, _params, ctx) => {
      if (ctx) {
        ctx.page = page;
      }
    });
  });

  return router;
}
