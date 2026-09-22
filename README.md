# dsh-wsl-search

Sandboxed **ripgrep** / **fd** for dsh on WSL. Default roots: `$HOME` and `~/.dsh`.

[中文 → README.zh.md](./README.zh.md)

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-search
```

## Tools

| Tool | Role |
|------|------|
| `search_status` | rg/fd availability + allowRoots |
| `search_rg` | Content search |
| `search_fd` | Filename find |

Add project paths via `allowRoots` in plugin config (do not open `/`).

## License

MIT
