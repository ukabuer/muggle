import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";

export default [
  {
    input: ["src/cli/index.ts", "src/export.ts"],
    output: [
      {
        format: "cjs",
        dir: "dist",
        sourcemap: true,
      },
    ],
    external: [/node_modules/],
    plugins: [typescript(), nodeResolve()],
    context: "this",
    preserveEntrySignatures: false,
  },
  {
    input: ["src/index.tsx", "src/entry-client.tsx", "src/entry-server.tsx"],
    output: [
      {
        dir: "dist/esm",
        format: "es",
        sourcemap: true,
      },
    ],
    external: [/node_modules/],
    plugins: [
      typescript({
        outDir: "dist/esm",
        declaration: true,
      }),
      nodeResolve(),
    ],
    context: "this",
    preserveEntrySignatures: "strict",
  },
];
