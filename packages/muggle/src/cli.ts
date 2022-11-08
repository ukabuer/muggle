#!/usr/bin/env node
import fs from "node:fs/promises";
import cac from "cac";
import startExport from "./export.js";
import { startDevServer, startPreviewServer } from "./server.js";
import { resolve } from "node:path";

const cli = cac();

cli
  .option("--out <dir>", "where to store generated and temp files", {
    default: "dist",
  })
  .option("--public <dir>", "where to serve static files from", {
    default: "public",
  });

cli
  .command("serve")
  .option("--port <port>", "set dev server port", {
    default: 5173,
  })
  .action(async (options) => {
    startDevServer({
      out: options.out,
      public: options.public,
      port: options.port,
    });
  });

cli.command("build").action(async (options) => {
  await startExport({
    out: options.out,
    public: options.public,
  });
});

cli
  .command("preview")
  .option("--port <port>", "set dev server port", {
    default: 5173,
  })
  .action(async (options) => {
    try {
      await fs.stat(resolve(options.out, "index.html"));
    } catch {
      console.log("No pre-built site found, generating now.");
      await startExport({
        out: options.out,
        public: options.public,
      });
    }

    startPreviewServer({
      out: options.out,
      public: options.public,
      port: options.port,
    });
  });

cli.parse();
