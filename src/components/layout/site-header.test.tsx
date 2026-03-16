import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteHeader } from "@/components/layout/site-header";

test("SiteHeader links the app name back to the homepage", () => {
  const markup = renderToStaticMarkup(<SiteHeader />);

  assert.match(markup, /<a[^>]*href="\/"[^>]*>.*devroast.*<\/a>/);
});
