# File Structure and Module Boundaries

This repo now hosts the working prototype plus a handful of reference artifacts. Earlier drafts of this document claimed there
were `/receipts` and `/plans` directories, but those folders have not been checked in yet. The assets that were meant to live
there currently sit at the repository root (`Claude_1760412342467.pdf` for the signed receipt and `implementation_plan` as an
empty stub). Until those folders exist, contributors can rely on the structure captured below.

## High-level map (as of the current commit)

```text
.
├── Claude_1760412342467.pdf    # externally generated receipt PDF
├── GETTING_STARTED.md          # onboarding narrative for DJs
├── QUICKSTART.md               # condensed setup steps
├── README / README.html        # project overview in text + rendered HTML
├── app/                        # source code for the prototype
│   ├── ai/                     # recommendation helpers (e.g., track suggestions)
│   ├── core/                   # engine logic; has audio/, library/, mixing/, safety/, session/, streaming/ submodules
│   ├── data/                   # static seeds like `demoTracks.js`
│   ├── integrations/           # third-party hooks (currently Spotify)
│   ├── ui/                     # reusable UI components and tutorials
│   └── web/                    # runnable web shells (`debug/`, `dj-mixer/`)
├── config.js                   # build/runtime configuration shared by the web shells
├── docs/                       # design notes such as this file
├── implementation_plan         # placeholder for the future living plan (currently empty)
├── index.html                  # landing page used by the prototype build
└── main.js                     # entry point script referenced by index.html
```

## Where to put receipts and plans

* **Receipts:** For now, the PDF at the repository root is the only immutable receipt. When more evidence bundles are produced,
  create `receipts/` and drop each artifact into a dated subfolder so we can cross-reference from PRs.
* **Plans:** The `implementation_plan` file should eventually become `plans/implementation_plan.md` (or similar). Until that
  folder shows up, keep short-term delivery notes in `GETTING_STARTED.md` or the PR descriptions so new contributors know what
  changed recently.

## Working inside `app/`

* **Core-first architecture:** `app/core` should stay UI-agnostic. Anything that touches DOM or streaming UI chrome belongs under
  `app/ui` or the specific `app/web/*` shell.
* **Integrations remain optional:** External hooks such as Spotify live under `app/integrations`. When adding a new service,
  isolate the API client there and only surface typed hooks to `app/core`.
* **Web shells mirror modes:** `app/web/debug` is meant for fast iteration while `app/web/dj-mixer` is the production-ready demo.
  Keep assets (HTML/CSS/JS) scoped per shell so deployments can pick only what they need.

Keeping this document in sync with `ls` output prevents confusion about where receipts and living plans actually reside. When new
folders are added, please update this map in the same commit.
