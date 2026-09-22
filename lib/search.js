import { spawn } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

export function whichSimple(cmd) {
  const safe = String(cmd || "").replace(/[^a-zA-Z0-9._+-]/g, "");
  if (!safe) return Promise.resolve("");
  return new Promise((resolvePromise) => {
    const child = spawn("bash", ["-lc", `command -v ${safe}`], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("close", (c) => resolvePromise(c === 0 ? out.trim() : ""));
  });
}

function defaultRoots() {
  const home = homedir();
  return [home, resolve(home, ".dsh")].filter((p) => existsSync(p));
}

export function resolveRoot(root, allowRoots = []) {
  const abs = resolve(String(root || "").trim() || ".");
  const real = existsSync(abs) ? realpathSync(abs) : abs;
  const roots = (allowRoots.length ? allowRoots : defaultRoots()).map((r) => {
    const a = resolve(r);
    return existsSync(a) ? realpathSync(a) : a;
  });
  const ok = roots.some((r) => isUnderRoot(real, r));
  if (!ok) throw new Error(`search root outside allowRoots: ${real}`);
  return real;
}

function isUnderRoot(real, root) {
  const r = root.replace(/[/\\]+$/, "");
  if (process.platform === "win32") {
    const a = real.toLowerCase();
    const b = r.toLowerCase();
    return a === b || a.startsWith(b + "\\") || a.startsWith(b + "/");
  }
  return real === r || real.startsWith(r + "/");
}

export function run(bin, args, timeoutMs) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const t = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("search timeout"));
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += d;
      if (stdout.length > 2_000_000) child.kill("SIGKILL");
    });
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => {
      clearTimeout(t);
      resolvePromise({ code, stdout, stderr });
    });
    child.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function rgSearch({ pattern, root, glob, maxMatches = 50, maxLineChars = 400, allowRoots, timeoutMs = 30_000 }) {
  const dir = resolveRoot(root, allowRoots);
  const pat = String(pattern || "").trim();
  if (!pat) throw new Error("pattern required");
  if (pat.length > 500) throw new Error("pattern too long");
  const bin = (await whichSimple("rg")) || "rg";
  const args = ["--json", "--max-count", String(maxMatches), "-n", "--no-heading", "--", pat, dir];
  if (glob) {
    args.splice(4, 0, "--glob", String(glob));
  }
  const { code, stdout, stderr } = await run(bin, args, timeoutMs);
  if (code !== 0 && code !== 1) throw new Error(`rg failed: ${stderr || code}`);
  const matches = [];
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;
    try {
      const ev = JSON.parse(line);
      if (ev.type !== "match") continue;
      matches.push({
        path: ev.data?.path?.text,
        line: ev.data?.line_number,
        text: String(ev.data?.lines?.text || "").trimEnd().slice(0, maxLineChars),
      });
      if (matches.length >= maxMatches) break;
    } catch {
      /* ignore */
    }
  }
  return { ok: true, root: dir, count: matches.length, matches };
}

export async function fdSearch({ name, root, maxMatches = 50, allowRoots, timeoutMs = 30_000 }) {
  const dir = resolveRoot(root, allowRoots);
  const q = String(name || "").trim();
  if (!q) throw new Error("name required");
  const bin = (await whichSimple("fd")) || (await whichSimple("fdfind")) || "fd";
  const args = ["--max-results", String(maxMatches), "--", q, dir];
  const { code, stdout, stderr } = await run(bin, args, timeoutMs);
  if (code !== 0 && code !== 1) throw new Error(`fd failed: ${stderr || code}`);
  const paths = stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxMatches);
  return { ok: true, root: dir, count: paths.length, paths };
}

export async function searchStatus() {
  return {
    ok: true,
    rg: (await whichSimple("rg")) || null,
    fd: (await whichSimple("fd")) || (await whichSimple("fdfind")) || null,
    astGrep: (await whichSimple("ast-grep")) || (await whichSimple("sg")) || null,
  };
}

export async function astGrepSearch({ pattern, root, lang, maxMatches = 50, allowRoots, timeoutMs = 30_000 }) {
  const dir = resolveRoot(root, allowRoots);
  const pat = String(pattern || "").trim();
  if (!pat) throw new Error("pattern required");
  if (pat.length > 500) throw new Error("pattern too long");
  const bin = (await whichSimple("ast-grep")) || (await whichSimple("sg")) || "ast-grep";
  const args = ["run", "--pattern", pat, "--json=stream", dir];
  if (lang) {
    const l = String(lang).replace(/[^a-zA-Z0-9_+-]/g, "");
    if (l) args.splice(1, 0, "--lang", l);
  }
  const { code, stdout, stderr } = await run(bin, args, timeoutMs);
  if (code !== 0 && code !== 1) throw new Error(`ast-grep failed: ${stderr || code}`);
  const matches = [];
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;
    try {
      const ev = JSON.parse(line);
      const file = ev.file || ev.path || ev.paths?.[0];
      const range = ev.range || ev.ranges?.[0];
      matches.push({
        path: file,
        line: range?.start?.line ?? ev.line,
        text: String(ev.text || ev.lines || "").trimEnd().slice(0, 400),
      });
      if (matches.length >= maxMatches) break;
    } catch {
      /* ignore */
    }
  }
  return { ok: true, root: dir, count: matches.length, matches };
}
