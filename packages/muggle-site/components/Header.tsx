import { h, FunctionalComponent } from "preact";
import { Head, Style, useServerRenderContext } from "muggle";
import * as styles from "./header.css.js";

const Header: FunctionalComponent = () => {
  const { path } = useServerRenderContext();

  const navs = [
    { path: "/", title: "Home" },
    { path: "/about/", title: "About" },
    { path: "/jsx/", title: "Jsx Test" },
    { path: "/blog/1/", title: "Post 1" },
    { path: "/blog/2/", title: "Post 2" },
  ];

  return (
    <header>
      <Head>
        <Style>{styles.default}</Style>
      </Head>
      {navs.map((nav) => (
        <a
          id={nav.path}
          href={nav.path}
          className={path === nav.path ? styles.actvieLink : styles.link}
        >
          {nav.title}
        </a>
      ))}
    </header>
  );
};

export default Header;
