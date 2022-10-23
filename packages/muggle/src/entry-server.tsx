import { options, h, Fragment, ComponentType, VNode } from "preact";
import renderToString from "preact-render-to-string";
import { PageModule } from "./server.js";
import { parse_route_id, exec } from "./routing.js";
import Layout, { PROPS, reset } from "./Layout.js";
// eslint-disable-next-line
// @ts-ignore
import { AppContext, Head } from "muggle";

// eslint-disable-next-line
// @ts-ignore
const islands = import.meta.glob("/islands/**/*.{tsx,jsx}", { eager: true });

function hook() {
  const originalHook = options.vnode;
  let ignoreNext = false;
  options.vnode = (vnode) => {
    const OriginalType = vnode.type as ComponentType<unknown>;
    if (typeof vnode.type === "function") {
      const island = Object.entries(islands).find(
        ([, component]) =>
          (component as { default: unknown }).default === OriginalType
      );
      if (island) {
        if (ignoreNext) {
          ignoreNext = false;
          return;
        }
        vnode.type = (props) => {
          ignoreNext = true;
          PROPS.push(props);
          return (
            <>
              <script
                data-muggle-id={PROPS.length - 1}
                data-muggle-component={island[0]}
              />
              <OriginalType {...props} />
              <script data-muggle-end-id={PROPS.length - 1} />
            </>
          );
        };
      }
    }
    if (originalHook) originalHook(vnode);
  };
}
hook();

// eslint-disable-next-line
// @ts-ignore
const pages = import.meta.glob("/pages/**/*.{tsx,jsx}", { eager: true });

type Route = {
  page: PageModule;
  match: {
    pattern: RegExp;
    names: string[];
    types: string[];
  };
};

const routes: Route[] = [];
Object.entries(pages).forEach(([file, page]) => {
  let route = file.substring("/pages".length, file.length - ".tsx".length);
  if (route.endsWith("index"))
    route = route.substring(0, route.length - "index".length);
  else route += "/";
  const item = {
    match: parse_route_id(route),
    page: page as PageModule,
  };

  routes.push(item);
});

export async function renderComponent(
  path: string,
  params: Record<string, string>,
  page: PageModule,
  exportMode: boolean
) {
  reset();
  let props: unknown | undefined;
  if (page.preload) {
    props = await page.preload(params);
  }
  const Content = page.default;

  const body = renderToString(
    <AppContext.Provider value={{ path }}>
      <Layout>
        <Content page={props} />
      </Layout>
    </AppContext.Provider>
  );
  const head = Head.rewind(exportMode)
    .map((n: VNode) => renderToString(n))
    .join("");

  return [head, body];
}

export async function render(url: string, exportMode = false) {
  for (const route of routes) {
    const matches = url.match(route.match.pattern);
    if (!matches) continue;

    const params = exec(matches, route.match.names);
    return renderComponent(url, params, route.page, exportMode);
  }

  return Promise.resolve(null);
}
