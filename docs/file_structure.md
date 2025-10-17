# File Structure and Module Boundaries

This repo is equal parts receipts and build. The receipts prove the promises; the build fulfills them. The structure keeps those lanes clean so nothing gets “lost in chat.”

## High-level map

```text
/receipts     immutable captures (PDFs, HTML exports)
/plans        living docs (implementation_plan.md, milestones)
/docs         design notes like this file
/app          thin shells for running the UI (web proto, optional iOS wrapper)
/core         engine code that shouldn’t care about skins or events
/integrations BIGO-specific hooks (auth, events, gifts, leaderboard, rebates)
/ui           visual pieces: decks, meters, overlays, themes
/scripts      one-off helpers and tooling