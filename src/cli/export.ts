import fs from "fs-extra";
import { startServer, startCompile, startExport } from "../main";

function exports() {
  fs.rmSync("dist", { force: true, recursive: true });
  startCompile();
  setTimeout(() => {
    startServer(true);
    startExport();
  }, 1000);
}

export default exports;
