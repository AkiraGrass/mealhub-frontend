# Research: 建立新帳號

## Decision 1: 註冊成功後導回登入，而非自動登入

- **Decision**: `POST /auth/register` 成功後顯示成功訊息並導向 `/login`，可帶入 email 或 phone 作為預填欄位。
- **Rationale**: 目前後端 register 回傳 `User` 而非 token，若要自動登入需額外呼叫 login，會增加失敗分支與流程複雜度。
- **Alternatives considered**:
  - 註冊後直接再打一次 login：多一次 API 呼叫、錯誤路徑增加。
  - 註冊成功停留原頁：使用者仍需自行返回登入頁，體驗較差。

## Decision 2: 延續現有 service + composable 分層

- **Decision**: 在 `src/services/api/auth.api.ts` 新增 `registerApi`，並以 `useRegister` 管理頁面狀態。
- **Rationale**: 專案已用 `useLogin` + `auth.store` 模式，新增註冊沿用可保持一致性，避免元件直接呼叫 Axios。
- **Alternatives considered**:
  - 在 `auth.store` 增加 register action：可行，但註冊不涉及 token session，放在 composable 更貼合職責。
  - 直接在頁面呼叫 Axios：違反專案既有分層與憲章原則。

## Decision 3: 表單驗證以前端同步規則為主

- **Decision**: 送出前先做欄位驗證（姓名、密碼長度、密碼確認一致、email/phone 至少一項）。
- **Rationale**: 提升成功率並降低無效請求；規則與 `docs/mealhubApi.md` contract 對齊。
- **Alternatives considered**:
  - 全交給後端驗證：可行但 UX 差，且會增加網路往返。

## Decision 4: 新增註冊 telemetry 事件

- **Decision**: 新增 `auth_register_success`、`auth_register_failure` 事件，包含 `messageKey` 與 timestamp。
- **Rationale**: 與既有登入/登出觀測邏輯一致，便於量測註冊轉換與失敗原因。
- **Alternatives considered**:
  - 不新增事件：無法追蹤此功能成效。

## Decision 5: 註冊路由維持公開頁

- **Decision**: 新增 `/register` route，無 `requiresAuth`。
- **Rationale**: 註冊本質是未登入可用流程；與 `/login` 一致。
- **Alternatives considered**:
  - 使用 modal 置於登入頁：狀態耦合高，驗證與錯誤訊息管理較複雜。
