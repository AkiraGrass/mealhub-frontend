# Reservation Flow Contract - Ant Design Restaurant Upgrade

## Scope
Covers前台使用者在餐廳詳情、訂位頁、我的訂位、訂位碼查詢頁與相關狀態元件。目標是在 Ant Design UI 中實作查詢可用時段、建立/修改/取消訂位、查詢個人或代碼訂位的完整流程。

## Interfaces & Payload Contracts

### Availability Lookup
- `GET /restaurants/{id}/availability?date=YYYY-MM-DD&partySize=number`
- `GET /availability/detail?restaurantId={id}&date=...` (for byPartySize breakdown)
- Response MUST 映射至 `AvailabilitySlot` / `TableBucket` 資料結構。
- UI MUST 在 10 秒內回應成功或顯示 timeout 狀態；列表圖片 lazy-load 不可阻塞。

### Reservation Create
- `POST /reservations`
  - Payload: `{ restaurantId, slotId, date, partySize, contact, notes? }`
  - Response: `{ reservation: Reservation }`
- 錯誤碼：`sold_out`, `already_reserved_this_restaurant`, `no_capacity_for_party_size`、HTTP 401/403/409。
- UI MUST 轉換錯誤碼為對應文案並提供備選時段或重新登入 CTA。

### Reservation Modify/Cancel
- `PATCH /reservations/{id}` with new `slotId`, `partySize`, `notes`
- `POST /reservations/cancel` with `{ reservationId }`
- Business error `cannotModifyTimeslotActive` 需顯示阻擋訊息並保持原狀態。

### My Reservations / Code Lookup
- `GET /reservations/my`
- `GET /reservations/code?code=...`、`GET /reservations/short?token=...`
- Response: `Reservation[]` (my) 或單筆 `Reservation` (code)。
- UI MUST 允許展開細節、複製訂位碼並提供取消/修改按鈕（若狀態允許）。

## UI & State Contract
- 流程使用 Ant Design Steps / Drawer / Result 元件，3 步驟：選日期/人數 → 選時段 → 確認與結果。
- Loading/empty/error/timeout/permission-denied MUST 使用共用 `ViewState` 元件。
- 列表與詳情共用 `reservations.store.ts` state，避免重複 API 呼叫與競態。
- 任何 API 呼叫在 pending 前需要 `trackEvent('reservation_action_start', ...)`，成功/失敗分別上報。
- Sold out case MUST 提供同日其他可用時段（從 `AvailabilitySlot` 過濾）與 CTA。
- 「我的訂位」與「訂位碼查詢」共用 UI 元件，僅差在資料來源與登入需求。

## Observability & Testing Contract
- Telemetry：
  - `reservation_create_success/error`
  - `reservation_modify_success/error`
  - `reservation_cancel_success/error`
  - `reservation_lookup_timeout/permission_denied`
- 每個事件需包含 `restaurantId`, `reservationId?`, `partySize`, `slotId`, `errorCode?`。
- Vitest：撰寫 component/store 測試模擬成功、sold_out、timeout、permission-denied 與 fallback 圖片邏輯。
- Playwright：更新 critical flow 覆蓋登入 → 詳情 → 可用時段 → 訂位成功 + sold_out fallback。
