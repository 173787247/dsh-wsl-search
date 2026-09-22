import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveRoot } from "../lib/search.js";
import { homedir } from "node:os";

describe("resolveRoot", () => {
  it("allows home", () => {
    const r = resolveRoot(homedir(), [homedir()]);
    assert.ok(r);
  });
  it("rejects /etc", () => {
    assert.throws(() => resolveRoot("/etc", [homedir()]), /outside/);
  });
});
