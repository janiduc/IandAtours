import { Link } from "react-router-dom";
import { usePageMeta } from "../usePageMeta";

export default function NotFound() {
  usePageMeta("Page not found");
  return (
    <section className="container section">
      <h1>Page not found</h1>
      <Link to="/">Go to the home page</Link>
    </section>
  );
}
