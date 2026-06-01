# Product Requirements Document

## 1. Product Summary

The product is a personal execution PWA for one user. It is designed to replace a loose mix of notes, todo apps, reminders, and mental tracking with one structured daily and weekly system.

The app is intentionally narrow in scope. It is not a full project management suite, not a team collaboration tool, and not a calendar replacement. It is an execution cockpit for a single person who wants to know:

- What should I do today?
- What carries into this week?
- What did I actually finish?
- What slipped and why?
- What should I review before the next week starts?

## 2. Problem Statement

The current planning approach is fragmented. Work, study, DSA prep, and personal tasks are spread across notes, memory, and ad hoc reminders. That causes:

- task drift across days and weeks
- unclear priority between urgent work and long-term goals
- rollover debt that is easy to ignore
- weak review habits
- poor visibility when offline or away from a laptop

## 3. Product Vision

Build a lightweight, structured, offline-first execution system that keeps planning and execution in one place. The app should help the user move from intention to action with minimal friction.

The product should feel more like a daily operating system than a generic todo list.

## 4. Target User

Primary user:

- a single motivated user managing work, study, and self-directed learning
- prefers a quick daily check-in and a weekly reset
- wants local-first reliability
- values structure without heavy setup

Secondary usage patterns:

- DSA / interview prep tracking
- course and study planning
- project task management
- backlog grooming and rollover awareness

## 5. Goals

### User Goals

- Plan the day in under 2 minutes.
- See the week at a glance.
- Keep unfinished work visible instead of hidden.
- Review progress without manual spreadsheet work.
- Use the app offline and trust it later.

### Product Goals

- Be the default place the user opens in the morning.
- Reduce mental load by making task state obvious.
- Support both short daily actions and longer study arcs.
- Make weekly review feel lightweight, not punitive.

## 6. Non-Goals

- multi-user collaboration
- task assignment or team workflows
- full calendar scheduling
- deep project dependency management
- email-style inbox replacement
- social or shared planning features

## 7. Core Concepts

- `Today`: the active execution list for the current day.
- `This Week`: the tactical view for near-term planning.
- `Backlog` or `Vault`: the holding area for future work and ideas.
- `Weekly Review`: the reflection and reset loop.
- `Debt / Rollover`: unfinished work that moves forward.
- `Workstream`: a category such as `Work`, `DSA`, `Study`, or `Personal`.

## 8. MVP Scope

### In Scope

- responsive PWA shell
- local-first data storage
- `Today`, `This Week`, `Backlog`, and `Weekly Review` views
- add, edit, complete, defer, and rollover tasks
- simple tagging or workstream grouping
- daily standup style check-in
- weekly review summary
- offline support
- basic reminders or notifications

### Later

- cloud sync
- multi-device reconciliation
- richer analytics
- smart suggestions
- recurring tasks and templates
- search, filters, and saved views
- optional timer / focus mode

## 9. Success Metrics

- user opens the app at least once per day
- daily planning is completed in less than 2 minutes
- weekly review is completed consistently
- rollover debt is visible and reduced over time
- the app works reliably offline
- the user does not need a second system to track the same work

## 10. Key Constraints

- single-user first
- offline-first architecture
- mobile-first UX with desktop support
- fast startup and low friction
- no dependency on constant network access

## 11. Risks

- scope creep into a full project management system
- too many screens before the core loop works
- rollover logic becoming confusing
- sync conflicts once cloud sync is added
- review features becoming too heavy to use daily

## 12. Open Questions

- Should the app use `Today` as the default landing screen or a daily standup summary?
- Which workstream labels should be fixed in v1?
- How much automation should exist in rollover and weekly review?
- Should notifications be soft reminders only or include forced review prompts?
- Should desktop use a sidebar or a tab-like top rail?