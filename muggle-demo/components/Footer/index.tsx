import { FunctionalComponent } from "preact";
// import "./style.scss";

const Footer: FunctionalComponent = () => {
  return (
    <div className="footer">
      <p>
        <span>© 2014 ~ {new Date().getFullYear()} </span>
      </p>
      <p>
        Built with &#129505;
        <a href="https://github.com/ukabuer/muggle" target="_blank">
          muggle
        </a>
      </p>
    </div>
  );
};

export default Footer;
