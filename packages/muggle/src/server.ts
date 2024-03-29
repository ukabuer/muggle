import fs from "fs/promises";
import { resolve } from "node:path";
import sirv from "sirv";
import polka, { Polka } from "polka";
import { createServer } from "vite";
import { Config } from "./export.js";
import { createEntryScripts, getTemplateHTML } from "./prepare.js";
import { RenderResult } from "./render.js";
import { vanillaExtractPlugin } from "./plugins/vanilla-extract.js";
interface DevConfig extends Config {
  port: number;
}

const CustomTypeToContentType: Record<string, string> = {
  ".html": "text/html",
  ".xml": "application/xml",
  ".json": "application/json",
};

export async function startDevServer(config: DevConfig): Promise<Polka> {
  const outDir = config.out.endsWith("/") ? config.out : `${config.out}/`;
  const publicDir = config.public;
  const port = config.port;
  const tempDir = resolve(outDir, ".temp/");

  await fs.mkdir(tempDir, { recursive: true });
  const entryScripts = await createEntryScripts(tempDir);

  const app = polka();

  try {
    if (await fs.stat(publicDir)) {
      app.use(sirv(publicDir));
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
    plugins: [vanillaExtractPlugin()],
    ssr: {},
    appType: "custom",
  });
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const template = await vite.transformIndexHtml(url, originHtml);
      const { render } = await vite.ssrLoadModule(entryScripts.server);
      // TODO: type for render data
      const rendered = (await render(url, false)) as RenderResult;
      if (!rendered) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found.");
        return;
      }

      if (rendered.custom) {
        res.writeHead(200);
        res.end(rendered.content);
      } else {
        const [head, _, body] = rendered.content;
        let html = template.replace("<!-- HEAD -->", head);
        html = html.replace("<main></main>", body);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
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

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`> Running on http://localhost:${port.toString()}`);
      resolve(app);
    });
  });
}

export async function startPreviewServer(config: DevConfig) {
  const outDir = config.out.endsWith("/") ? config.out : `${config.out}/`;
  const port = config.port;

  const app = polka();

  try {
    if (await fs.stat(outDir)) {
      app.use(sirv(outDir));
    }
  } catch {
    void 0;
  }

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`> Running on http://localhost:${port.toString()}`);
      resolve(app);
    });
  });
}
