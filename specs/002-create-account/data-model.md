# Data Model: 建立新帳號

## Entities

### 1) RegisterFormInput

- `firstName: string`
- `lastName: string`
- `email: string`
- `phone: string`
- `password: string`
- `confirmPassword: string`

用途：純前端表單狀態，包含 UI 所需 `confirmPassword`。

### 2) RegisterPayload

- `firstName: string`
- `lastName: string`
- `password: string`
- `email?: string`
- `phone?: string`

用途：送往 `POST /auth/register` 的 API payload（不含 `confirmPassword`）。

### 3) RegisterResult

- `credential: string`（註冊成功後可回填登入欄位）
- `message: string`

用途：註冊成功後 UI 導頁與提示資料。

### 4) RegisterErrorState

- `fieldErrors: Partial<Record<keyof RegisterFormInput, string>>`
- `formError: string | null`
- `apiMessageKey: string | null`

用途：欄位驗證與 API 錯誤分流，支援可修正重試。

## Validation Rules

- `firstName`、`lastName`：trim 後不可空。
- `password`：最少 8 碼。
- `confirmPassword`：需與 `password` 完全一致。
- `email` 與 `phone`：至少擇一；若有 `email` 需符合基本 email 格式。
- 送出時需去除前後空白字元（`trim`）。

## API Contract Mapping

- Endpoint: `POST /auth/register`
- Request: `RegisterPayload`
- Success Response: `ApiEnvelope<User>`
- Failure Response: `ApiEnvelope<null>` with `status: "9999"` + `message`（如 `validationError`）

## State Transitions

1. `idle`：初始可編輯狀態。
2. `validating`：本地驗證中。
3. `submitting`：API 呼叫中，按鈕 disabled + loading。
4. `success`：顯示成功提示，導回 `/login`。
5. `error`：顯示欄位錯誤或 form-level 錯誤，可重試。
