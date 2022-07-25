import { Worker } from "worker_threads";
import { relative, resolve, parse } from "path";

const worker = new Worker("./build/worker.js");

async function start() {
  const script = `${relative("build", __filename)}`;
  const n = resolve(parse(script).dir, "./MUGGLE_APP.js");
  console.log(script, n);
  const pages = await import(script).then((m) => m.AllPages);
  console.log(pages);
}

start();
