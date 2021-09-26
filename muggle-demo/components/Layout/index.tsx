import { FunctionComponent } from "preact";
import { Head } from "muggle-client";
import Header from "../Header";
import Footer from "../Footer";
import "./style.scss";

const Layout: FunctionComponent = ({ children }) => {
  return (
    <div id="app">
      <Head>
        <meta charSet="utf-8" />
      </Head>
      <Header />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
