import { h, FunctionComponent } from "preact";
import { Head } from "muggle";
import Header from "../components/Header";

const AboutPage: FunctionComponent = () => (
  <div>
    <Head>
      <title>About Page</title>
    </Head>
    <Header />
    <p>This is about page.</p>
  </div>
);

export default AboutPage;
