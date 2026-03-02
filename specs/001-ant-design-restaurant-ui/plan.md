# Implementation Plan: Ant Design Restaurant Visual Upgrade

**Branch**: `001-ant-design-restaurant-ui` | **Date**: 2026-03-01 | **Spec**: `/specs/001-ant-design-restaurant-ui/spec.md`
**Input**: Feature specification from `/specs/001-ant-design-restaurant-ui/spec.md`

## Summary

Ant Design Restaurant Visual Upgrade delivers a cohesive dark+gold Ant Design theme across login, restaurant list/detail, reservation funnel, and admin dashboards while wiring booking, self-service, and admin operations into consistent status handling. We expand shared tokens, image/icon mappings, and telemetry so availability lookup, reservation CRUD, admin timeslot/table bucket management, and RBAC gating land without backend changes.

## Technical Context

**Language/Version**: TypeScript 5.7 + Vue 3.5 SFC (`<script setup>`) compiled through Vite 6 pipelines.  
**Primary Dependencies**: `ant-design-vue@4`, `@ant-design/icons-vue@7`, Vue Router 4 history mode, Pinia 2 stores, Axios 1 client/interceptors, MSW 2 mocks, Vitest + @vue/test-utils, Playwright, ConfigProvider theme tokens.  
**Storage**: Browser memory `accessToken` (Pinia) + `localStorage` `refreshToken`; remote Restaurant/Reservation REST APIs remain authoritative (no new persistence).  
**Testing**: `npm run test` (Vitest components/unit + jsdom), `npm run test:e2e` (Playwright critical flow), `npm run lint`, `npm run typecheck`; MSW fixtures for availability/reservation/admin endpoints.  
**Target Platform**: Browser SPA (desktop + mobile) deployed on Vercel (history routing, static assets under `public/images/restaurants`).  
**Project Type**: Multi-page Vue SPA for consumer booking + restaurant admin consoles.  
**Performance Goals**: Lighthouse FCP/TTI regression ≤20% vs current release; reservation availability response under 10 seconds with graceful timeout; booking flow ≤3 user steps; lazy-load list thumbnails, eager detail hero images.  
**Constraints**: Dark theme with <15% gold coverage, balanced density (16–24px card spacing, ≥16px primary text), fallback images/icons always present, RBAC gating to hide admin panes for non-admins, no backend schema changes.  
**Scale/Scope**: All existing routes (auth, list, detail) plus new reservations/self-service/admin screens; covers both customer + restaurant admin personas with telemetry for reservation/admin mutations.

## Constitution Check

### Pre-Design Gate

- Value alignment defined: PASS – Spec enumerates 7 user stories and measurable success criteria (SC-001…009).
- Scope boundaries defined: PASS – In/out-of-scope, dependencies (assets, APIs) and edge cases documented.
- Acceptance testability confirmed: PASS – Each story lists Given/When/Then and independent tests.
- Frontend states covered: PASS – Requirements enforce loading/empty/error/timeout/permission screens.
- Consistency impact reviewed: PASS – Mandates Ant Design adoption, image/icon sources, dark theme tokens.
- Quality baseline planned: PASS – NFRs address performance, accessibility, observability, telemetry, QA gates.
- Vue stack readiness confirmed: PASS – Repo already wired with Vue Router, Pinia, Axios, Vitest, Playwright, lint/typecheck.

### Post-Design Gate

- Research, data model, contracts, and quickstart now document reservation + admin flows, telemetry, and verification steps; no unresolved clarifications remain.
- Additional artifacts ensure coverage of RBAC, error codes, and deployment checks.  
**Status**: PASS – No constitution violations detected.

## Project Structure

### Documentation (feature package)

```text
specs/001-ant-design-restaurant-ui/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-visual-contract.md
│   ├── reservation-flow-contract.md
│   └── admin-operations-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
├── components/
│   ├── layout/
│   ├── restaurants/
│   ├── reservations/           # booking widgets + state cards
│   ├── admin/                  # dashboard cards/forms
│   └── state/
├── composables/
│   ├── useLogin.ts
│   ├── useRestaurantsList.ts
│   ├── useRestaurantDetail.ts
│   ├── useReservations.ts      # availability + CRUD orchestration
│   └── useAdminScheduling.ts   # admin availability/timeslot helpers
├── pages/
│   ├── auth/
│   ├── restaurants/
│   ├── reservations/           # self-service + reservation code entry
│   └── admin/                  # dashboard + management subroutes
├── router/
├── services/
│   ├── api/
│   ├── http/
│   └── restaurantAssets.ts
├── stores/
│   ├── auth.store.ts
│   ├── reservations.store.ts   # booking + my reservations state
│   └── admin.store.ts          # admin role + availability cache
├── styles/
├── types/
└── utils/

tests/
├── component/
├── unit/
├── integration/                # add reservation/admin coverage
├── e2e/
└── mocks/
```

**Structure Decision**: Single Vue SPA with feature-focused directories; new reservations/admin components/composables/stores tuck into the existing `src` tree, while tests mirror the feature areas (component/unit/integration/e2e).

## Complexity Tracking

_No constitution violations requiring justification._
