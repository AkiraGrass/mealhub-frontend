# Auth Register Contract - 建立新帳號

## Scope

本文件定義前端「建立新帳號」流程的 API、UI 狀態與測試契約，範圍包含登入頁入口、註冊頁、註冊 API 串接與導回登入行為。

## API Contract

### Endpoint

- `POST /auth/register`
- Auth: 不需要 Bearer token（public endpoint）

### Request Payload

```json
{
  "firstName": "Akira",
  "lastName": "Lin",
  "email": "akira@example.com",
  "phone": "0912345678",
  "password": "password123"
}
```

說明：
- `email` 與 `phone` 至少擇一。
- `confirmPassword` 為前端欄位，不可送到 API。

### Success Response

- HTTP: `200`
- Body: `ApiEnvelope<User>`
- 前端動作：顯示成功提示並導向 `/login`。

### Error Response

- `422` + `validationError`：顯示欄位或表單錯誤。
- `500` + `failure`：顯示一般錯誤與重試按鈕。
- 其他 `message key`：透過 error mapper 轉為可讀文案並保留重試。

## UI/State Contract

- 入口：`LoginPage` 的「建立新帳號」按鈕可導向 `/register`。
- 註冊頁：採用 `ant-design-vue` 表單元件，支援欄位級錯誤與 form-level 錯誤。
- `submitting` 狀態：送出按鈕 `loading + disabled`，防止重複提交。
- `error` 狀態：保留已輸入欄位，允許修正後重試。
- `success` 狀態：導回登入頁，攜帶 `credential`（query 或暫存 state）。

## Telemetry Contract

- 成功：`auth_register_success`
- 失敗：`auth_register_failure`

建議 payload：
- `messageKey?: string`
- `hasEmail: boolean`
- `hasPhone: boolean`
- `timestamp: ISO string`

## Testing Contract

- Component tests：
  - 渲染註冊欄位。
  - 欄位驗證錯誤提示。
  - 成功送出導回登入。
  - API 失敗時顯示錯誤並可重試。
- Unit tests：
  - `registerApi` payload 映射。
  - `useRegister` 狀態轉換（idle/submitting/success/error）。
- E2E：
  - `login -> register -> back to login`。
