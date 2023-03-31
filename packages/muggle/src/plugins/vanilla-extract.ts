/** based on https://github.com/vanilla-extract-css/vanilla-extract/blob/ab72774f28c9bb839c97fdee6e7c11e1a82276dc/packages/vite-plugin/src/index.ts */
import path from "path";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { normalizePath } from "vite";
import {
  cssFileFilter,
  processVanillaFile,
  compile,
  IdentifierOption,
  CompileOptions,
} from "@vanilla-extract/integration";

const virtualExtCss = ".vanilla.css";

interface Options {
  identifiers?: IdentifierOption;
  esbuildOptions?: CompileOptions["esbuildOptions"];
}
export function vanillaExtractPlugin({
  identifiers,
  esbuildOptions,
}: Options = {}): Plugin {
  let config: ResolvedConfig;
  let server: ViteDevServer;
  const cssMap = new Map<string, string>();

  const getAbsoluteVirtualFileId = (source: string) =>
    normalizePath(path.join(config.root, source));

  return {
    name: "vanilla-extract",
    enforce: "pre",
    configureServer(_server) {
      server = _server;
    },
    config(_userConfig, env) {
      return {
        ssr: {
          external: [
            "@vanilla-extract/css",
            "@vanilla-extract/css/fileScope",
            "@vanilla-extract/css/adapter",
          ],
        },
      };
    },
    async configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    resolveId(source) {
      const [validId, query] = source.split("?");
      if (!validId.endsWith(virtualExtCss)) {
        return;
      }

      // Absolute paths seem to occur often in monorepos, where files are
      // imported from outside the config root.
      const absoluteId = source.startsWith(config.root)
        ? source
        : getAbsoluteVirtualFileId(validId);

      // There should always be an entry in the `cssMap` here.
      // The only valid scenario for a missing one is if someone had written
      // a file in their app using the .vanilla.js/.vanilla.css extension
      if (cssMap.has(absoluteId)) {
        // Keep the original query string for HMR.
        return absoluteId + (query ? `?${query}` : "");
      }
    },
    load(id) {
      const [validId] = id.split("?");

      if (!cssMap.has(validId)) {
        return;
      }

      const css = cssMap.get(validId);

      if (typeof css !== "string") {
        return;
      }

      return css;
    },
    async transform(code, id, ssrParam) {
      const [validId] = id.split("?");

      if (!cssFileFilter.test(validId)) {
        return null;
      }

      const identOption =
        identifiers ?? (config.mode === "production" ? "short" : "debug");

      const { source, watchFiles } = await compile({
        filePath: validId,
        cwd: config.root,
        esbuildOptions,
        identOption,
      });

      for (const file of watchFiles) {
        // In start mode, we need to prevent the file from rewatching itself.
        // If it's a `build --watch`, it needs to watch everything.
        if (config.command === "build" || file !== validId) {
          this.addWatchFile(file);
        }
      }

      const output = await processVanillaFile({
        source,
        filePath: validId,
        identOption,
        serializeVirtualCssPath: async ({ fileScope, source }) => {
          const rootRelativeId = `${fileScope.filePath}${virtualExtCss}`;
          const absoluteId = getAbsoluteVirtualFileId(rootRelativeId);

          let cssSource = source;

          if (
            server &&
            cssMap.has(absoluteId) &&
            cssMap.get(absoluteId) !== source
          ) {
            const { moduleGraph } = server;
            const [module] = Array.from(
              moduleGraph.getModulesByFile(absoluteId) || [],
            );

            if (module) {
              moduleGraph.invalidateModule(module);

              // Vite uses this timestamp to add `?t=` query string automatically for HMR.
              module.lastHMRTimestamp =
                (module as any).lastInvalidationTimestamp || Date.now();
            }
          }

          cssMap.set(absoluteId, cssSource);

          // We use the root relative id here to ensure file contents (content-hashes)
          // are consistent across build machines
          return `import __vanilla_css__ from "${rootRelativeId}?inline";`;
        },
      });

      const result = output.replace(
        `var __default__ = ''`,
        "var __default__ = __vanilla_css__",
      );

      return {
        code: result,
        map: { mappings: "" },
      };
    },
  };
}
