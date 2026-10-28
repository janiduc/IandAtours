import { useEffect } from "react";

const SITE = "I&A Tours";
const DEFAULT_DESCRIPTION =
  "Private tours across Sri Lanka with your own driver-guide. Prices in USD for visitors and LKR for Sri Lankans.";

function setMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

// Sets the browser tab title, search description and sharing preview for the current page.
export function usePageMeta(title: string | undefined, description: string = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    if (!title) return;
    const fullTitle = title === SITE ? `${SITE} | Private tours and vehicle hire in Sri Lanka` : `${title} | ${SITE}`;
    document.title = fullTitle;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
  }, [title, description]);
}
