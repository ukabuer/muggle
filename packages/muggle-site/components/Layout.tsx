import { h, FunctionComponent } from "preact";
import Header from "./Header";
import Loading from "../islands/Loading";
import { Head, Style } from "muggle";
import css from "./style.scss?inline";

const Layout: FunctionComponent = ({ children }) => {
  return (
    <main data-pjax-wrapper={true}>
      <Head>
        <Style>{css}</Style>
      </Head>
      <Loading />
      <Header />
      {children}
    </main>
  );
};

export default Layout;
