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
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#ff7f7f" />
        <meta name="msapplication-navbutton-color" content="#ff7f7f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </Head>
      <Loading />
      <Header />
      {children}
    </main>
  );
};

export default Layout;
