# Tasks: Ant Design Restaurant Visual Upgrade

**Input**: Design documents from `/specs/001-ant-design-restaurant-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare global theme, assets, telemetry, and documentation scaffolding required by all user stories.

- [X] T001 Update Ant Design theme tokens & ConfigProvider overrides for dark+gold density limits in `src/styles/theme-tokens.ts` and `src/app/providers/AntdProvider.ts`.
- [X] T002 Refresh global typography/background spacing + responsive helpers to enforce FR-013 in `src/styles/global.css` and `src/components/layout/PageShell.vue`.
- [X] T003 Create visual QA doc scaffold with screenshot + Lighthouse checklist at `docs/ui-validation/001-ant-design-restaurant-ui/README.md`.
- [X] T004 Extend telemetry event union and default tracker to cover reservation/admin lifecycle events in `src/utils/telemetry.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, stores, router guards, and composables needed before any story can ship.

- [X] T005 Define Reservation, AvailabilitySlot, TableBucket, RestaurantAdmin, ReservationFormState, ReservationAuditEvent interfaces in `src/types/reservation.ts` and update existing type modules (e.g., `src/types/restaurant.ts`) to consume them.
- [X] T006 Implement REST clients for availability/reservation/admin endpoints in `src/services/api/availability.api.ts`, `src/services/api/reservations.api.ts`, and `src/services/api/admin.api.ts` with Axios + typed envelopes.
- [X] T007 Scaffold Pinia stores for reservations/admin roles at `src/stores/reservations.store.ts` and `src/stores/admin.store.ts` (state, getters, telemetry hooks, placeholder actions).
- [X] T008 [P] Provide composables wrapping the new stores in `src/composables/useReservations.ts` and `src/composables/useAdminScheduling.ts` (input validation, state exposure).
- [X] T009 Harden router guards and route shells for reservations/admin areas in `src/router/index.ts` and `src/router/guards.ts`, introducing admin-role detection + permission-denied redirect stubs.

---

## Phase 3: User Story 1 - 視覺一致的登入/列表/詳情 (Priority: P1) 🎯 MVP

**Goal**: Apply Ant Design dark+gold theme to Login, Restaurants List, and Restaurant Detail so layout, typography, and interactions are consistent without breaking existing flows.

**Independent Test**: Render Login, List, Detail pages, verifying Ant Design components drive forms/cards, spacing stays within 16–24px, and flows remain functional.

### Implementation

- [X] T010 [US1] Rebuild `src/pages/auth/LoginPage.vue` with Ant Design Form/Button/Input, error states, and gold CTA while preserving auth logic.
- [X] T011 [P] [US1] Lay out `src/pages/restaurants/RestaurantsListPage.vue` using `PageShell` + Ant Design grid/pagination, wiring RequestState + Pinia data.
- [X] T012 [P] [US1] Refine `src/components/restaurants/RestaurantListItem.vue` (and related styles) for card gradients, typography, CTA placement, and hero image slot.
- [X] T013 [US1] Update `src/pages/restaurants/RestaurantDetailPage.vue` and `src/components/restaurants/info/IconLabelPair.vue` to use Ant Design Descriptions/Tabs plus consistent spacing.
- [X] T014 [P] [US1] Refresh component visual tests in `tests/component/login-page.visual.spec.ts`, `tests/component/restaurants-list-page.spec.ts`, and `tests/component/restaurant-detail-page.spec.ts` with new snapshots + assertions.

**Checkpoint**: Login, list, detail share the same theme and pass component tests.

---

## Phase 4: User Story 4 - 完成訂位流程 (Priority: P1)

**Goal**: Allow customers to pick date/party size, view availability, submit reservations, and see success/sold-out messaging with telemetry.

**Independent Test**: Simulate `/restaurants/{id}/availability`, `/availability/detail`, `/reservations` responses for success, `sold_out`, `already_reserved_this_restaurant`, and network errors; confirm UI reflects each state.

### Implementation

- [X] T015 [US4] Implement availability + booking actions in `src/stores/reservations.store.ts` (loading flags, sold_out handling, telemetry events, retries).
- [X] T016 [P] [US4] Build booking widgets (`src/components/reservations/AvailabilityGrid.vue`, `src/components/reservations/ReservationForm.vue`) covering Steps UI, slot selection, and fallback suggestions.
- [X] T017 [US4] Integrate booking components into `src/pages/restaurants/RestaurantDetailPage.vue` and add a dedicated entry page `src/pages/reservations/ReservationFlowPage.vue` with router wiring.
- [X] T018 [P] [US4] Fire reservation telemetry + audit payloads inside `src/stores/reservations.store.ts` and `src/utils/telemetry.ts` for start/success/error branches.
- [X] T019 [P] [US4] Add unit/component tests for availability + booking flows in `tests/unit/reservations.store.spec.ts` and `tests/component/reservation-flow.spec.ts` (success, sold_out, timeout, permission).

**Checkpoint**: Customers can complete booking with clear messaging, and tests cover major scenarios.

---

## Phase 5: User Story 6 - 管理員 dashboard 掌握預約/席次 (Priority: P1)

**Goal**: Provide a protected admin dashboard showing per-timeslot capacity, reservation lists, and filters leveraging Ant Design cards/tables.

**Independent Test**: Mock `/restaurants/{id}/reservations` + `/availability/detail` to ensure dashboard renders cards, tables, filters and enforces admin-only access.

### Implementation

- [x] T020 [US6] Flesh out `src/stores/admin.store.ts` to fetch dashboard data, cache by date, and expose selectors plus telemetry for load success/timeout/permission.
- [x] T021 [P] [US6] Build admin UI components (`src/components/admin/AdminSummaryCards.vue`, `src/components/admin/AdminReservationsTable.vue`, `src/components/admin/AdminAvailabilityChart.vue`) styled with theme tokens.
- [x] T022 [US6] Create `src/pages/admin/AdminDashboardPage.vue` and add `/admin` route in `src/router/index.ts` with guard hooking admin store.
- [x] T023 [P] [US6] Wire permission-denied + timeout states via `src/components/state/RequestState.vue` usages and add CTA logic in admin page.
- [x] T024 [P] [US6] Author tests for admin guard + dashboard rendering in `tests/unit/admin.store.spec.ts` and `tests/component/admin-dashboard-page.spec.ts`.

**Checkpoint**: Admin dashboard is gated, renders correct summaries, and passes store/component tests.

---

## Phase 6: User Story 2 - 圖片與 icon 協助辨識 (Priority: P2)

**Goal**: Surface cuisine-specific images and icon-labeled info blocks across list/detail with reliable fallbacks.

**Independent Test**: Load list/detail pages with valid, missing, and invalid cuisine/icon data to verify fallback assets and warnings render; confirm meta.json matches assets.

### Implementation

- [x] T025 [US2] Expand cuisine mapping + fallback heuristics in `src/services/restaurantAssets.ts` and sync `public/images/restaurants/meta.json` with new entries.
- [x] T026 [P] [US2] Create an icon mapping config (e.g., `src/components/restaurants/info/icon-map.ts`) using `@ant-design/icons-vue` and multilingual labels from spec.
- [x] T027 [US2] Apply updated assets/icons to `src/components/restaurants/RestaurantListItem.vue`, `src/pages/restaurants/RestaurantDetailPage.vue`, and `src/components/restaurants/info/IconLabelPair.vue`, including lazy/eager loading behavior.
- [x] T028 [P] [US2] Update tests covering asset/icon fallback in `tests/unit/restaurant-visual.spec.ts` and `tests/component/restaurant-list-item.visual.spec.ts`.

**Checkpoint**: Imagery/icons consistently render or fall back with telemetry warnings.

---

## Phase 7: User Story 5 - 我的訂位與代碼查詢 (Priority: P2)

**Goal**: Allow authenticated users to list, modify, and cancel their reservations plus enable code-based lookup without login.

**Independent Test**: Mock `/reservations/my`, `/reservations/cancel`, `PATCH /reservations`, `/reservations/code`, `/reservations/short` to ensure list renders, actions update state, and code lookup handles invalid tokens.

### Implementation

- [x] T029 [US5] Extend `src/stores/reservations.store.ts` with my-reservations collection, cancel/modify actions, and code lookup plus business-error handling.
- [x] T030 [P] [US5] Build UI components for reservation history + edit/cancel controls in `src/components/reservations/MyReservationsList.vue` and `src/components/reservations/ReservationActionsDrawer.vue`.
- [x] T031 [US5] Create pages/routes for `src/pages/reservations/MyReservationsPage.vue` and `src/pages/reservations/ReservationCodeLookupPage.vue`, adding navigation entry in `src/components/layout/AppHeader.vue` and `src/router/index.ts`.
- [x] T032 [P] [US5] Write tests covering list/cancel/modify/code lookup flows in `tests/unit/reservations.store.spec.ts` and `tests/component/my-reservations-page.spec.ts`.

**Checkpoint**: Users can self-serve reservation management; tests cover success and failure states.

---

## Phase 8: User Story 7 - 管理 timeslot/座位/管理員 (Priority: P2)

**Goal**: Provide admin-side editing for timeslots, table buckets, and admin accounts with RBAC + 409 safeguards.

**Independent Test**: Simulate PATCH/POST/DELETE APIs returning success and 409 errors to ensure UI blocks conflicting updates and enforces at least one active admin.

### Implementation

- [x] T033 [US7] Implement admin mutations (timeslot, bucket, admin member) with optimistic rollback + 409 handling in `src/stores/admin.store.ts`.
- [x] T034 [P] [US7] Build edit forms/drawers `src/components/admin/TimeslotEditorDrawer.vue`, `src/components/admin/TableBucketEditor.vue`, and `src/components/admin/AdminMembersPanel.vue` with validation + helper copy.
- [x] T035 [US7] Integrate editors into `src/pages/admin/AdminDashboardPage.vue`, ensuring disable states for non-admins and at-least-one-admin checks before delete.
- [x] T036 [P] [US7] Add tests covering mutation success/409 + RBAC gating in `tests/unit/admin.store.spec.ts` and `tests/component/admin-management.spec.ts`.

**Checkpoint**: Admin operations handle conflicts, telemetry fires, and tests enforce RBAC.

---

## Phase 9: User Story 3 - 一致的 loading/empty/error 狀態 (Priority: P3)

**Goal**: Guarantee every page shows consistent loading/empty/error/timeout/permission UI with retry/CTA behavior.

**Independent Test**: Force API hooks to emit loading/empty/error/timeout/403 across login/list/detail/reservation/admin pages and confirm RequestState outputs correct copy + actions.

### Implementation

- [x] T037 [US3] Enhance `src/components/state/RequestState.vue` to support timeout, permission-denied, and localization props plus gold-accent visuals.
- [x] T038 [US3] Apply `RequestState` to login (`src/pages/auth/LoginPage.vue`), restaurants pages, reservation flows, and admin dashboard to centralize state rendering hooks.
- [x] T039 [P] [US3] Update visual/unit tests for request states in `tests/component/request-state.visual.spec.ts` and `tests/component/page-shell.visual.spec.ts`.

**Checkpoint**: State handling is unified across pages and validated via tests.

---

## Phase 10: Polish & Cross-Cutting Concerns

- [x] T040 [P] Update `specs/001-ant-design-restaurant-ui/quickstart.md` and `docs/ui-validation/001-ant-design-restaurant-ui/README.md` with final verification evidence (screenshots, telemetry links, Lighthouse data).
- [x] T041 Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, and attach logs in `docs/ui-validation/001-ant-design-restaurant-ui/validation.md`.
- [x] T042 [P] Capture Lighthouse before/after reports and store them under `docs/ui-validation/001-ant-design-restaurant-ui/lighthouse/` with summary.md referencing ≤20% regression proof.
- [x] T043 Execute smoke flow + deploy readiness script (`scripts/check-deploy-readiness.mjs`) and document results in `docs/ui-validation/001-ant-design-restaurant-ui/README.md`.

---

## Phase 11: Theme Activation Hardening

- [x] T044 Export root-level `appThemeConfig` in `src/app/providers/AntdProvider.ts` and stop relying on runtime `ConfigProvider.config` theme injection.
- [x] T045 Wrap application root with `AConfigProvider` in `src/app/App.vue` to ensure global theme tokens apply across routed pages/components.
- [x] T046 Add global text token aliases (`--mh-color-text-primary`, `--mh-color-text-secondary`) in `src/styles/global.css` and record five-page visual regression check coverage.

---

## Dependencies & Execution Order

1. **Phase 1 (Setup)** → must complete before foundational work.
2. **Phase 2 (Foundational)** → blocks all user stories (types, APIs, stores, router guard).
3. **User Stories (Phases 3–9)** → start after foundational phase; follow priority order: US1 → US4 → US6 → US2 → US5 → US7 → US3. Stories marked P1 deliver MVP-ready value before P2/P3 work.
4. **Phase 10 (Polish)** → runs after desired stories land.

### User Story Dependencies
- US1 shares theme assets with later stories but has no story dependency.
- US4 depends on reservation store/composable from Phase 2; US5 builds atop US4 data but can start once US4 APIs exist.
- US6 and US7 both rely on admin store skeleton; US7 further depends on US6 dashboard scaffolding.
- US2 augments components from US1 but can run in parallel once layouts exist.
- US3 applies finishing states and should occur after core flows exist.

### Parallel Opportunities
- Tasks flagged `[P]` (e.g., T008, T011, T012, T016, T018, T019, T021, T023, T024, T026, T028, T030, T032, T034, T036, T039, T040, T042) can run concurrently when file ownership doesn’t overlap.
- Separate user stories can proceed in parallel once preceding dependencies and shared files are merged (e.g., US2 asset work can overlap with US5 page work after US1/Foundational stabilize).

### Parallel Example: User Story 4
- Run T016 (booking widgets) and T018 (telemetry wiring) simultaneously while T015 handles store logic.
- After store logic merges, T017 (page integration) can proceed, followed by T019 tests.

## Implementation Strategy

1. **MVP First**: Finish Phases 1–2, then complete US1 (P1) for a visually consistent core flow. Validate via component tests before proceeding.
2. **Incremental Delivery**:
   - Add US4 (booking) → demo/reserve.
   - Add US6 (admin dashboard) → demo RBAC.
   - Layer US2, US5, US7 (P2 stories) as parallel tracks once P1 work stabilizes.
   - Close with US3 state polish + Phase 10 QA.
3. **Team Parallelism**:
   - One developer handles reservations (US4/US5) while another focuses on admin (US6/US7) and a third on imagery/states (US2/US3), coordinating via `[P]` tasks to avoid file collisions.
