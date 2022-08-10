import fs from "fs/promises";
import { watch } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import common from "@rollup/plugin-commonjs";
import sucrase from "@rollup/plugin-sucrase";
import virtual from "@rollup/plugin-virtual";
import { relative, parse, resolve } from "path";
import { isMainThread, parentPort } from "worker_threads";

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

async function dev() {
  const files = await (
    await collect(
      "islands",
      (file) => file.endsWith(".jsx") || file.endsWith(".tsx")
    )
  ).map((file) => {
    const info = parse(file);
    return {
      path: `./${relative(".", file).replaceAll("\\", "/")}`,
      name: info.name,
    };
  });

  let MUGGLE_COMPONENTS = "";
  let nameToImport = "";
  files.forEach((file, i) => {
    MUGGLE_COMPONENTS += `import $${i} from "${file.path}";\n`;
    nameToImport += `\n${file.name}: $${i},`;
  });
  MUGGLE_COMPONENTS += `export default {${nameToImport}\n};`;

  const pageFiles = await (
    await collect(
      "pages",
      (file) => file.endsWith(".jsx") || file.endsWith(".tsx")
    )
  ).map((file) => {
    const info = parse(file);
    return {
      path: `./${relative(".", file).replaceAll("\\", "/")}`,
      name: info.name,
    };
  });

  let MUGGLE_PAGES = "";
  nameToImport = "";
  pageFiles.forEach((file, i) => {
    MUGGLE_PAGES += `import * as $${i} from "${file.path}";\n`;
    nameToImport += `\n"${file.path}": $${i},`;
  });
  MUGGLE_PAGES += `export default {${nameToImport}\n};`;

  const watcher = watch([
    {
      input: resolve(__dirname, "../src/entry-client.tsx"),
      output: [
        {
          dir: "public/",
          format: "iife",
        },
      ],
      plugins: [
        virtual({ MUGGLE_COMPONENTS }),
        sucrase({
          exclude: ["node_modules/**"],
          transforms: ["jsx", "typescript"],
          jsxPragma: "h",
          jsxFragmentPragma: "Fragment",
        }),
        nodeResolve({
          extensions: ["js", "jsx", "ts", "tsx"],
          preferBuiltins: false,
        }),
        common(),
      ],
      context: "window",
      preserveEntrySignatures: false,
    },
    {
      input: "MUGGLE_APP",
      output: [
        {
          format: "cjs",
          file: "dist/MUGGLE_APP.js",
        },
      ],
      external: [/node_modules/, "muggle"],
      plugins: [
        virtual({
          MUGGLE_COMPONENTS,
          MUGGLE_PAGES,
          MUGGLE_APP: `
            export { default as AllComponents } from "MUGGLE_COMPONENTS";
            export { default as AllPages } from "MUGGLE_PAGES";`,
        }),
        sucrase({
          exclude: ["node_modules/**"],
          transforms: ["jsx", "typescript"],
          jsxPragma: "h",
          jsxFragmentPragma: "Fragment",
        }),
        nodeResolve(),
      ],
      context: "this",
      preserveEntrySignatures: "strict",
    },
  ]);

  let count = 0;
  watcher.on("event", (event) => {
    if (event.code === "BUNDLE_END") {
      count += 1;
      if (count == 2) {
        parentPort?.postMessage(true);
      }
    } else if (event.code === "ERROR") {
      console.log(event.error.message);
    }
  });
}

if (!isMainThread) {
  dev();
}

export default dev;

export { collect };