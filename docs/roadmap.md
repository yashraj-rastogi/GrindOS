# Roadmap

## Phase 0: Product Lock-In

Goal:

- turn the chat history into a stable product definition

Deliverables:

- final PRD
- final architecture sketch
- screen list
- MVP boundary
- terminology locked for v1

Exit Criteria:

- no major ambiguity in the core user loop
- the team can describe the product in one paragraph

## Phase 1: MVP Local-First

Goal:

- ship the core daily and weekly execution loop

Deliverables:

- responsive PWA shell
- `Today`, `This Week`, `Backlog`, `Weekly Review`
- add/edit/complete/defer/rollover actions
- local persistence
- offline support
- basic notifications

Exit Criteria:

- the app is usable for daily planning without cloud sync
- the weekly review flow works end to end

## Phase 2: Sync and Reliability

Goal:

- make the app trustworthy across sessions and devices

Deliverables:

- cloud sync
- sync status UI
- conflict handling
- backup / export
- stronger data recovery story

Exit Criteria:

- user can move between devices without losing data
- offline edits resolve cleanly after reconnection

## Phase 3: Review Intelligence

Goal:

- improve insight without turning the app into noise

Deliverables:

- trends and weekly summaries
- rollover analytics
- workstream progress views
- suggested next actions
- smarter weekly review prompts

Exit Criteria:

- the app helps the user notice patterns
- review time becomes shorter and more useful

## Phase 4: Expansion

Goal:

- add optional power features only after the core loop is stable

Possible Deliverables:

- recurring tasks
- templates
- keyboard shortcuts
- advanced search
- calendar integrations
- optional AI assistance for grouping or summarizing

Exit Criteria:

- each new feature increases clarity instead of adding clutter

## Suggested Build Order

1. finalize the data model
2. build the responsive shell
3. implement `Today`
4. implement `This Week`
5. implement rollover and weekly review
6. add offline storage
7. add notifications
8. add sync
9. add analytics and polish