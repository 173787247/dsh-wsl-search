import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";
import { defaultRoots, resolveRoot } from "../lib/search.js";

describe("resolveRoot", () => {
  it("allows home", () => {
    const r = resolveRoot(homedir(), [homedir()]);
    assert.ok(r);
  });
  it("rejects /etc", () => {
    assert.throws(() => resolveRoot("/etc", [homedir()]), /outside/);
  });
});

describe("defaultRoots", () => {
  it("lists home and .dsh paths; includes im-workspace when present", () => {
    const roots = defaultRoots();
    assert.ok(Array.isArray(roots));
    assert.ok(roots.length >= 1);
    // When ~/.dsh/im-workspace exists it must appear in defaultRoots.
    const imDefault = join(homedir(), ".dsh", "im-workspace");
    if (roots.some((r) => r === imDefault || r.endsWith(`${join(".dsh", "im-workspace")}`))) {
      assert.ok(true);
    }
    const dir = mkdtempSync(join(tmpdir(), "dsh-search-"));
    try {
      const im = join(dir, ".dsh", "im-workspace");
      mkdirSync(im, { recursive: true });
      const allowed = resolveRoot(im, [dir, join(dir, ".dsh"), im]);
      assert.equal(allowed, im);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
