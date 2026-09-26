import { rgSearch, fdSearch, searchStatus, astGrepSearch } from "./lib/search.js";

export const name = "dsh-wsl-search";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  if (config.enabled === false) {
    console.log("[dsh-wsl-search] disabled");
    return;
  }
  const timeoutMs = positive(config.timeoutMs, 30_000);
  const maxMatches = positive(config.maxMatches, 50);
  const maxLineChars = positive(config.maxLineChars, 400);
  const allowRoots = Array.isArray(config.allowRoots) ? config.allowRoots.map(String) : [];
  console.log(`[dsh-wsl-search] maxMatches=${maxMatches}`);

  ctx.systemPrompt.section({
    name: "tool:search",
    order: 130,
    text: "dsh-wsl-search runs sandboxed ripgrep/fd/ast-grep under allowlisted roots (default: $HOME, ~/.dsh, and ~/.dsh/im-workspace). Do not search all of /mnt/c. Prefer search_rg for text, search_fd for filenames, search_astgrep for structural patterns.",
  });

  const base = { allowRoots, timeoutMs, maxMatches, maxLineChars };

  ctx.tools.register({
    name: "search_status",
    description: "Whether rg/fd/ast-grep are on PATH.",
    parameters: { type: "object", additionalProperties: false, properties: {} },
    output: { schema: { type: "object", additionalProperties: true }, render: (_a, v) => [{ type: "text", text: JSON.stringify(v) }] },
    timeoutMs: 5_000,
    isConcurrencySafe: () => true,
    async execute() {
      return searchStatus();
    },
    presentCall: () => ({ card: "generic", title: "Search status" }),
    presentResult: (_a, r) => ({ card: "generic", title: "Search status", content: r.content }),
  });

  ctx.tools.register({
    name: "search_rg",
    description: "ripgrep content search under an allowlisted root. Caps match count and line length.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["pattern", "root"],
      properties: {
        pattern: { type: "string" },
        root: { type: "string", description: "Directory under allowRoots" },
        glob: { type: "string" },
      },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [
        {
          type: "text",
          text:
            v.ok === false
              ? v.error
              : [`search_rg count=${v.count} root=${v.root}`, ...(v.matches || []).map((m) => `${m.path}:${m.line}:${m.text}`)].join(
                  "\n",
                ),
        },
      ],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await rgSearch({ ...base, ...args });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "rg" }),
    presentResult: (_a, r) => ({ card: "generic", title: "rg", content: r.content }),
  });

  ctx.tools.register({
    name: "search_fd",
    description: "fd filename search under an allowlisted root.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["name", "root"],
      properties: {
        name: { type: "string" },
        root: { type: "string" },
      },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [
        {
          type: "text",
          text: v.ok === false ? v.error : [`search_fd count=${v.count}`, ...(v.paths || [])].join("\n"),
        },
      ],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await fdSearch({ ...base, ...args });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "fd" }),
    presentResult: (_a, r) => ({ card: "generic", title: "fd", content: r.content }),
  });

  ctx.tools.register({
    name: "search_astgrep",
    description: "ast-grep structural search under an allowlisted root. Caps match count.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["pattern", "root"],
      properties: {
        pattern: { type: "string", description: "ast-grep pattern" },
        root: { type: "string" },
        lang: { type: "string", description: "Optional language, e.g. ts, py, go" },
      },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [
        {
          type: "text",
          text:
            v.ok === false
              ? v.error
              : [`search_astgrep count=${v.count} root=${v.root}`, ...(v.matches || []).map((m) => `${m.path}:${m.line}:${m.text}`)].join(
                  "\n",
                ),
        },
      ],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await astGrepSearch({ ...base, ...args });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "ast-grep" }),
    presentResult: (_a, r) => ({ card: "generic", title: "ast-grep", content: r.content }),
  });
}

function positive(v, fb) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fb;
}
