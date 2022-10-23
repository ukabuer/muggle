import { resolve, dirname } from "path";
import sirv from "sirv";
import polka, { Polka } from "polka";
import fs from "fs/promises";
import { ComponentType } from "preact";
import { createServer } from "vite";
import { URL, fileURLToPath, pathToFileURL } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export function getTemplateHTML() {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head><!-- HEAD --></head>
    <body data-barba="wrapper">
      <main></main>
      <script type="module" src="/dist/.temp/entry-client.js"></script>
    </body>
  </html>
  `;
}

export async function startDevServer(): Promise<Polka> {
  await fs.mkdir("dist/.temp", { recursive: true });
  await fs.writeFile(
    "dist/.temp/entry-server.js",
    `export * from "muggle/entry-server.js"`
  );
  await fs.writeFile(
    "dist/.temp/entry-client.js",
    `import "muggle/entry-client.js"`
  );

  const app = polka();

  try {
    if (await fs.stat("public")) {
      app.use(sirv("public"));
    }
  } catch {
    void 0;
  }

  const originHtml = getTemplateHTML();

  const vite = await createServer({
    logLevel: "info",
    server: { middlewareMode: true },
    resolve: {
      dedupe: ["preact"],
    },
    ssr: {},
    appType: "custom",
  });
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const template = await vite.transformIndexHtml(url, originHtml);
      const { render } = await vite.ssrLoadModule(
        "./dist/.temp/entry-server.js"
      );
      const rendered = (await render(url, false)) as null | string[];
      if (!rendered) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found.");
        return;
      }
      const [head, body] = rendered;
      let html = template.replace("<!-- HEAD -->", head);
      html = html.replace("<main></main>", body);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
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

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log("> Running on http://localhost:" + port.toString());
      resolve(app);
    });
  });
}

export async function startBuildServer(): Promise<Polka> {
  const app = polka();

  try {
    if (await fs.stat("public")) {
      app.use(sirv("public"));
    }
  } catch {
    void 0;
  }

  const entryHTML = await fs.readFile("dist/.temp/index.html", "utf8");
  const entryServer = pathToFileURL("dist/.temp/entry-server.js").toString();
  const { render } = await import(entryServer);

  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const template = entryHTML;
      const rendered = (await render(url, true)) as null | string[];
      if (!rendered) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found.");
        return;
      }
      const [head, body] = rendered;
      const bundle = '<link href="/assets/style.css" rel="stylesheet" />';
      let html = template.replace("<!-- HEAD -->", head + bundle);
      html = html.replace("<main></main>", body);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);

      const target = `dist${url}`;
      const file = url.endsWith("/") ? `${target}index.html` : `${target}.html`;

      const dir = dirname(file);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file, html);
      console.log("HTML exported:", url);
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log(e);
        next(e);
      } else {
        next("Error");
      }
    }
  });

  const port = 5173;

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log("> Running on http://localhost:" + port.toString());
      resolve(app);
    });
  });
}

export type PageModule = {
  default: ComponentType<{ page?: unknown }>;
  preload?: (params: Record<string, string>) => Promise<unknown>;
};
