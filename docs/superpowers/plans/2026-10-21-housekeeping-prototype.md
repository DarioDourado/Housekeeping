# Housekeeping Executable Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one navigable, browser-executable Housekeeping prototype that validates all agreed daily-operation flows using simulated data.

**Architecture:** Extend the existing Next.js client prototype, retaining the present `HousekeepingContext` as the single simulated operational store. Add focused views for operational control, notifications, history, settings and profiles; use local state/storage for drag-and-drop, actions and offline queue simulation.

**Tech Stack:** Next.js, React, TypeScript, existing project CSS and components; browser local storage only.

**Spec:** `C:\Users\ddourado\.codex\attachments\bf5eefe8-6fe2-4ff3-a208-674ad7f297bb\Texto colado.txt`

## Global Constraints

- This is an executable prototype; it must not call OHIP or persist hotel data remotely.
- Simulate a bidirectional sync queue and identify all data as simulated.
- Keep execution actions exclusive to the mobile/team and supervisor flows, never the planning dashboard.
- Cards for both people and rooms remain draggable in planning views.
- Dashboard alerts are visible on room cards; the bell is the notification centre.

## Review Focus

- Dropping a person or room into a different destination must update the in-memory model and visible counts.
- A DND, refusal, OOO or OOS outcome must never be rendered as a completed cleaning task.
- Offline actions must stay visible until a simulated sync outcome is selected.
- Audit events must distinguish executor, device registrar and supervisor.
- A daily distribution must inherit defaults without changing the underlying configuration.

---

### Task 1: Consolidate simulated operational state

**Files:**
- Modify: `types/housekeeping.types.ts`
- Modify: `context/HousekeepingContext.tsx`
- Modify: `config/hotelData.ts`
- Test: `context/HousekeepingContext.test.tsx`

**Interfaces:**
- Produces typed room, task, event, alert, sync-job, block-default and profile records.
- Produces actions for reassigning people/rooms, recording events and updating sync jobs.

- [ ] Write failing tests for reassignment, non-completion outcomes and event attribution.
- [ ] Implement the minimal typed state and actions, seeded from `hotelData.ts`.
- [ ] Verify tests and type-check pass.

### Task 2: Finish daily distribution and team management

**Files:**
- Modify: `app/page.tsx`
- Modify: `UI/components/TaskSheetColumn/TaskSheetColumn.tsx`
- Modify: `UI/components/RoomCard/RoomCard.tsx`
- Modify: `UI/components/TeamManager/BlockTeamRosterBar.tsx`
- Modify: `UI/components/TeamManager/TeamManagerModal.tsx`

- [ ] Test room/person drag-and-drop updates context and room-card alerts render.
- [ ] Implement the integrated roster bar, draggable people/cards and no execution controls in planning.
- [ ] Verify daily defaults can be adjusted without mutating default configuration.

### Task 3: Complete team configuration and settings

**Files:**
- Modify: `UI/components/Configuration/ConfigurationPage.tsx`
- Modify: `UI/components/TeamManager/CollaboratorDirectoryTab.tsx`
- Modify: `types/auth.types.ts`

- [ ] Test rooms are presented as OHIP-imported read-only data, profile/person tables filter correctly and settings tabs render.
- [ ] Implement rooms/OHIP import status, default blocks/sections, person directory, editable access profiles and full task-sheet defaults.
- [ ] Verify the configuration view does not expose manual room creation.

### Task 4: Complete task execution, inspection and operational communications

**Files:**
- Modify: `UI/components/MobileSimulator/MobileView.tsx`
- Modify: `UI/components/Inspection/InspectionReprovalModal.tsx`
- Modify: `UI/components/Chat/ChatDrawer.tsx`
- Create: `UI/components/Notifications/NotificationCentre.tsx`
- Create: `UI/components/Occurrences/OccurrencePanel.tsx`

- [ ] Test completion, DND, refusal, correction, photo occurrence and group/individual message event creation.
- [ ] Implement mobile execution, supervisor approval/rejection, notification bell, scoped messaging and photo placeholders.
- [ ] Verify only valid completion/approval actions queue a PMS status update.

### Task 5: Add history, daily log, sync queue and expanded audit

**Files:**
- Modify: `UI/components/Auditing/AuditingTimeline.tsx`
- Modify: `UI/components/OperaSync/OperaSyncModal.tsx`
- Create: `UI/components/RoomHistory/RoomHistoryPage.tsx`
- Create: `UI/components/DailyLog/DailyLogPage.tsx`

- [ ] Test events retain executor, registrar, supervisor and sync state.
- [ ] Implement room history, daily audit log, offline queue, conflict state and OOO/OOS presentation.
- [ ] Verify the UI distinguishes pending, confirmed and failed sync jobs.

### Task 6: Complete turndown, refresh and reporting prototype flows

**Files:**
- Modify: `UI/components/Turndown/TurndownView.tsx`
- Modify: `UI/components/CreditsStats/CreditsStatsModal.tsx`
- Modify: `lang/pt.json`
- Modify: `lang/en.json`

- [ ] Test turndown remains independent, refresh has a separate task cycle and reports group by team/type/service.
- [ ] Implement inspection-policy placeholders, exceptions, expanded reports and future-credit labels.
- [ ] Run `bun run lint` and `bun run build`.

