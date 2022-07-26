import {
  h, Fragment, FunctionComponent, ComponentChildren,
} from "preact";

// eslint-disable-next-line import/no-mutable-exports
export let PROPS: unknown[] = [];

export function reset() {
  PROPS = [];
}

type Page = {
  children: ComponentChildren;
  title: string;
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
const Layout: FunctionComponent<Page> = ({ title, children }) => (
  <html lang="en">
    <head>
      <title>{title}</title>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body data-barba="wrapper">
      <main data-barba="container" data-barba-namespace="home">
        {children}
        <Scripts />
      </main>
      <script src="/client.js" />
    </body>
  </html>
);

export default Layout;
