# Graph Report - .  (2026-07-04)

## Corpus Check
- Corpus is ~1,296 words - fits in a single context window. You may not need a graph.

## Summary
- 55 nodes · 34 edges · 23 communities (7 shown, 16 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 106,877 input · 71,252 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Package Metadata|Package Metadata]]
- [[_COMMUNITY_NPM Scripts|NPM Scripts]]
- [[_COMMUNITY_Project Identity & Stack|Project Identity & Stack]]
- [[_COMMUNITY_Content Script & Target Site|Content Script & Target Site]]
- [[_COMMUNITY_Counter Demo Component|Counter Demo Component]]
- [[_COMMUNITY_Popup Mount Point|Popup Mount Point]]
- [[_COMMUNITY_Popup Toolbar Page|Popup Toolbar Page]]
- [[_COMMUNITY_Build Commands|Build Commands]]
- [[_COMMUNITY_Dev Commands|Dev Commands]]
- [[_COMMUNITY_TS Config|TS Config]]
- [[_COMMUNITY_TypeScript Logo|TypeScript Logo]]
- [[_COMMUNITY_Extension Icon 128px|Extension Icon 128px]]
- [[_COMMUNITY_Extension Icon 16px|Extension Icon 16px]]
- [[_COMMUNITY_Extension Icon 32px|Extension Icon 32px]]
- [[_COMMUNITY_Extension Icon 48px|Extension Icon 48px]]
- [[_COMMUNITY_Extension Icon 96px|Extension Icon 96px]]
- [[_COMMUNITY_WXT Logo|WXT Logo]]
- [[_COMMUNITY_Counter Component File|Counter Component File]]
- [[_COMMUNITY_Compile Script|Compile Script]]
- [[_COMMUNITY_Zip Script|Zip Script]]

## God Nodes (most connected - your core abstractions)
1. `scripts` - 9 edges
2. `Iuvo (browser extension project)` - 4 edges
3. `entrypoints/content.ts` - 3 edges
4. `setupCounter()` - 2 edges
5. `WXT (extension framework)` - 2 edges
6. `private` - 1 edges
7. `dev` - 1 edges
8. `dev:firefox` - 1 edges
9. `build` - 1 edges
10. `build:firefox` - 1 edges

## Surprising Connections (you probably didn't know these)
- `entrypoints/popup/ (toolbar popup)` --references--> `Default Popup Title`  [INFERRED]
  README.md → entrypoints/popup/index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **WXT extension entrypoints (content, background, popup)** — readme_content_ts, readme_background_ts, readme_popup, entrypoints_popup_index_main_ts [INFERRED 0.85]

## Communities (23 total, 16 thin omitted)

### Community 0 - "Package Metadata"
Cohesion: 0.22
Nodes (8): description, devDependencies, typescript, wxt, name, private, type, version

### Community 1 - "NPM Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, build:firefox, compile, dev, dev:firefox, postinstall, zip (+1 more)

### Community 2 - "Project Identity & Stack"
Cohesion: 0.33
Nodes (6): github.com/nsvecaro/iuvo-enhance (repo), Iuvo (browser extension project), iuvo_architecture_v2.0.docx (architecture/requirements doc), TypeScript, WXT (extension framework), wxt.config.ts

### Community 3 - "Content Script & Target Site"
Cohesion: 0.50
Nodes (4): entrypoints/background.ts, chatgpt.com (target site), entrypoints/content.ts, Prompt-enhancer bubble UI

## Knowledge Gaps
- **40 isolated node(s):** `name`, `description`, `private`, `version`, `type` (+35 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `NPM Scripts` to `Package Metadata`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `name`, `description`, `private` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._