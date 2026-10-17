import test from "node:test";
import assert from "node:assert/strict";
import {
  checkDeployment,
  releaseURL,
  cleanReleaseMarker,
} from "./deployment.js";
test("checks a fresh manifest with no-store, validates SHA and never trusts arbitrary URLs", async () => {
  let args;
  const sha = "2".repeat(40);
  assert.equal(
    await checkDeployment({
      base: "/Blue-Green/",
      sha: "1".repeat(40),
      fetcher: async (...a) => {
        args = a;
        return { ok: true, json: async () => ({ schema: 1, sha }) };
      },
    }),
    sha,
  );
  assert.match(args[0], /^\/Blue-Green\/version.json\?check=/);
  assert.equal(args[1].cache, "no-store");
  assert.equal(
    await checkDeployment({
      base: "/Blue-Green/",
      sha,
      fetcher: async () => ({
        ok: true,
        json: async () => ({ schema: 1, sha: "https://evil.example" }),
      }),
    }),
    null,
  );
});
test("update URL respects base and cleans only its own marker", () => {
  const location = {
    origin: "https://example.github.io",
    href: "https://example.github.io/Blue-Green/?__bluegreen_update=abc&other=yes#lab",
  };
  const url = releaseURL("/Blue-Green/", "a".repeat(40), location);
  assert.equal(url.pathname, "/Blue-Green/");
  let replacement;
  cleanReleaseMarker(location, {
    state: { step: 2 },
    replaceState: (_, __, v) => (replacement = v),
  });
  assert.equal(replacement, "/Blue-Green/?other=yes#lab");
});
