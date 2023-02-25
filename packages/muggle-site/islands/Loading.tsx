import { h, FunctionComponent } from "preact";
import { useAppContext } from "muggle";

const Loading: FunctionComponent = () => {
  const { loading } = useAppContext();
  return <div className="page-loader">{loading ? <div /> : null}</div>;
};

export default Loading;
