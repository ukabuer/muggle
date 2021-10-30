import glob from "fast-glob";
import fetch from "isomorphic-unfetch";
import { isMainThread, Worker, parentPort } from "worker_threads";
import * as vite from "vite";
import { resolve, join } from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import createServer from "./server.js";
import { store, config } from "./cli.js";

// from https://github.com/sveltejs/kit/blob/master/packages/kit/src/core/adapt/prerender.js
function clean_html(html: string) {
  return html
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gm, "")
    .replace(/(<script[\s\S]*?>)[\s\S]*?<\/script>/gm, "$1</" + "script>")
    .replace(/(<style[\s\S]*?>)[\s\S]*?<\/style>/gm, "$1</" + "style>")
    .replace(/<!--[\s\S]*?-->/gm, "");
}

function get_href(attrs: string) {
  const match =
    /(?:[\s'"]|^)href\s*=\s*(?:"(\/.*?)"|'(\/.*?)'|(\/[^\s>]*))/.exec(attrs);
  return match && (match[1] || match[2] || match[3]);
}

export async function prerender() {
  const pages = await glob("pages/**/*.tsx");
  const apis = await glob(config.apis + "/**/*.ts");
  const urls = pages
    .concat(apis)
    .filter((url) => !url.match(/\[\w+\]/))
    .map((url) =>
      url
        .replace(new RegExp(`^${config.apis}`), `/${config.apis}`)
        .replace(/^pages/, "")
        .replace(/\.ts$/, "")
        .replace(/\.tsx$/, "")
        .replace(/\/index$/, "/")
    );
  // start server with rendering mode
  const unresolved = [...urls];
  const resolved = new Set();

  while (unresolved.length > 0) {
    const url = unresolved.shift();
    if (!url || resolved.has(url)) {
      continue;
    }

    // request url & get response
    const target = `http://localhost:3000${url}`;
    const response = await fetch(target);
    if (response.status != 200) {
      continue;
    }

    // save to file
    const type = response.headers.get("Content-Type") || "";
    if (type.match("text/html")) {
      // parse to find more url
      const text = await response.text();

      const cleaned = clean_html(text);

      let match;
      const pattern = /<(a|link|)\s+([\s\S]+?)>/gm;

      while ((match = pattern.exec(cleaned))) {
        const attrs = match[2];
        const href = get_href(attrs);
        if (
          href &&
          !href.startsWith("/assets/") &&
          !href.startsWith("/static/")
        ) {
          const url = new URL(href, "http://localhost:3000/");
          unresolved.push(url.pathname);
        }
      }
    }

    resolved.add(url);
  }
}

async function startServerAndPrerender() {
  await vite.build({
    configFile: false,
    mode: "production",
    root: store,
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Fragment",
      jsxInject: `import { h, Fragment } from 'preact'`,
    },
    build: {
      cssCodeSplit: false,
      emptyOutDir: false,
      outDir: resolve("dist"),
    },
  });

  fs.copyFileSync("dist/index.html", join(store, "index.html"));

  const app = await createServer(true);
  const filename = fileURLToPath(import.meta.url);
  const worker = new Worker(filename);
  worker.on("error", (err) => {
    console.error(err.message);
  });
  worker.on("message", () => {
    console.log("prerendered!");
    app.server.close();
  });
  worker.on("exit", () => {
    process.exit();
  });
}

function render() {
  startServerAndPrerender();
}

if (!isMainThread) {
  prerender().then(() => {
    fs.copySync("public/", "dist/", {
      overwrite: true,
    });
    parentPort?.postMessage(null);
  });
}

export default render;
