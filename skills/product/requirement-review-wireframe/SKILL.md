---
name: requirement-review-wireframe
description: Create or revise HTML requirement wireframes with a separate, traceable review annotation layer. Use for annotated prototypes, requirement review pages, PRD companion pages, or requests to keep annotations distinct from product UI, including “需求线框图”“需求注释”“需求标注”“原型评审页”. Supports single-page and multi-page review workspaces.
---

# 需求评审标注线框图 · Requirement Review Wireframe

为产品、设计和研发评审生成可在浏览器打开的 HTML 原型：产品界面放在画布中，需求说明放在独立标注区，通过稳定编号双向定位。支持单页、多页目录、搜索和隐藏／显示标注。

- **适用场景**：需求线框图、带变更说明的原型、PRD 配套评审页，以及为已有 HTML 增加评审标注。
- **需要提供**：需求规则、涉及的页面，以及可用的源码、截图或设计规范；已有需求编号和来源应一并提供。缺少资料时说明推断，不编造已确认规则。
- **交付内容**：HTML 与引用的 CSS/JS；需要单文件时可内联资源。支持评审层交互，真实业务接口和保存功能需另行实现。
- **使用边界**：“Figma 风格”指界面布局，不会创建 Figma 文件；不提供多人评论、账号或云端同步。切页保留当前输入不等于刷新后持久化。

首次安装、使用指令、正式示例、依赖准备与更新说明见 [使用与维护指南](references/usage-and-maintenance.md)。可直接查看 [两页正式示例](assets/examples/service-settings.html)；它演示资源接入，不规定实际需求的页面或字段。

以下规范用于生成和修改交付物。

Create requirement prototypes using the approved **Figma-like review workspace**: a compact project bar, searchable page directory, neutral gray canvas with a white product artboard, and a separate annotation inspector. Preserve the product's existing UI inside the artboard.

## Workflow

1. Inspect the requirements, existing product pages/screenshots, and product styles. Identify the subject, audience, and review goal.
2. Copy `assets/wireframe-template.html`, `assets/requirement-review.css`, `assets/requirement-review.js`, and `assets/requirement-workspace.js` into the deliverable directory. Replace all `{{...}}` placeholders and sample product content.
3. Add a product `<template>` for each real page and define `window.requirementPages` using the contract below. Create only pages supported by the brief; never copy the 24-page clinic demonstration or invent counts.
4. Retain product-specific markup, CSS, and interactions outside the shared review assets. For an existing prototype, adapt its review layer without restructuring unrelated product UI.
5. Assign stable requirement IDs such as `R1-01`. Keep accepted IDs stable; append new ones instead of renumbering. Put compact ID pins on the product canvas, with explanations in the inspector.
6. Render and inspect the finished page, then verify the interactions in the delivery checklist. Updating shared templates does not update previously delivered HTML automatically.

## Approved visual direction

- Use the supplied workbench as the default, rather than the earlier A/B/C concept gallery. Do not deliver proposal headings, comparison links, style selectors, or sample-data banners as part of a real requirement page.
- Keep the header compact. Use a neutral page tree on the left, a gray canvas with modest spacing around the white product artboard, and a white inspector on the right. Avoid large marketing headings, repeated toolbars, purple panel backgrounds, or nested decorative cards.
- Reserve the muted review accent (`--req-accent`, default `#7955d8`) for pins, selection outlines, and active annotation details. Do not recolor product fields or rows. If this accent conflicts with the product, change the review accent and its companion tokens together; keep explanatory text color-neutral.
- Use small ID chips and thin target outlines. Separate unselected notes with whitespace and fine rules; give only the selected note a light accent border/background. Keep rule text readable; do not shrink business UI to fit more review panels.
- Desktop regions scroll independently. The page directory collapses to an overlay at narrower widths; the inspector stacks below the artboard on small screens. Retain keyboard focus visibility and reduced-motion support.

## Page and annotation data

Define configuration before loading the scripts. Each `templateId` refers to a real `<template>` in the document:

```html
<template id="page-clinics">
  <section class="product-page">
    <div class="req-target" data-requirement="R1-01">
      <label>服务版本<select id="clinics-version"><option>全部版本</option></select></label>
      <button type="button" class="req-pin" aria-label="查看 R1-01 标注">R1-01</button>
    </div>
  </section>
</template>
<script>
window.requirementPages = [{
  id: 'clinics',
  title: '诊所列表',
  group: '诊所管理',
  templateId: 'page-clinics',
  notes: [{
    id: 'R1-01',
    type: '新增字段',
    title: '按服务版本筛选诊所',
    body: '默认显示全部版本，切换版本后返回列表第一页。',
    source: '需求文档 § 2.1'
  }]
}];
</script>
<script src="requirement-review.js"></script>
<script src="requirement-workspace.js"></script>
```

The clinic above is a schema example, not a mandatory product. Use actual requirement content.

- Page fields: unique `id`, `title`, `templateId`, optional `group`, and `notes` (an empty array is allowed).
- Note fields: globally unique `id`, one type label, an action-oriented `title`, and concrete `body`. Optional `source` links the ID to a real requirement section; do not fabricate a citation. Optional `surface` identifies a modal/drawer to open. All note text is rendered as plain text, not HTML.
- Allowed types: `新增字段`, `调整字段`, `新增入口`, `交互规则`, `权限控制`, `数据兼容`, `接口约束`. Add acceptance detail only when it clarifies implementation.
- Each pin's containing `.req-target` uses the same `data-requirement` ID as its note. One note may have repeated targets, but each ID has exactly one note across all pages.
- Page IDs and template IDs must be unique. All pages mount once and are then hidden/shown, so business DOM IDs must also be unique across the document. Do not put initialization scripts inside templates; initialize business controls **after** `requirement-workspace.js`, when the page DOM exists. Switching pages preserves input values and attached handlers.
- Business navigation may use `data-go-page="page-id"` on a button or call `window.openRequirementPage(pageId)`. Keep business button labels free of review terminology.

## Single-page and multi-page behavior

A single configured page automatically omits the directory, page stepper, and annotation-scope switch. Do not add empty navigation just to match a screenshot.

For multiple pages, use natural module groups and the searchable tree. Search matches page names, page positions, IDs, and annotation text. Counts are computed from actual configuration. In 20+ page projects, retain the grouped tree; do not create a long row of tabs. Show the current page and previous/next controls, and support both current-page notes and all notes grouped into collapsible page sections. Cross-page note selection opens its page and focuses the target. Page changes retain the current hidden/visible annotation state.

## Visibility and interaction contract

- Keep the visibility toggle in the persistent toolbar, outside any hidden container. The same visible `type="button"` control alternates between “隐藏标注” and “显示标注”, with `aria-expanded` and `aria-controls` synchronized on initialization and every toggle.
- Clean mode hides pins, target highlights, and the inspector, then expands the canvas. Keep page navigation and the restore control reachable.
- Clicking a pin scrolls to and focuses its matching note; clicking a note opens its page/surface and focuses the target's pin. Hidden page sections must not remain keyboard-focusable.
- All review buttons use `type="button"`. Pins belong in non-interactive wrappers next to business controls, never inside buttons or links. If a parent business card has a click action, exclude `.req-pin` clicks from that action.
- For a modal/drawer, set the note's `surface` and implement `window.openRequirementSurface(surfaceId)` before the shared scripts. Return only once the target is visible; asynchronous opening must return a Promise. The core script waits for it and supports dynamically inserted pins.
- Product surfaces own closing, Escape behavior, focus containment, and return focus. If a native modal makes the outside inspector inert, provide an accessible review location within the modal or a product-owned close-and-return path; do not break the modal's focus trap merely to focus the outside inspector.

## Hard boundaries

Do not put “新增”“变更”“需求说明” in real business labels, headers, or buttons. Do not tint complete rows/cells to signal a change or use product success/warning/error/action colors as review semantics. Keep long review prose off the product canvas. Never present review navigation as real product navigation, and do not change adjacent product content to make annotation placement easier.

Shared styles use the `req-` prefix. Avoid generic element resets that override product typography, links, disabled states, or focus styling. Keep product CSS in the delivered page or its own stylesheet.

## Delivery and verification

Deliver the annotated HTML together with all referenced assets. Preserve the source requirement document when provided. If a single-file deliverable is requested, inline the CSS and scripts while preserving their load order.

Check at desktop width, 1100 px, and a phone width (for example 375 px):

- Hide → show → hide without reload; restore action stays visible and keyboard-operable, hidden pins leave the tab order, and the canvas uses the released space.
- Pin → note → target with pointer and keyboard; each note maps to a visible or openable target. Review controls never submit business forms.
- For multiple pages: directory search and no-results recovery, cross-page note selection, collapsed groups, first/last page controls, preserved input values, and clean-mode navigation.
- For pages with modals/drawers: asynchronous opening, Escape, focus containment, and return focus.
- Inspect the actual rendering for clipped pins, unreadable text, unwanted horizontal overflow, and accidental product-style changes. A screenshot alone does not verify interactions.

When editing shared assets, run `node scripts/check-interactions.cjs` from the skill directory with Playwright and Chromium available (`NODE_PATH` may point to the environment's bundled packages). The suite covers the reusable shell at one, three, and 24 pages; separately validate the actual delivered product prototype.

For dependency setup, the test coverage boundary, and checks after changing the published example, see [使用与维护指南](references/usage-and-maintenance.md#维护与验证).

## Assets

- `assets/wireframe-template.html`: neutral workbench shell, sample product template, and page-data example.
- `assets/requirement-review.css`: approved V2 review styling, isolated from product styles.
- `assets/requirement-review.js`: hide/show, pin/note focus, page/surface opening, and dynamic-pin support; usable independently on an existing annotated page.
- `assets/requirement-workspace.js`: optional workbench runtime for configured pages, directory search, grouped notes, counts, and state-preserving navigation.
