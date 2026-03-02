# Feature Specification: 建立新帳號

**Feature Branch**: `002-create-account`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "建立新帳號"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 訪客可完成註冊並開始登入 (Priority: P1)

作為尚未註冊的訪客，我希望可以從登入頁進入「建立新帳號」頁，填寫必要資料後建立帳號，並被引導回登入流程，以便立即使用服務。

**Why this priority**: 這是新帳號功能的核心價值，沒有此流程就無法新增使用者。

**Independent Test**: 從 `/login` 點擊「建立新帳號」→ 完整填寫表單 → 成功呼叫 `POST /auth/register` → 顯示成功提示並導回登入頁。

**Acceptance Scenarios**:

1. **Given** 使用者在登入頁，**When** 點擊「建立新帳號」，**Then** 系統導向註冊頁並顯示註冊表單。
2. **Given** 註冊資料皆有效，**When** 使用者送出表單，**Then** 系統建立帳號成功並導回登入頁。

---

### User Story 2 - 使用者可即時看見表單驗證錯誤 (Priority: P2)

作為使用者，我希望在輸入資料不完整或格式錯誤時，能立即看到清楚的欄位提示，避免反覆送出才知道問題。

**Why this priority**: 良好的前端驗證可降低註冊失敗率，減少不必要 API 往返。

**Independent Test**: 在註冊頁輸入錯誤 email、短密碼、密碼確認不一致、缺少姓名等，確認欄位級錯誤提示與送出阻擋。

**Acceptance Scenarios**:

1. **Given** 使用者輸入不合法欄位值，**When** 嘗試送出，**Then** 系統顯示對應錯誤訊息且不呼叫註冊 API。

---

### User Story 3 - 使用者可理解註冊失敗原因並重試 (Priority: P3)

作為使用者，我希望在註冊 API 回傳失敗時看到可理解的錯誤訊息，並能保留已輸入資訊快速修正重試。

**Why this priority**: 錯誤可理解性直接影響轉換率與客服負擔。

**Independent Test**: 模擬重複 email、驗證錯誤、伺服器錯誤，確認頁面顯示可操作錯誤訊息且允許重試。

**Acceptance Scenarios**:

1. **Given** API 回傳 `validationError` 或 `emailTaken`，**When** 註冊失敗，**Then** 系統顯示對應訊息並保留可修正欄位值。

---

### Edge Cases

- 註冊時 `email` 與 `phone` 都空值時，送出必須被阻擋並提示至少填寫一項。
- `password` 與 `confirmPassword` 不一致時，不可送出。
- 使用者快速重複點擊送出時，必須避免重複請求。
- API 超時或網路中斷時，需顯示可重試狀態且不清空表單。
- 從註冊頁返回登入頁時，若成功註冊過可帶入剛註冊的帳號識別欄位（email 或 phone）。

### Out of Scope *(mandatory)*

- 不包含第三方登入（Google、Apple、LINE）與 SSO。
- 不包含 email 驗證信、手機 OTP、密碼重設流程。
- 不包含後台使用者管理與帳號審核流程。
- 不調整既有 token 儲存策略（`accessToken` 記憶體、`refreshToken` localStorage）。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Entry Point)**: 系統 MUST 在 `src/pages/auth/LoginPage.vue` 的「建立新帳號」按鈕提供可導向註冊頁的操作。
- **FR-002 (Registration Form)**: 系統 MUST 提供註冊表單欄位：`firstName`、`lastName`、`email`、`phone`、`password`、`confirmPassword`。
- **FR-003 (Validation Rules)**: 前端 MUST 驗證必填欄位與格式：姓名不可空白、`password` 長度下限、`confirmPassword` 必須一致、`email`/`phone` 至少一項。
- **FR-004 (API Contract)**: 表單送出 MUST 呼叫 `POST /auth/register`（透過 `src/services/api/auth.api.ts` 封裝），請求 payload 對齊後端 contract。
- **FR-005 (Error Mapping)**: 系統 MUST 針對 `validationError`、`unauthorized`、`failure` 與未識別 message key 提供一致錯誤映射與可重試流程。
- **FR-006 (Success Handling)**: 註冊成功後 MUST 顯示成功訊息並導回登入頁；登入頁可預填註冊時的 email 或 phone。
- **FR-007 (State UX)**: 註冊頁 MUST 提供 loading / error / retry 三態，並在 loading 時禁用重複送出。
- **FR-008 (Service Boundary)**: 元件 MUST 不直接呼叫 Axios，所有註冊請求需經 `src/services/api/` 與 composable/store 層。
- **FR-009 (Telemetry)**: 成功與失敗 MUST 記錄 telemetry event（如 `auth_register_success`、`auth_register_failure`），payload 至少含時間戳與錯誤 key。
- **FR-010 (Navigation Guard Compatibility)**: 註冊頁 MUST 作為公開頁面，不受 `requiresAuth` guard 阻擋。

### Non-Functional Requirements *(mandatory)*

- **NFR-001 (Performance)**: 註冊頁首屏可互動時間（TTI）相較登入頁退化不得超過 20%。
- **NFR-002 (Accessibility)**: 表單欄位需具備 label、鍵盤可達、錯誤訊息可被螢幕閱讀器辨識。
- **NFR-003 (Observability)**: 註冊成功/失敗與 API timeout 必須可被 telemetry/console 追蹤。
- **NFR-004 (Security/Privacy)**: 密碼欄位不得以明文持久化；前端不得儲存註冊密碼於 localStorage。
- **NFR-005 (I18n Readiness)**: 註冊文案至少提供繁中與英文對照 key，避免硬編碼單語系。
- **NFR-006 (Quality Gates)**: 合併前需通過 `npm run lint`、`npm run typecheck`、`npm run test`。

### Technical Stack & Dependencies *(mandatory for frontend)*

- **TS-001 (Framework)**: 延續 Vue 3.5 + TypeScript 5.7 + `<script setup>`。
- **TS-002 (Routing/State)**: 使用 `vue-router` 新增公開註冊路由，使用 Pinia/composable 管理註冊流程狀態。
- **TS-003 (UI Library)**: 表單與回饋元件使用 `ant-design-vue`，圖示使用 `@ant-design/icons-vue`。
- **TS-004 (HTTP Client)**: API 請求沿用 Axios client/interceptor；`/auth/register` 視為公開 auth endpoint。
- **TS-005 (Testing Unit/Component)**: 使用 `vitest` + `@vue/test-utils` 覆蓋註冊頁渲染、驗證、成功失敗流程。
- **TS-006 (E2E)**: 使用 Playwright 覆蓋 `login -> register -> back to login` 關鍵流程。
- **TS-007 (Quality Gates)**: 維持 `eslint`、`prettier`、`vue-tsc`、`vitest` 標準檢查。

### Key Entities *(include if feature involves data)*

- **RegisterPayload**: 前端送往 `POST /auth/register` 的資料結構（`firstName`, `lastName`, `email?`, `phone?`, `password`）。
- **RegisterFormState**: 註冊頁本地狀態（欄位值、欄位錯誤、提交中狀態、API 錯誤）。
- **RegisterResult**: 註冊結果模型（成功訊息、可回填登入的 `credential`）。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% 以上使用者可在 2 分鐘內完成註冊（從進入註冊頁到成功提示）。
- **SC-002**: 註冊表單前端驗證可攔截至少 80% 常見輸入錯誤（空值、格式錯誤、密碼不一致）。
- **SC-003**: 註冊失敗後可重試成功率達 95%（排除後端不可用時段）。
- **SC-004**: `login -> register -> login` E2E 關鍵流程在 CI 維持 100% 通過率。
