import { h, FunctionComponent, ComponentChildren } from "preact";

export let PROPS: unknown[] = [];

export function reset() {
  PROPS = [];
}

type Page = {
  children: ComponentChildren;
};

const Scripts: FunctionComponent = () => (
  <script
    id="__MUGGLE_ISLAND_PROPS"
    type="application/json"
    // eslint-disable-next-line react/no-danger
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
