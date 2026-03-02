# Quickstart: 建立新帳號

## 1. 前置條件

- 使用 `002-create-account` 分支。
- 確認 `.env.local` 的 `VITE_API_BASE_URL` 指向可用 API。

## 2. 本機啟動

```bash
npm install
npm run dev
```

瀏覽 `http://localhost:5173/login`。

## 3. 手動驗證流程

1. 於登入頁點擊「建立新帳號」。
2. 驗證路由導向 `/register`，且表單欄位完整。
3. 輸入錯誤資料（空值、密碼不一致、格式錯誤），確認欄位錯誤提示。
4. 輸入正確資料送出，確認顯示成功並導回 `/login`。
5. 確認登入頁可看到回填 credential（email 或 phone）。

## 4. 測試與品質檢查

```bash
npm run lint
npm run typecheck
npm run test
```

若有 e2e 覆蓋註冊流程，再執行：

```bash
npm run test:e2e
```

## 5. 驗收重點

- 註冊 API 使用 `src/services/api/auth.api.ts` 封裝。
- `RegisterPage` 有 loading/error/retry UX。
- telemetry 能記錄 `auth_register_success` / `auth_register_failure`。
- 不新增任何敏感資訊持久化。
