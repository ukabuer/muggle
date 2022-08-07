import fs from "fs-extra";
import { startServer, startCompile, startExport } from "../main";

async function exportHTML() {
  fs.rmSync("dist", { force: true, recursive: true });
  await startCompile();
  startServer(true);
  startExport();
}

export default exportHTML;
