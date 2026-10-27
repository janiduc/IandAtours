import { useState } from "react";

export default function Logo() {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="logo-text">I&amp;A Tours</span>;
  return <img src="/images/logo.png" alt="I&A Tours" className="logo-img" onError={() => setFailed(true)} />;
}
