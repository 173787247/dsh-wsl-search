# dsh-wsl-search

> **Languages:** [中文（首页）](./README.md) · **English** (this file)

Sandboxed **ripgrep** / **fd** / **ast-grep** for dsh on WSL: `search_rg` / `search_fd` / `search_astgrep`.

Default roots: `$HOME` and `~/.dsh` only.

## Quick start

```sh
sudo apt install ripgrep fd-find   # or equivalent package names
dsh plugin --profile web add github:173787247/dsh-wsl-search
```

Install `ast-grep` separately if you need `search_astgrep`.

## Tools

| Tool | Role |
|------|------|
| `search_status` | rg / fd / ast-grep on PATH + allowRoots |
| `search_rg` | Content search (capped matches / line length) |
| `search_fd` | Filename find |
| `search_astgrep` | Structural pattern search |

## Config

```yaml
config:
  enabled: true
  timeoutMs: 30000
  maxMatches: 50
  maxLineChars: 400
  allowRoots: []           # empty = HOME + ~/.dsh
```

Add absolute project paths to `allowRoots` when needed (do not open `/`).

## Compatibility

| Field | Value |
|-------|-------|
| **Plugin** | `dsh-wsl-search` **0.2.0** |
| **Minimum dsh** | ≥ **0.1.2** (web UI one-shot `?token=` on Windows relay `:3081`) |
| **Latest verified** | See [dsh-wsl-kit Compatibility](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) (currently **`0.1.7-alpha.2`**) — single source of truth for the suite |
| **Kit set** | optional (not in `install.sh` / `KIT_SET=daily` by default) |

## License

MIT
