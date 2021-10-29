import fs from "fs-extra";
import sirv from "sirv";
import polka from "polka";
import glob from "fast-glob";
import { pathToFileURL } from "url";
import { resolve, extname, dirname, join } from "path";
import prefresh from "@prefresh/vite";
import { createServer as createViteServer, build as viteBuild } from "vite";
import watchAPI from "./api-watcher.js";
import { store } from "./cli.js";

async function createServer(prerender = false) {
  const app = polka();

  // static files
  if (fs.existsSync("public")) {
    app.use(sirv("public"));
  }
  // site api
  const apiFiles = await glob("api/**/*.ts");
  watchAPI(apiFiles, store);
  for (const path of apiFiles) {
    let route = "/" + path.replace(/.ts$/, "");
    const matches = route.match(/\[(\w+)\]/g);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        const slug = match.substring(1, match.length - 1);
        route = route.replace(match, `:${slug}`);
      }
    }

    const script = resolve(store, path.replace(".ts", ".js"));
    app.get(route, async (req, res) => {
      let result = null;
      try {
        const lastModified = fs.statSync(script).mtimeMs;
        const importUrl = `${pathToFileURL(
          script
        )}?lastModified=${lastModified}`;
        const handler = await import(importUrl).then((m) => m.get);
        const data = await handler(req);
        if (data === null || data === undefined) {
          res.end("");
          return;
        }
        result = JSON.stringify(data);
        res.end(result);
      } catch (e: unknown) {
        console.error(
          "Failed to excute script `" + script + "`: " + (e as Error).message
        );
        res.end("404");
        return;
      }

      if (prerender) {
        const url = req.originalUrl;
        const file = `dist${url}`;
        const dir = file.replace("index.json", "");
        fs.ensureDirSync(dir);
        fs.writeFileSync(file, result);
      }
    });
  }

  await viteBuild({
    configFile: false,
    root: "",
    mode: prerender ? "production" : "development",
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Fragment",
      jsxInject: `import { h, Fragment } from 'preact'`,
    },
    build: {
      ssr: join(store, "entry-server-template.js"),
      watch: prerender
        ? null
        : {
            include: "./**/*",
            exclude: "./node_modules/**",
          },
      emptyOutDir: false,
      outDir: store,
      rollupOptions: {
        external: ["muggle", "muggle/server", "muggle/client", "muggle-client"],
        output: {
          format: "esm",
          entryFileNames: "entry-server.js",
        },
      },
    },
  });

  const vite = await createViteServer({
    configFile: false,
    root: store,
    mode: prerender ? "production" : "development",
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
        strict: false,
      },
    },
    ssr: {
      external: ["isomorphic-unfetch"],
    },
  } as any);
  app.use(vite.middlewares);

  let template = "";
  if (!prerender) {
    const target = resolve(store, "index.html");
    template = fs.readFileSync(target, "utf-8");
    template = await vite.transformIndexHtml("/", template);
  } else {
    template = fs.readFileSync(join(store, "index.html"), "utf-8");
  }

  const entryServerScript = resolve(store, "entry-server.js");
  app.get("/*", async (req, res) => {
    const url = req.originalUrl;

    const ext = extname(url);
    if (ext && ext !== ".html") {
      res.statusCode = 404;
      res.end("Not Found.");
      return;
    }

    try {
      const lastModified = fs.statSync(entryServerScript).mtimeMs;
      const importPath =
        pathToFileURL(resolve(entryServerScript)).toString() +
        `?timestep=${lastModified}`;
      const renderToHtml = await import(importPath).then((m) => m.default);
      if (!renderToHtml) {
        console.error("Failed to load entry-server");
        return;
      }
      const html = await renderToHtml(url, template);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);

      if (prerender) {
        const target = `dist${url}`;
        const file = url.endsWith("/")
          ? `${target}index.html`
          : `${target}.html`;

        const dir = dirname(file);
        await fs.ensureDir(dir);
        await fs.writeFile(file, html);
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
