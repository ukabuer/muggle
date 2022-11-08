import { h, FunctionComponent, ComponentChildren } from "preact";
import { useServerRenderContext } from "../context.js";

type Page = {
  children: ComponentChildren;
};

const Scripts: FunctionComponent = () => {
  const { islandsProps } = useServerRenderContext();
  return (
    <script
      id="__MUGGLE_ISLAND_PROPS"
      type="application/json"
      // rome-ignore lint: need use dangerouslySetInnerHTML
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(islandsProps),
      }}
    />
  );
};

const Layout: FunctionComponent<Page> = ({ children }: Page) => (
  <main data-barba="container" data-barba-namespace="home">
    {children}
    <Scripts />
  </main>
);

export default Layout;
