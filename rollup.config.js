import sucrase from "@rollup/plugin-sucrase";
import nodeResolve from "@rollup/plugin-node-resolve";

export default [
  {
    input: "src/main.tsx",
    output: [
      {
        dir: "build/",
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
    input: "src/worker.ts",
    output: [
      {
        dir: "build/",
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
];
