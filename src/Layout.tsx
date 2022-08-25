import { h, FunctionComponent, ComponentChildren } from "preact";

export let PROPS: unknown[] = [];
export let CSS = "";
export const CSSMap: Record<string, string> = {};
export const existCSS: Set<string> = new Set();

export function reset() {
  PROPS = [];
}

export function setCSS(id: string, css: string) {
  CSSMap[id] = css;
  CSS = Object.values(CSSMap).join("\n");
}

export function setValidCSS(ids: Set<string>) {
  Object.keys(CSSMap).forEach((id) => {
    if (!ids.has(id)) {
      delete CSSMap[id];
    }
  });
}

export function getCSS() {
  return CSS;
}

type Page = {
  children: ComponentChildren;
};

const Scripts: FunctionComponent = () => (
  <script
    id="__MUGGLE_ISLAND_PROPS"
    type="application/json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(PROPS),
    }}
  />
);

// eslint-disable-next-line react/prop-types
const Layout: FunctionComponent<Page> = ({ children }) => (
  <main data-barba="container" data-barba-namespace="home">
    {children}
    <Scripts />
  </main>
);

export default Layout;
