import { h } from "preact";
import { Head } from "muggle";
import Header from "../components/Header";

const JsxPage = () => (
  <div>
    <Head>
      <title>Jsx test Page</title>
    </Head>
    <Header />
    <p>This is a .jsx file test page</p>
  </div>
);

export default JsxPage;
