import { options, h, Fragment, ComponentType, VNode } from "preact";
import renderToString from "preact-render-to-string";
import { PROPS } from "./Layout";
import { PageModule } from "./server";
import { parse_route_id, exec } from "./routing";
import Heads from "./Head";
import Layout, { reset } from "./Layout";
import { AppContext } from "./index";

// eslint-disable-next-line
// @ts-ignore
const islands = import.meta.glob("/islands/**/*.tsx", { eager: true });

function hook() {
  const originalHook = options.vnode;
  let ignoreNext = false;
  options.vnode = (vnode) => {
    const OriginalType = vnode.type as ComponentType<unknown>;
    if (typeof vnode.type === "function") {
      const island = Object.entries(islands).find(
        ([, component]) => (component as any).default === OriginalType
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
const pages = import.meta.glob("/pages/**/*.tsx", { eager: true });

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

export async function renderComponent(path: string, page: PageModule) {
  reset();
  let props: unknown | undefined;
  if (page.preload) {
    props = await page.preload();
  }
  const Content = page.default;

  const body = renderToString(
    <AppContext.Provider value={{ path }}>
      <Layout>
        <Content page={props} />
      </Layout>
    </AppContext.Provider>
  );
  const head = Heads.rewind()
    .map((n: VNode) => renderToString(n))
    .join("");

  return [head, body];
}

export async function render(url: string) {
  for (const route of routes) {
    const matches = url.match(route.match.pattern);
    if (!matches) continue;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _params = exec(matches, route.match.names);
    return renderComponent(url, route.page);
  }

  return Promise.resolve(null);
}
