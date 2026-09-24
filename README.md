# dsh-wsl-search

> **语言：** **中文**（本页） · [English](./README.en.md)

WSL 上给 dsh 用的沙箱 **ripgrep** / **fd** / **ast-grep**：`search_rg` / `search_fd` / `search_astgrep`。

默认只允许在 `$HOME` 与 `~/.dsh` 下搜。

## 最短上手

```sh
sudo apt install ripgrep fd-find   # 或等价包名
dsh plugin --profile web add github:173787247/dsh-wsl-search
```

## 工具

| 工具 | 作用 |
|------|------|
| `search_status` | rg/fd/ast-grep 是否可用 |
| `search_rg` | 内容搜索（行数/行长有上限） |
| `search_fd` | 按文件名查找 |
| `search_astgrep` | 结构化模式搜索 |

## 配置

```yaml
config:
  enabled: true
  timeoutMs: 30000
  maxMatches: 50
  maxLineChars: 400
  allowRoots: []           # 空 = 默认 HOME + ~/.dsh
```

需要搜项目目录时，把绝对路径加进 `allowRoots`（不要放开 `/`）。

## 兼容性

| 字段 | 值 |
|------|----|
| **插件** | `dsh-wsl-search` **0.2.0** |
| **最低 dsh** | ≥ **0.1.2**（Web UI 一次性 `?token=`，Windows 中继 `:3081`） |
| **最新验证** | 以 [dsh-wsl-kit 兼容性](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) 为准（当前 **`0.1.7-alpha.2`**）— 套件唯一真源 |
| **套件档位** | 可选（默认不在 `install.sh` / `KIT_SET=daily`） |

## License

MIT
