# MVP Screen-by-Screen Flow

## 1. Navigation Model

### Mobile

- bottom tab bar with 4 main tabs
- floating or sticky quick-add action
- single-column content
- drawers or sheets for create and edit actions

### Desktop

- left sidebar or persistent rail
- wider master-detail layout
- task detail panel can appear on the right
- more information visible above the fold

## 2. Screen Inventory

| Screen | Mobile Behavior | Desktop Behavior | Primary Purpose |
| --- | --- | --- | --- |
| `Today` | single-column execution view with sticky actions | two-column focus view with detail panel | daily standup and execution |
| `This Week` | weekly cards or stacked sections | weekly planner grid or split view | tactical planning |
| `Backlog / Vault` | searchable list with filters | denser table or grouped board | future work and ideas |
| `Weekly Review` | guided review cards | review workspace with side summary | reflection and reset |
| `Notification Center` | inbox-like list | panel or dedicated section | reminders and alerts |
| `Settings` | simple settings list | grouped preference layout | app setup and sync |
| `Add / Edit Item` | bottom sheet or full-screen modal | drawer or inline panel | create and update tasks |

## 3. Screen Details

### 3.1 Today

Entry:

- default landing screen after app open

Mobile:

- shows current date, top priorities, and carryovers
- includes quick actions for add, complete, defer, and move
- keeps the current list visible while editing

Desktop:

- shows the execution list on the left
- shows task details or a note panel on the right
- supports drag, reorder, and faster triage

Exit:

- user completes the day or moves items into `This Week` / `Backlog`

### 3.2 This Week

Entry:

- user taps the weekly tab from mobile or desktop navigation

Mobile:

- shows grouped cards for each day or theme
- highlights the next 2 to 5 important actions
- keeps weekly debt visible at the top or bottom

Desktop:

- shows a weekly planning layout with more room for grouped priorities
- supports side-by-side comparison of planned and rolled items

Exit:

- user locks the week's focus or pushes unfinished items into review

### 3.3 Backlog / Vault

Entry:

- used when the user stores future ideas, low-priority work, or reference items

Mobile:

- searchable list with filters and workstream chips

Desktop:

- denser list or grouped board with sorting and bulk actions

Exit:

- user promotes an item into `Today` or `This Week`

### 3.4 Weekly Review

Entry:

- opens from reminder, notification, or weekly tab

Mobile:

- step-by-step review cards
- one action at a time
- finish button at the end of the flow

Desktop:

- review summary on the left
- detailed debt and notes on the right
- better for writing a longer weekly reflection

Exit:

- review is archived and next-week focus is saved

### 3.5 Notification Center

Entry:

- accessed from settings, a bell icon, or review prompts

Mobile:

- simple inbox list of reminders, review prompts, and system notes

Desktop:

- can live as a panel or dedicated inbox page

Exit:

- user clears or acts on reminders

### 3.6 Settings

Entry:

- user wants to change behavior, not tasks

Mobile:

- grouped list of options
- minimal visual weight

Desktop:

- split sections with more descriptive copy

Exit:

- preferences are saved without disrupting the current flow

### 3.7 Add / Edit Item

Entry:

- quick add button, keyboard shortcut, or item edit action

Mobile:

- bottom sheet or full-screen form

Desktop:

- side drawer or inline form

Fields:

- title
- notes
- workstream
- priority
- planned date
- tags
- rollover status

Exit:

- item returns to the source list in updated form

## 4. End-to-End MVP Flow

1. user opens app
2. app lands on `Today`
3. user adds or triages items
4. user switches to `This Week` for planning
5. user pushes future work into `Backlog`
6. user finishes the day and unresolved items become rollover debt
7. user completes `Weekly Review`
8. app resets the next week with clearer focus