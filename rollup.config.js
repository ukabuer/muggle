import sucrase from "@rollup/plugin-sucrase";
import nodeResolve from "@rollup/plugin-node-resolve";

export default [
  {
    input: "src/cli/index.ts",
    output: [
      {
        format: "cjs",
        file: "dist/cli.js",
      },
    ],
    external: [/node_modules/],
    plugins: [
      sucrase({
        exclude: ["node_modules/**"],
        transforms: ["jsx", "typescript"],
        jsxPragma: "h",
        jsxFragmentPragma: "Fragment",
      }),
      nodeResolve(),
    ],
    context: "this",
    preserveEntrySignatures: false,
  },
  {
    input: "src/compile.ts",
    output: [
      {
        dir: "dist/",
        format: "cjs",
      },
    ],
    external: [/node_modules/],
    plugins: [
      sucrase({
        exclude: ["node_modules/**"],
        transforms: ["jsx", "typescript"],
        jsxPragma: "h",
        jsxFragmentPragma: "Fragment",
      }),
      nodeResolve(),
    ],
    context: "this",
    preserveEntrySignatures: false,
  },
  {
    input: "src/export.ts",
    output: [
      {
        dir: "dist/",
        format: "cjs",
      },
    ],
    external: [/node_modules/],
    plugins: [
      sucrase({
        exclude: ["node_modules/**"],
        transforms: ["jsx", "typescript"],
        jsxPragma: "h",
        jsxFragmentPragma: "Fragment",
      }),
      nodeResolve(),
    ],
    context: "this",
    preserveEntrySignatures: false,
  },
  {
    input: "src/client/Head.tsx",
    output: [
      {
        dir: "dist/client/",
        format: "es",
        name: "index.js",
      },
    ],
    external: [/node_modules/],
    plugins: [
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
];
