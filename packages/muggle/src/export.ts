import { pathToFileURL } from "node:url";
import { dirname, relative, resolve } from "node:path";
import fs from "node:fs/promises";
import fse from "fs-extra";
import { build } from "vite";
import { transform } from "esbuild";
import { createEntryScripts, createEntryHtml } from "./prepare.js";
import { transformPathToRoute } from "./routing.js";
import { RenderResult } from "./render.js";

// from https://github.com/sveltejs/kit/blob/master/packages/kit/src/core/adapt/prerender.js
export function cleanHtml(html: string) {
  return html
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gm, "")
    .replace(/(<script[\s\S]*?>)[\s\S]*?<\/script>/gm, "$1</script>")
    .replace(/(<style[\s\S]*?>)[\s\S]*?<\/style>/gm, "$1</style>")
    .replace(/<!--[\s\S]*?-->/gm, "");
}

export function getHref(attrs: string) {
  const match =
    /(?:[\s'"]|^)href\s*=\s*(?:"(\/.*?)"|'(\/.*?)'|(\/[^\s>]*))/.exec(attrs);
  return match && (match[1] || match[2] || match[3]);
}

export async function compile(outDir: string, tempDir: string) {
  await fs.mkdir(tempDir, { recursive: true });

  const entryHTMLPath = resolve(tempDir, "app.html");
  await createEntryHtml(entryHTMLPath);

  const entryScripts = await createEntryScripts(tempDir);

  await build({
    mode: "production",
    publicDir: false,
    logLevel: "warn",
    build: {
      lib: {
        entry: entryScripts.server,
        formats: ["es"],
        name: "entry-server",
        fileName: "entry-server",
      },
      rollupOptions: {
        external: ["muggle", "muggle/render"],
      },
      minify: false,
      ssr: true,
      emptyOutDir: false,
      outDir: tempDir,
    },
  });

  const compiler = await build({
    mode: "production",
    publicDir: false,
    // logLevel: "warn",
    build: {
      rollupOptions: {
        input: entryHTMLPath,
      },
      minify: true,
      emptyOutDir: false,
      manifest: false,
      outDir,
    },
  });

  // need optimization: complex vite artifact path
  await fs.copyFile(
    resolve(outDir, relative(".", tempDir), "./app.html"),
    resolve(tempDir, "./index.html"),
  );
  if (fse.existsSync(resolve(tempDir, "./style.css"))) {
    await fs.copyFile(
      resolve(tempDir, "./style.css"),
      resolve(outDir, "./assets/style.css"),
    );
  }
  await fs.rm(resolve(outDir, "./dist"), { recursive: true });

  return true;
  // if (compiler) {
  //   return new Promise((resolve, reject) => {
  //     compiler.addListener("event", (event) => {
  //       if (event.code === "BUNDLE_END") {
  //         resolve(true);
  //         compiler.removeAllListeners();
  //         return;
  //       }

  //       if (event.code === "ERROR") {
  //         reject(event.error);
  //         compiler.removeAllListeners();
  //         return;
  //       }
  //     });
  //   });
  // }
}

export interface Config {
  out: string;
  public: string;
}

async function startExport(config: Config) {
  const outDir = config.out.endsWith("/") ? config.out : `${config.out}/`;
  const publicDir = config.public;

  const tempDir = resolve(outDir, ".temp/");

  fse.rmSync(outDir, { force: true, recursive: true });
  await compile(outDir, tempDir);

  if (fse.existsSync(publicDir)) {
    fse.copySync(publicDir, outDir, {
      overwrite: true,
    });
  }

  const template = await fs.readFile(resolve(tempDir, "index.html"), "utf8");
  const entryServer = pathToFileURL(
    resolve(tempDir, "entry-server.js"),
  ).toString();
  const { pages, render } = await import(entryServer);
  const routes = Object.keys(pages)
    .map(transformPathToRoute)
    .filter((route) => !route.includes(":"));
  console.log("Initial page routes: ", routes);

  const writeTasks: Promise<string>[] = [];

  const unresolved: string[] = [...routes];
  const resolved = new Set();

  // OPTIMIZE: find pages' shared & private styles, bundle shared part & inline private ones
  let allPageStyles = "";
  const existStyleIds = new Set();

  while (unresolved.length > 0) {
    const url = unresolved.shift();
    if (!url || resolved.has(url)) {
      continue;
    }

    // TODO: type for render data
    const rendered = (await render(url, true)) as RenderResult;

    if (!rendered) {
      continue;
    }

    if (rendered.custom) {
      const file = resolve(outDir, `.${url}`);
      const dir = dirname(file);
      const writeTask = fs
        .mkdir(dir, { recursive: true })
        .then(() => fs.writeFile(file, rendered.content))
        .then(() => url);
      writeTasks.push(writeTask);
      resolved.add(url);
      continue;
    }

    const [head, styles, body] = rendered.content;
    const bundle = '<link href="/assets/style.css" rel="stylesheet" />';
    let html = template.replace("<!-- HEAD -->", head + bundle);
    html = html.replace("<main></main>", body);

    let file = url.endsWith("/") ? `${url}index.html` : `${url}.html`;
    file = resolve(outDir, `.${file}`);

    const dir = dirname(file);
    const writeTask = fs
      .mkdir(dir, { recursive: true })
      .then(() => fs.writeFile(file, html))
      .then(() => url);
    writeTasks.push(writeTask);

    styles.order.forEach((id) => {
      if (!existStyleIds.has(id)) {
        existStyleIds.add(id);
        allPageStyles += styles.map.get(id);
      }
    });

    const cleaned = cleanHtml(html);
    const pattern = /<(a|link|)\s+([\s\S]+?)>/gm;
    let match = pattern.exec(cleaned);
    while (match) {
      const attrs = match[2];
      const href = getHref(attrs);
      if (
        href &&
        !href.startsWith("/assets/") &&
        !href.startsWith("/static/") &&
        !href.endsWith(".css") &&
        !href.endsWith(".js")
      ) {
        const url = href.endsWith("/") ? href : `${href}/`;
        unresolved.push(url);
      }
      match = pattern.exec(cleaned);
    }
    resolved.add(url);
  }

  const { code: minifiedCSS } = await transform(allPageStyles, {
    loader: "css",
    minify: true,
  });
  await fs.writeFile(resolve(outDir, "assets/style.css"), minifiedCSS);

  const urls = await Promise.all(writeTasks);
  console.log("HTML exported:", urls);

  await fs.rm(tempDir, { recursive: true });
}

export default startExport;
