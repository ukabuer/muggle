import { FunctionalComponent } from "preact";
import { Link } from "muggle/client";
import "./style.scss";

const Header: FunctionalComponent = () => {
  return (
    <div className="header">
      <div className="nav">
        <Link href="/">Home</Link>
        <Link href="/blog/">Blog</Link>
        <Link href="/aaaaaaa/">Error</Link>
      </div>
    </div>
  );
};

export default Header;
