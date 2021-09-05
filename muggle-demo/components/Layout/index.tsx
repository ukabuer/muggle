import { FunctionComponent } from "preact";
import Header from "../Header/index.js";
import Footer from "../Footer/index.js";
// import "./style.scss";

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
