import assert from "node:assert/strict";
import test from "node:test";

import { createPublicSlug } from "@/server/roasts/create-public-slug";

test("createPublicSlug returns a URL-safe slug", () => {
  const slug = createPublicSlug("typescript");

  assert.match(slug, /^[a-z0-9-]{12,64}$/);
});
