# Updated Project Draft

## Working Title

Execution Tracker PWA

## One-Line Pitch

A mobile-first, offline-first personal execution app that helps one user plan the day, manage the week, track rollover debt, and run a simple weekly review loop without losing context.

## Project Thesis

The app is not trying to be a general-purpose project management suite. It is trying to become the one place the user opens each morning to answer three questions:

- What matters today?
- What needs to stay visible this week?
- What should roll forward instead of disappearing?

The product should feel like a small operating system for execution, not a giant task database.

## What the App Must Do

- open on `Today` by default
- surface the current date and top priorities immediately
- support a `This Week` tactical view
- keep a `Backlog` or `Vault` for future work
- show rollover debt clearly
- support a weekly review loop
- work offline first
- sync later when cloud support is added

## Primary Use Cases

- daily work planning
- weekly prioritization
- study and learning sessions
- DSA / interview prep tracking
- backlog grooming
- review and reflection

## Guiding Principles

- reduce friction before adding intelligence
- keep the core flow visible and simple
- make rollover visible instead of hidden
- keep mobile as the primary experience
- make desktop richer, not different
- add automation only after the base loop is stable

## First Release Shape

- `Today` as the landing screen
- `This Week` for tactical planning
- `Backlog / Vault` for future items
- `Weekly Review` for weekly reset and reflection
- `Notification Center` for reminders and review prompts
- local-first persistence
- responsive mobile and desktop layouts

## Explicitly Not In v1

- team collaboration
- calendars and scheduling as the source of truth
- complex project hierarchies
- deep dependency graphs
- social or shared planning
- heavyweight analytics

## Expected Evolution

1. lock the local-first core loop
2. make review and rollover feel natural
3. add sync and recovery
4. add insight and trends
5. add optional advanced features only if they stay out of the way

