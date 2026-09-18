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

## 快速开始：需求评审标注线框图

安装 `requirement-review-wireframe` 后，将需求文档、现有页面源码或截图提供给 Codex，并输入：

```text
使用 $requirement-review-wireframe，为附件中的需求制作 HTML 评审原型。
保留现有产品布局，按实际涉及的页面组织目录；给变更点添加独立编号标注，
支持点击定位及隐藏／显示标注。交付 HTML 和完整资源，并说明已验证的交互。
```

预期得到可在浏览器打开的评审工作台；业务接口和数据保存不由这个 skill 自动提供。“Figma 风格”描述界面布局，交付格式为 HTML。

![两页需求评审示例：左侧页面目录、中间产品画布、右侧需求标注](skills/product/requirement-review-wireframe/assets/examples/service-settings.png)

查看 [使用与维护指南](skills/product/requirement-review-wireframe/references/usage-and-maintenance.md)，或下载仓库后在浏览器打开 [正式示例 HTML](skills/product/requirement-review-wireframe/assets/examples/service-settings.html)。GitHub 文件页用于查看源码，不直接运行原型。

## 后续更新

1. 在 `skills/<分类>/<skill-name>/` 内新增或修改 skill；目录名与 `SKILL.md` 的 `name` 保持一致。
2. 新增或移动 skill 时更新上面的目录索引；模板、脚本、参考资料跟随所属 skill。
3. 预览草稿、截图草稿、旧版备份留在本地，不混入发布目录。作为正式资源的示例和图片应放在对应 skill 内。
4. 明确暂存需要发布的路径，运行 `python3 scripts/check_layout.py`，再运行所改 skill 的专项检查。
5. 检查暂存差异后提交、推送；GitHub Actions 会检查所有已跟踪文件的分类与目录结构。

根目录仅保留仓库级说明和管理文件。目录检查会在 CI 中报告违规；如需禁止不合规内容合并，还需在 GitHub 分支保护中将 `Check repository layout` 设置为必需检查。
