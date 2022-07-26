import { Worker } from "worker_threads";
import { relative, resolve, parse } from "path";
import sirv from "sirv";
import polka from "polka";
import fs from "fs/promises";
import {
  ComponentType, h, Fragment, options,
} from "preact";
import renderToString from "preact-render-to-string";
// eslint-disable-next-line import/extensions
import Layout, { PROPS, reset } from "./Layout";

const worker = new Worker("./build/worker.js");

async function start() {
  const script = resolve("./build/MUGGLE_APP.js");
  const pages = await import(script).then((m) => m.AllPages);

  const app = polka();

  if (await fs.stat("public")) {
    app.use(sirv("public"));
  }

  const routes: Record<string, ComponentType> = {};
  Object.entries(pages).forEach(([path, page]) => {
    const info = parse(path);
    let route = path.substring(0, path.length - info.ext.length);
    route = relative("./test/pages", route).replaceAll("\\", "/");
    route = `/${route}`;
    if (route.endsWith("index")) route = route.substring(0, route.length - "index".length);
    routes[route] = page as ComponentType;
  });
  console.log("routes", Object.keys(routes));

  Object.entries(routes).forEach(([route, page]) => {
    app.get(route, async (req, res) => {
      reset();
      const Content = page as ComponentType;
      const html = `<!DOCTYPE html>${renderToString(
        <Layout title={route}>
          <Content />
        </Layout>,
      )}`;
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    });
  });

  const islands = await import(script).then((m) => m.AllComponents);
  const originalHook = options.vnode;
  let ignoreNext = false;
  options.vnode = (vnode) => {
    const OriginalType = vnode.type as ComponentType<unknown>;
    if (typeof vnode.type === "function") {
      const island = Object.entries(islands).find(
        ([_, component]) => component === OriginalType,
      );
      if (island) {
        if (ignoreNext) {
          ignoreNext = false;
          return;
        }
        // eslint-disable-next-line no-param-reassign
        vnode.type = (props) => {
          ignoreNext = true;
          PROPS.push(props);
          return (
            <>
              <script
                data-muggle-id={PROPS.length - 1}
                data-muggle-component={island[0]}
              />
              {/* eslint-disable-next-line react/jsx-props-no-spreading */}
              <OriginalType {...props} />
              <script data-muggle-end-id={PROPS.length - 1} />
            </>
          );
        };
      }
    }
    if (originalHook) originalHook(vnode);
  };

  app.listen(3000, () => {
    console.log("> Running on localhost:3000");
  });
}

setTimeout(() => {
  start();
}, 1000);
