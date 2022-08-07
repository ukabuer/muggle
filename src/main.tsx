import { Worker } from "worker_threads";
import { relative, resolve, parse, dirname } from "path";
import sirv from "sirv";
import polka from "polka";
import fs from "fs/promises";
import { ComponentType, h, Fragment, options, VNode } from "preact";
import renderToString from "preact-render-to-string";
import Layout, { PROPS, reset } from "./Layout";
import type Head from "./client/Head";

export async function startCompile() {
  const script = resolve(__dirname, "./compile");
  const compiler = new Worker(script);
  return new Promise((resolve, reject) => {
    compiler.addListener("message", () => {
      resolve(compiler);
    });
    compiler.addListener("error", (err) => {
      reject(err);
    });
  });
}

export function startExport() {
  const script = resolve(__dirname, "./export");
  const requestor = new Worker(script);
  requestor.addListener("error", (err) => {
    console.error(err.message);
  });
  return requestor;
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

async function renderPage(page: PageModule, Heads: typeof Head) {
  reset();
  let props: unknown | undefined;
  if (page.preload) {
    props = await page.preload();
  }
  const Content = page.default;

  const body = renderToString(
    <Layout>
      <Content page={props} />
    </Layout>
  );
  const head = Heads.rewind()
    .map((n: VNode) => renderToString(n))
    .join("");
  const html = createHTML("en", head, body);
  return html;
}

export async function startServer(exportHTML?: boolean) {
  if (exportHTML) {
    await fs.mkdir("dist", { recursive: true });
  }

  const app = polka();

  if (await fs.stat("public")) {
    app.use(sirv("public"));
  }

  const script = resolve("./dist/MUGGLE_APP.js");
  const [pages, islands, Heads] = await import(script).then(
    (m) =>
      [m.AllPages, m.AllComponents, m.Head] as [
        Record<string, PageModule>,
        ComponentType[],
        typeof Head
      ]
  );

  const routes = processPages(pages);
  console.log("routes", Object.keys(routes));

  Object.entries(routes).forEach(([route, page]) => {
    app.get(route, async (req, res) => {
      const html = await renderPage(page, Heads);
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
    });
  });

  const originalHook = options.vnode;
  let ignoreNext = false;
  options.vnode = (vnode) => {
    const OriginalType = vnode.type as ComponentType<unknown>;
    if (typeof vnode.type === "function") {
      const island = Object.entries(islands).find(
        ([, component]) => component === OriginalType
      );
      if (island) {
        if (ignoreNext) {
          ignoreNext = false;
          return;
        }
        vnode.type = (props) => {
          ignoreNext = true;
          PROPS.push(props);
          return (
            <>
              <script
                data-muggle-id={PROPS.length - 1}
                data-muggle-component={island[0]}
              />
              <OriginalType {...props} />
              <script data-muggle-end-id={PROPS.length - 1} />
            </>
          );
        };
      }
    }
    if (originalHook) originalHook(vnode);
  };

  app.listen(3000, () => {
    console.log("> Running on http://localhost:3000");
  });
}
