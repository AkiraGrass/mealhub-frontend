# Admin Operations Contract - Ant Design Restaurant Upgrade

## Scope
定義餐廳管理員在前端操作 dashboard、預約列表、可用時段、table bucket 與管理員帳號維護時的 UI 與 API 契約，並確保 RBAC/遙測要求。

## Interfaces
- `GET /restaurants/{id}/reservations?date=...&timeslot=...`
- `GET /availability/detail?restaurantId=...&date=...`
- `PATCH /restaurants/{id}` （更新可用量、開放/關閉功能）
- `POST/PATCH/DELETE /timeslots`
- `GET/POST/DELETE /restaurants/{id}/admins`
- `GET /restaurants/{id}/admins` 用於 RBAC 授權檢查。

## UI Contract
1. **Dashboard**：
   - Summary Cards (Ant Design Card/Statistic) 顯示 `capacity/reserved/available`，支援日期切換。
   - Reservation Table (Ant Design Table) 可依 timeslot/partySize 過濾並提供搜尋。
2. **Availability Detail**：
   - `byPartySize` 以折線或 column chart 呈現，若使用第三方圖表須與 Ant Design 主題一致。
3. **Timeslot/Table Buckets**：
   - 使用 Drawer/Form，送出時顯示 loading 狀態，409 錯誤需阻擋並展示對應訊息。
4. **Admin Management**：
   - 列表顯示 `name/email/status`，新增採用 Modal 表單，刪除需二次確認。
5. **RBAC Guard**：
   - 非管理員進入 `/admin` route 時顯示 permission-denied 視覺與 CTA；不應載入任何管理資料。

## Observability & Quality Gates
- Telemetry 事件：
  - `admin_dashboard_load_{success|timeout|permission_denied}`
  - `admin_timeslot_update_{success|error}` (附 `errorCode`)
  - `admin_bucket_update_{success|error}`
  - `admin_member_{invite|remove}_{success|error}`
- 事件 payload 需包含 `restaurantId`, `timeslotId?`, `bucketId?`, `adminId?`, `status`。
- Vitest：為 admin store/composables 撰寫測試覆蓋成功、timeout、403 以及 409 情境。
- Playwright：新增管理員帳號 smoke flow（登入管理員 → dashboard → 編輯 timeslot → 管理成員）。
- Lint/typecheck/test 必須通過；Preview 驗收需附管理端桌機/手機截圖與 409 錯誤畫面。

## Security & Constraints
- 所有 admin API 呼叫 MUST 夾帶 access token；無 token 時應立即導向登入。
- 至少一名 active admin 必須存在：UI 需阻擋刪除最後一名 active 成員。
- 不得在前端快取管理員清單超過 session 範圍；每次進入 admin route 都需重新驗證。
