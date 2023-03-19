import path from "node:path";
import FindMyWay from "find-my-way";
import { PageModule } from "./render.js";

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

export function createRouter(pages: Record<string, PageModule>) {
  const router = FindMyWay({
    ignoreTrailingSlash: true,
  });

  Object.entries(pages).forEach(([filepath, page]) => {
    const route = transformPathToRoute(filepath);
    const customExt = path.extname(route);

    // TODO: type ctx
    router.get(route, (_req, _res, _params, ctx) => {
      if (ctx) {
        ctx.customExt = customExt;
        ctx.page = page;
      }
    });
  });

  return router;
}
