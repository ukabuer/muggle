import fs from "node:fs/promises";
import type { Server } from "node:http";
import { resolve } from "node:path";
import { type HttpBindings, serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { RESPONSE_ALREADY_SENT } from "@hono/node-server/utils/response";
import { Hono } from "hono";
import { createServer } from "vite";
import { type Config, suppressCssPlugin } from "./export.js";
import { createEntryScripts, getTemplateHTML } from "./prepare.js";
import type { RenderResult } from "./render.js";

interface DevConfig extends Config {
  port: number;
}

export async function startDevServer(config: DevConfig): Promise<Server> {
  const outDir = config.out.endsWith("/") ? config.out : `${config.out}/`;
  const publicDir = config.public;
  const port = config.port;
  const tempDir = resolve(outDir, ".temp/");

  await fs.mkdir(tempDir, { recursive: true });
  const entryScripts = await createEntryScripts(tempDir);

  const originHtml = getTemplateHTML();

  const vite = await createServer({
    logLevel: "info",
    server: { middlewareMode: true },
    plugins: [suppressCssPlugin()],
    ssr: {},
    appType: "custom",
    oxc: {
      jsx: {
        runtime: "classic",
        pragma: "h",
        pragmaFrag: "Fragment",
      },
    },
    build: {},
    resolve: {
      dedupe: [
        "preact",
        "preact/hooks",
        "preact/jsx-runtime",
        "preact-render-to-string",
      ],
    },
  });

  const app = new Hono<{ Bindings: HttpBindings }>();

  app.use("*", serveStatic({ root: publicDir }));

  app.use("*", async (c, next) => {
    await new Promise<void>((resolve, reject) => {
      vite.middlewares(c.env.incoming, c.env.outgoing, (error?: unknown) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    if (c.env.outgoing.headersSent) {
      return RESPONSE_ALREADY_SENT;
    }

    await next();
  });

  app.get("*", async (c) => {
    const url = new URL(c.req.url).pathname;

    try {
      const template = await vite.transformIndexHtml(url, originHtml);
      const { render } = await vite.ssrLoadModule(entryScripts.server);
      const rendered = (await render(url, false)) as RenderResult;
      if (!rendered) {
        return c.text("Not Found.", 404);
      }

      if (rendered.custom) {
        return c.body(rendered.content);
      }

      const [head, _, body] = rendered.content;
      let html = template.replace("<!-- HEAD -->", head);
      html = html.replace("<main></main>", body);

      return c.html(html);
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log(e);
        vite.ssrFixStacktrace(e);
      }
      throw e;
    }
  });

  return serve({ fetch: app.fetch, port }, () => {
    console.log(`> Running on http://localhost:${port.toString()}`);
  }) as Server;
}

export async function startPreviewServer(config: DevConfig): Promise<Server> {
  const outDir = config.out.endsWith("/") ? config.out : `${config.out}/`;
  const port = config.port;
  const app = new Hono();

  app.use("*", serveStatic({ root: outDir }));

  return serve({ fetch: app.fetch, port }, () => {
    console.log(`> Running on http://localhost:${port.toString()}`);
  }) as Server;
}
