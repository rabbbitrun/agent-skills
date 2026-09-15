# Agent Skills

个人可复用的 Codex skills，按用途分类管理。每个 skill 使用独立目录，更新时在原目录修改。

## 目录规则

```text
skills/<分类>/<skill-name>/
├── SKILL.md
├── agents/       # 可选：界面配置
├── assets/       # 可选：模板与静态资源
├── scripts/      # 可选：辅助脚本和验证
└── references/   # 可选：参考文档
```

| 分类 | 内容 |
| --- | --- |
| `product` | 需求、原型、评审、产品流程 |
| `design` | 视觉设计、设计系统、交互设计 |
| `engineering` | 开发、测试、代码审查、运维 |
| `data` | 数据分析、报表、指标 |
| `productivity` | 个人工作流、文档与效率工具 |

一个 skill 只放在最贴近主要用途的分类中，不跨分类复制。新增分类时同步修改目录校验脚本和本表。

## Skills 目录

| Skill | 分类 | 用途 |
| --- | --- | --- |
| [requirement-review-wireframe](skills/product/requirement-review-wireframe/SKILL.md) | `product` | Figma 风格的需求标注工作台；支持单页、多页、超过 20 页的目录搜索，以及显示／隐藏标注 |

## 安装

将需要的整个 skill 目录复制到 Codex 的 skills 目录；不要复制上层分类目录。安装路径通常为 `~/.codex/skills/<skill-name>/`，设置了 `CODEX_HOME` 时使用 `$CODEX_HOME/skills/<skill-name>/`。更新前备份已有同名目录。

## 后续更新

1. 在 `skills/<分类>/<skill-name>/` 内新增或修改 skill；目录名与 `SKILL.md` 的 `name` 保持一致。
2. 新增或移动 skill 时更新上面的目录索引；模板、脚本、参考资料跟随所属 skill。
3. 预览草稿、截图草稿、旧版备份留在本地，不混入发布目录。作为正式资源的示例和图片应放在对应 skill 内。
4. 明确暂存需要发布的路径，运行 `python3 scripts/check_layout.py`，再运行所改 skill 的专项检查。
5. 检查暂存差异后提交、推送；GitHub Actions 会检查所有已跟踪文件的分类与目录结构。

根目录仅保留仓库级说明和管理文件。目录检查会在 CI 中报告违规；如需禁止不合规内容合并，还需在 GitHub 分支保护中将 `Check repository layout` 设置为必需检查。
