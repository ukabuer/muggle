import fs from "fs/promises";
import { build } from "vite";
import { Worker, isMainThread, parentPort } from "worker_threads";
import { resolve } from "path";
import * as url from "url";

const __dirname = url.fileURLToPath(new url.URL(".", import.meta.url));

async function compile() {
  await fs.mkdir("dist", { recursive: true });
  await fs.copyFile(resolve(__dirname, "../esm/app.js"), "dist/app.js");
  const compiler = await build({
    build: {
      emptyOutDir: false,
      lib: {
        entry: "dist/app.js",
        formats: ["cjs"],
        fileName: "app",
      },
      rollupOptions: {
        external: [/node_modules/, "preact"],
      },
      minify: false,
      manifest: true,
      outDir: "dist",
      watch: {},
    },
  });
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

async function startCompile() {
  const worker = new Worker(__filename);
  return new Promise((resolve, reject) => {
    worker.addListener("error", (err) => {
      reject(err.message);
      worker.removeAllListeners();
    });

    worker.addListener("message", (msg) => {
      resolve(msg);
      worker.removeAllListeners();
    });
  });
}

if (!isMainThread) {
  (async () => {
    await compile();
    parentPort?.postMessage(true);
  })();
}

export default startCompile;
