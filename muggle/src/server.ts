import fs from "fs-extra";
import sirv from "sirv";
import polka from "polka";
import glob from "fast-glob";
import { fileURLToPath, pathToFileURL } from "url";
import { resolve, dirname } from "path";
import prefresh from "@prefresh/vite";
import { createServer as createViteServer, build } from "vite";
import watchAPI from "./api-watcher.js";

function getAbsPath(relative: string) {
  return resolve(dirname(fileURLToPath(import.meta.url)), relative);
}

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

  fs.ensureDirSync("dist/.tmp");

  fs.writeFileSync(
    "dist/.tmp/entry-client.js",
    `import { renderToDOM } from "muggle-client";
const items = import.meta.glob("../../pages/**/*.tsx");
renderToDOM(items);`
  );

  fs.writeFileSync(
    "dist/.tmp/entry-server.js",
    `import { renderToHtml } from "muggle/entry-server";
const items = import.meta.glob("../../pages/**/*.tsx");
export default (url) =>  renderToHtml(url, items);`
  );

  build({
    configFile: false,
    root: "",
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Fragment",
      jsxInject: `import { h, Fragment } from 'preact'`,
    },
    build: {
      ssr: true,
      emptyOutDir: false,
      outDir: "./dist/.tmp/server/",
      rollupOptions: {
        input: "dist/.tmp/entry-server.js",
        output: {
          format: "esm",
          esModule: true,
        },
      },
    },
  });

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
      let template = "";
      if (!prerender) {
        const templatePath = getAbsPath("../template.html");
        template = fs.readFileSync(templatePath, "utf-8");
      } else {
        template = fs.readFileSync("dist/.tmp/index.html", "utf-8");
        template = await vite.transformIndexHtml(url, template);
      }

      const entryServerScript = resolve("dist/.tmp/server/entry-server.js");
      const renderToHtml = await import(
        pathToFileURL(resolve(entryServerScript)).toString()
      ).then((m) => m.default);
      if (!renderToHtml) {
        console.error("Failed to load entry-server");
        return;
      }
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
