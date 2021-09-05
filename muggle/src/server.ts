import fs from "fs-extra";
import sirv from "sirv";
import polka from "polka";
import glob from "fast-glob";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import prefresh from "@prefresh/vite";
import { createServer as createViteServer } from "vite";
import fetch from "isomorphic-unfetch";
import watchAPI from "./api-watcher.js";
import { renderToHtml } from "./entry-server.js";

async function createServer(prerender = false) {
  const app = polka();

  // static files
  if (fs.existsSync("public")) {
    app.use(sirv("public"));
  }
  // site api
  const apiFiles = await glob("api/**/*.ts");
  watchAPI(apiFiles, "dist/.tmp/api");
  for (const path of apiFiles) {
    let route =
      "/" + path.replace("index.ts", "index.json").replace(/\\/g, "/");
    const matches = route.match(/\[(\w+)\]/g);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        const slug = match.substring(1, match.length - 1);
        route = route.replace(match, `:${slug}`);
      }
    }

    const script = resolve("dist/.tmp", path.replace(".ts", ".js"));
    app.get(route, async (req, res) => {
      const originEnd = res.end.bind(res);
      let saved = "";
      res.end = (data: any) => {
        if (prerender) {
          saved = data;
        }
        originEnd(data);
      };
      const handler = await import(script).then((m) => m.get);
      await handler(req, res);

      if (prerender) {
        const url = req.originalUrl;
        const file = `dist${url}`;
        const dir = file.replace("index.json", "");
        const exists = fs.existsSync(dir);
        if (!exists) {
          fs.mkdirSync(dir);
        }
        fs.writeFileSync(file, saved);
      }
      res.end = originEnd;
    });
  }

  const pagesFiles = await glob("pages/**/*.tsx");
  watchAPI(pagesFiles, "dist/.tmp/");

  fs.writeFileSync(
    "dist/.tmp/entry-client.js",
    `import { renderToDOM } from "muggle-client";
const items = import.meta.glob("./pages/**/*.js");
renderToDOM(items);`
  );

  const vite = await createViteServer({
    configFile: false,
    root: process.cwd(),
    plugins: prerender ? [] : [prefresh()],
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Fragment",
      jsxInject: `import { h, Fragment } from 'preact'`,
    },
    build: {
      sourcemap: true,
      manifest: true,
    },
    server: {
      middlewareMode: true,
      hmr: !prerender,
      fs: {
        strict: true,
      },
    },
    ssr: {
      external: ["isomorphic-unfetch"],
    },
  } as any);
  app.use(vite.middlewares);

  app.get("/*", async (req, res) => {
    const url = req.originalUrl;
    try {
      const templatePath = resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../template.html"
      );
      let template = prerender
        ? fs.readFileSync("dist/.tmp/index.html", "utf-8")
        : fs.readFileSync(templatePath, "utf-8");
      if (!prerender) {
        template = await vite.transformIndexHtml(url, template);
      }

      const [data, head, app] = await renderToHtml(url, fetch);

      let html = template.replace(
        "<!-- @HEAD@ -->",
        head +
          `<script>window.__PRELOAD_DATA__ = ${JSON.stringify(
            data || {}
          )};</script>`.trim()
      );
      html = html.replace(`<!-- @APP@ -->`, app);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);

      if (prerender) {
        const dir = `dist${url}`;
        const exists = fs.existsSync(dir);
        if (!exists) {
          fs.mkdirSync(dir);
        }
        const file = `${dir}index.html`;
        fs.writeFileSync(file, html);
      }
    } catch (e: unknown) {
      vite.ssrFixStacktrace(e as Error);
      console.error(e);
      res.statusCode = 500;
      res.end((e as Error).message);
    }
  });

  return new Promise<typeof app>((resolve) => {
    app.listen(3000, () => {
      console.log("> Running on localhost:3000");
      resolve(app);
    });
  });
}

export default createServer;
