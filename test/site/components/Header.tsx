import { h, FunctionalComponent } from "preact";
import { Head } from "muggle";
import css from "./style.css";

const Header: FunctionalComponent = () => {
  return (
    <header>
      <Head>
        <style>{css}</style>
      </Head>
      <a href="/">Index</a>
      <a href="/about/">About</a>
      <a href="/jsx/">Jsx Test</a>
      <a href="/blog/1/">Post 1</a>
      <a href="/blog/2/">Post 2</a>
    </header>
  );
};

export default Header;
