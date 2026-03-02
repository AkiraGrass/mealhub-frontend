# Implementation Plan: 建立新帳號

**Branch**: `002-create-account` | **Date**: 2026-03-02 | **Spec**: `/specs/002-create-account/spec.md`
**Input**: Feature specification from `/specs/002-create-account/spec.md`

## Summary

本功能新增公開註冊流程，讓訪客可從登入頁進入註冊頁，完成欄位驗證後呼叫 `POST /auth/register` 建立帳號，成功後返回登入頁並帶入可登入識別（email/phone）。實作重點是維持既有 auth 架構（Axios service + composable + Pinia token 策略）並補上註冊流程的狀態處理、錯誤映射與測試覆蓋。

## Technical Context

**Language/Version**: TypeScript 5.7 + Vue 3.5 SFC（`<script setup>`）  
**Primary Dependencies**: Vue Router 4、Pinia 2、Axios 1.x、`ant-design-vue@4`、`@ant-design/icons-vue@7`  
**Storage**: `accessToken` 存於記憶體（Pinia），`refreshToken` 存於 `localStorage`；註冊流程不新增持久化。  
**Testing**: `vitest` + `@vue/test-utils`（component/unit）、Playwright（e2e）、`eslint`、`vue-tsc`  
**Target Platform**: Browser SPA（Vite + Vercel SPA rewrite）  
**Project Type**: 前端單體 Vue SPA  
**Performance Goals**: 註冊頁互動效能相較登入頁退化不超過 20%；註冊 API timeout 10 秒內回應 fallback。  
**Constraints**: 不改後端 contract、不改 token 儲存策略、維持 ant-design-vue 視覺一致性、元件不可直呼 Axios。  
**Scale/Scope**: 新增 1 個 auth page、1 條公開路由、1 組 API/composable 流程，並補齊對應測試。

## Constitution Check

### Pre-Design Gate

- Value alignment defined: PASS（目標使用者、痛點、成功指標已在 spec 定義）。
- Scope boundaries defined: PASS（明確排除 SSO、OTP、密碼重設等）。
- Acceptance testability confirmed: PASS（每個 user story 具獨立測試方式）。
- Frontend states covered: PASS（loading/error/retry 與 API timeout 已納入需求）。
- Consistency impact reviewed: PASS（沿用 Ant Design 與既有 auth service 分層）。
- Quality baseline planned: PASS（lint/typecheck/test + telemetry + accessibility）。
- Vue stack readiness confirmed: PASS（router/pinia/vitest/playwright 皆已存在）。

### Post-Design Gate

- `research.md`、`data-model.md`、`quickstart.md`、`contracts/auth-register-contract.md` 已補齊，能支持下一階段 `tasks` 拆解。
- 無憲章違規項目。  
**Status**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-create-account/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-register-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── pages/
│   └── auth/
│      ├── LoginPage.vue
│      └── RegisterPage.vue
├── composables/
│   ├── useLogin.ts
│   └── useRegister.ts
├── services/
│   ├── api/
│   │   └── auth.api.ts
│   └── http/
│      ├── client.ts
│      ├── interceptors.ts
│      └── error-mapper.ts
├── router/
│   ├── index.ts
│   └── guards.ts
├── types/
│   └── auth.ts
└── utils/
   └── telemetry.ts

tests/
├── component/
│   ├── login-page.spec.ts
│   └── register-page.spec.ts
├── unit/
│   └── auth.store.spec.ts
└── e2e/
   └── mvp-critical-flow.spec.ts
```

**Structure Decision**: 使用現有單一 Vue SPA 結構；新增檔案集中在 `auth` 領域（page/composable/api/types/tests），避免影響餐廳與訂位模組。

## Complexity Tracking

目前無需額外複雜度豁免；本功能可在既有架構內實現。
