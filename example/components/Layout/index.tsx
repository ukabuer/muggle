import { FunctionComponent } from "preact";
import Header from "../Header";
import Footer from "../Footer";
import "./style.scss";

const Layout: FunctionComponent = ({ children }) => {
  return (
    <div id="app">
      <Header />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
