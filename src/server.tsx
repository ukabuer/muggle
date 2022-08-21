import { relative, resolve, parse, dirname } from "path";
import sirv from "sirv";
import polka from "polka";
import fs from "fs/promises";
import { getCSS } from "./Layout.js";
import { ComponentType } from "preact";
import { createServer } from "vite";
import * as url from "url";
import cssPlugin from "./vite-css.js";

const __dirname = url.fileURLToPath(new url.URL(".", import.meta.url));

export async function startServer(exportHTML?: boolean) {
  await fs.mkdir("dist", { recursive: true });
  await fs.copyFile(
    resolve(__dirname, "./entry-client.js"),
    "dist/entry-client.js"
  );

  const originHtml = `
  <!DOCTYPE html>
  <html lang="en">
    <head><!-- HEAD --></head>
    <body data-barba="wrapper">
      <main></main>
      <script type="module" src="/dist/entry-client.js"></script>
    </body>
  </html>
  `;

  const app = polka();

  if (await fs.stat("public")) {
    app.use(sirv("public"));
  }
  app.use(sirv("dist"));

  const vite = await createServer({
    clearScreen: false,
    logLevel: "info",
    server: { middlewareMode: true },
    resolve: {
      dedupe: ["preact"],
    },
    appType: "custom",
    plugins: [cssPlugin],
  });
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const template = await vite.transformIndexHtml(url, originHtml);
      const { render } = await vite.ssrLoadModule(
        resolve(__dirname, "./entry-server.js")
      );
      const rendered = (await render(url)) as null | string[];
      if (!rendered) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found.");
        return;
      }
      const [head, body] = rendered;
      const css = `<style>${getCSS()}</style>`;
      let html = template.replace("<!-- HEAD -->", head + css);
      html = html.replace("<main></main>", body);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);

      if (exportHTML) {
        const url = req.url;
        const target = `dist${url}`;
        const file = url.endsWith("/")
          ? `${target}index.html`
          : `${target}.html`;

        const dir = dirname(file);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(file, html);
        console.log("HTML exported:", req.url);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log(e);
        vite.ssrFixStacktrace(e);
        next(e);
      } else {
        next("Error");
      }
    }
  });

  const port = 5173;
  app.listen(port, () => {
    console.log("> Running on http://localhost:" + port.toString());
  });
}

export function createHTML(lang: string, head: string, body: string) {
  return `<!DOCTYPE html><html lang="${lang}"><head>${head}</head><body data-barba="wrapper">${body}</body></html>`;
}

export type PageModule = {
  default: ComponentType<{ page?: unknown }>;
  preload?: () => Promise<unknown>;
};

export function processPages(
  pages: Record<string, PageModule>
): Record<string, PageModule> {
  const routes: Record<string, PageModule> = {};
  Object.entries(pages).forEach(([path, page]) => {
    const info = parse(path);
    let route = path.substring(0, path.length - info.ext.length);
    route = relative("pages", route).replaceAll("\\", "/");
    route = `/${route}`;
    if (route.endsWith("index"))
      route = route.substring(0, route.length - "index".length);
    if (!route.endsWith("/")) route += "/";

    const matches = route.match(/\[(\w+)\]/g);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        const slug = match.substring(1, match.length - 1);
        route = route.replace(match, `:${slug}`);
      }
    }

    routes[route] = page;
  });
  return routes;
}
