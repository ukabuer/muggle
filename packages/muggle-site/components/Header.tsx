import { Head, Style, useAppContext } from "muggle";
import { type FunctionalComponent, h } from "preact";
import styles from "./header.module.css";
import css from "./header.module.css?inline";

const Header: FunctionalComponent = () => {
  const { path } = useAppContext();

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
        <Style>{css}</Style>
      </Head>
      {navs.map((nav) => (
        <a
          id={nav.path}
          href={nav.path}
          className={path === nav.path ? styles.activeLink : styles.link}
        >
          {nav.title}
        </a>
      ))}
    </header>
  );
};

export default Header;
