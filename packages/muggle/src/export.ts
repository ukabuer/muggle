import fse from "fs-extra";
import http from "http";
import { build } from "vite";
import * as url from "url";
import { relative, parse, resolve } from "path";
import fs from "fs/promises";
import { getTemplateHTML } from "./server.js";

const __dirname = url.fileURLToPath(new url.URL(".", import.meta.url));

async function collect(rootDir: string, test: (_: string) => boolean) {
  const files: string[] = [];

  async function traversal(dir: string) {
    const stat = await fs.stat(dir);
    if (!stat || !stat.isDirectory()) return;

    const items = await fs.readdir(dir);

    const tasks = items.map(async (item) => {
      const path = resolve(dir, item);
      const substat = await fs.stat(path);
      if (substat.isDirectory()) {
        await traversal(path);
      } else if (test(path)) {
        files.push(path);
      }
    });
    await Promise.all(tasks);
  }

  await traversal(rootDir);

  return files;
}

export function processPages(pages: string[]): string[] {
  const routes: string[] = [];
  pages.forEach((path) => {
    const info = parse(path);
    let route = path.substring(0, path.length - info.ext.length);
    route = relative("pages", route).replace(/\\/g, "/");
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

    routes.push(route);
  });
  return routes;
}

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

async function request(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(path, (resp) => {
        let data = "";

        resp.on("data", (chunk) => {
          data += chunk;
        });

        resp.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

export async function compile() {
  await fs.mkdir("dist/.temp", { recursive: true });

  await fs.copyFile(
    resolve(__dirname, "./entry-client.js"),
    "dist/.temp/entry-client.js"
  );

  const entryHTMLPath = "dist/.temp/app.html";
  await fs.writeFile(entryHTMLPath, getTemplateHTML());
  await build({
    mode: "production",
    publicDir: false,
    build: {
      lib: {
        entry: resolve(__dirname, "./entry-server.js"),
        formats: ["es"],
        name: "entry-server",
        fileName: "entry-server",
      },
      rollupOptions: {
        external: ["muggle"],
      },
      minify: true,
      ssr: true,
      emptyOutDir: false,
      outDir: "dist/.temp",
    },
  });

  const compiler = await build({
    mode: "production",
    publicDir: false,
    build: {
      rollupOptions: {
        input: entryHTMLPath,
      },
      minify: true,
      emptyOutDir: false,
      manifest: false,
      outDir: "dist",
    },
  });

  await fs.copyFile("dist/dist/.temp/app.html", "dist/.temp/index.html");
  await fs.copyFile("dist/.temp/style.css", "dist/assets/style.css");
  await fs.rm("dist/dist", { recursive: true });

  if ("addListener" in compiler) {
    return new Promise((resolve, reject) => {
      compiler.addListener("event", (event) => {
        if (event.code === "BUNDLE_END") {
          resolve(true);
          compiler.removeAllListeners();
          return;
        }

        if (event.code === "ERROR") {
          reject(event.error);
          compiler.removeAllListeners();
          return;
        }
      });
    });
  }
}

async function exportHTML() {
  if (fse.existsSync("public")) {
    fse.copySync("public/", "dist/", {
      overwrite: true,
    });
  }

  const sources = await await collect(
    "./pages",
    (file) => file.endsWith(".jsx") || file.endsWith(".tsx")
  );
  console.log("Current dir: ", process.cwd());
  console.log("page soruces: ", sources);
  const pageFiles = sources.map((file) => relative(process.cwd(), file));
  const routes = processPages(pageFiles).filter(
    (route) => !route.includes(":")
  );
  console.log("initial page routes: ", routes);

  const unresolved: string[] = [...routes];
  const resolved = new Set();
  while (unresolved.length > 0) {
    const url = unresolved.shift();
    if (!url || resolved.has(url)) {
      continue;
    }

    // request url & get response
    const target = `http://localhost:5173${url}`;
    const response = await request(target);
    // save to file
    // parse to find more url
    const cleaned = cleanHtml(response);

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
        const fullUrl = new URL(href, "http://localhost:5173/");
        unresolved.push(fullUrl.pathname);
      }
      match = pattern.exec(cleaned);
    }
    resolved.add(url);
  }

  await fs.rm("dist/.temp", { recursive: true });
}

export async function startExport() {
  return exportHTML();
}

export default startExport;
