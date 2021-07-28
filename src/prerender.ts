import glob from "fast-glob";
import fetch from "isomorphic-unfetch";
import { isMainThread, Worker, parentPort } from "worker_threads";
import createServer from "./server";
import * as vite from "vite";
import { resolve } from "path";
import fs from "fs-extra";

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
  const pages = await glob("site/routes/**/*.tsx");
  const apis = await glob("site/routes/**/.ts");
  const urls = pages
    .concat(apis)
    .filter((url) => !url.match(/\[\w+\]/))
    .map((url) =>
      url.replace(".tsx", "").replace("/index", "/").replace("site/routes", "")
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
    root: resolve(__dirname, "../site"),
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Fragment",
      jsxInject: `import { h, Fragment } from 'preact'`,
    },
    build: {
      emptyOutDir: true,
      ssr: resolve(__dirname, "./entry-server.tsx"),
      ssrManifest: true,
      outDir: "./dist/server",
      manifest: true,
    },
  });

  await vite.build({
    configFile: false,
    root: resolve(__dirname, "../site"),
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Fragment",
      jsxInject: `import { h, Fragment } from 'preact'`,
    },
    build: {
      emptyOutDir: false,
      outDir: "./dist",
      manifest: true,
    },
  });

  fs.copyFileSync(
    resolve(__dirname, "../site/dist/index.html"),
    resolve(__dirname, "../site/dist/server/template.html")
  );

  fs.rmSync(resolve(__dirname, "../site/dist/index.html"));

  const app = await createServer(true);
  const worker = new Worker(__filename);
  worker.on("error", (err) => {
    console.error(err.message);
  });
  worker.on("message", () => {
    console.log("prerendered!");
    fs.rmdirSync(resolve(__dirname, "../site/dist/server/"), {
      recursive: true,
    });
    app.server.close();
  });
  worker.on("exit", () => {
    process.exit();
  });
}

if (isMainThread) {
  startServerAndPrerender();
} else {
  prerender().then(() => {
    fs.copySync("site/public/", "site/dist/", {
      overwrite: true,
    });
    parentPort?.postMessage(null);
  });
}
