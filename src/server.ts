import fs from "fs";
import sirv from "sirv";
import polka from "polka";
import glob from "fast-glob";
import { resolve } from "path";
import prefresh from "@prefresh/vite";
import { createServer as createViteServer } from "vite";
import watchAPI from "./api-watcher";

async function createServer(prerender = false) {
  const app = polka();

  // static files
  app.use(sirv("./site/public"));

  // site api
  const files = await glob("./site/routes/**/api.ts");
  watchAPI(files);
  for (const path of files) {
    let route =
      "/api" +
      path
        .replace("./site/routes", "")
        .replace("api.ts", "index.json")
        .replace(/\\/g, "/");
    const matches = route.match(/\[(\w+)\]/g);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        const slug = match.substring(1, match.length - 1);
        route = route.replace(match, `:${slug}`);
      }
    }

    const script = resolve("./site/dist/.tmp", path.replace(".ts", ".js"));
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
        const file = `site/dist${url}`;
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

  const vite = await createViteServer({
    configFile: false,
    root: resolve(__dirname, "../site"),
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
  });
  app.use(vite.middlewares);

  app.get("/*", async (req, res) => {
    const url = req.originalUrl;
    try {
      let template = prerender
        ? fs.readFileSync("./site/dist/server/template.html", "utf-8")
        : fs.readFileSync("site/index.html", "utf-8");
      template = template.replace(
        "<!-- @APP@ -->",
        `<!-- @APP@ --><script type="module" src="/dist/.tmp/entry-client.tsx"></script>`
      );
      if (!prerender) {
        template = await vite.transformIndexHtml(url, template);
      }

      const { renderToHtml } = prerender
        ? require(resolve(process.cwd(), "./site/dist/server/entry-server.js"))
        : await vite.ssrLoadModule("./site/dist/.tmp/entry-server.tsx");

      const [data, head, app] = await renderToHtml(url);

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
        const dir = `site/dist${url}`;
        const exists = fs.existsSync(dir);
        if (!exists) {
          fs.mkdirSync(dir);
        }
        const file = `${dir}index.html`;
        fs.writeFileSync(file, html);
      }
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.error(e);
      res.statusCode = 500;
      res.end(e.message);
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
