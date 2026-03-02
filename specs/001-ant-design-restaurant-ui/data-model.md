# Data Model - Ant Design Restaurant Visual Upgrade

## 1) UiThemeConfig
- Purpose: 控制 Ant Design 視覺 token（色彩、字級、間距、圓角）以套用深色+金色主題。
- Fields:
  - `mode: 'dark' | 'light'`
  - `colorPrimary: string`
  - `colorAccent: string` (gold)
  - `borderRadius: number`
  - `fontSizeBase: number`
  - `spacingScale: Record<'xs' | 'sm' | 'md' | 'lg', number>`
- Validation Rules:
  - 金色填滿區域 <15%，僅用於 CTA 與重點標記。
  - 主文字字級 ≥16px、行高 1.5±0.1；間距 16~24px。
  - 所有頁面 MUST 從同一 `ConfigProvider` token 取得設定。

## 2) RestaurantVisualAsset
- Purpose: 封裝列表/詳情渲染時需要的圖片資產與載入行為。
- Fields:
  - `assetKey: string`（`cuisineType` 或 fallback key）
  - `imagePath: string` (相對於 `public/images/restaurants`)
  - `altText: string`
  - `loadMode: 'lazy' | 'eager'`
- Validation Rules:
  - 列表圖片 `loadMode` MUST 為 `lazy`；詳情主圖 MUST 為 `eager`。
  - `altText` 必須描述菜系/餐廳型態，符合可及性。
  - 圖片載入失敗時需對應 fallback asset。

## 3) RestaurantImageMapping
- Purpose: 維護 `cuisineType`/分類到本地靜態圖片的映射，確保一致性與低維護成本。
- Fields:
  - `cuisineType: string`
  - `imagePath: string`
  - `altText: string`
  - `isFallback: boolean`
  - `lastUpdated: string (ISO date)`
- Relationships: `imagePath` MUST 對應 `public/images/restaurants` 實體檔案；`cuisineType` 來自後端 API。
- Validation Rules:
  - 每個支援的 `cuisineType` MUST 有映射；缺少時落到 default fallback 並記錄 warning。
  - CI/Deploy 前需驗證 `imagePath` 存在。

## 4) RestaurantInfoIconMap
- Purpose: 餐廳資訊欄位到 icon 的映射。
- Fields:
  - `fieldKey: 'address' | 'status' | 'timeslots' | 'note' | 'priceRange' | 'contact'`
  - `iconName: string`（取自 `@ant-design/icons-vue`）
  - `label: string`
- Validation Rules:
  - 每個欄位必須配有 icon 與可讀標籤；缺漏時使用預設 icon。
  - 多語系文字需提供 zh-TW/en-US 文案。

## 5) ViewStateContract
- Purpose: 視覺狀態元件在 loading/empty/error/timeout/permission 的統一行為。
- Fields:
  - `variant: 'loading' | 'empty' | 'error' | 'timeout' | 'permission-denied'`
  - `message: string`
  - `description?: string`
  - `icon?: string`
  - `primaryAction?: { label: string; handler: () => Promise<void> }`
  - `secondaryAction?: { label: string; handler: () => Promise<void> }`
- Validation Rules:
  - `error`/`timeout` 必須提供重試；`permission-denied` 必須提供重新登入 CTA。
  - `empty` 狀態不可與 timeout/permission 共存。

## 6) Reservation
- Purpose: 顧客訂位資料，用於列表、詳情與「我的訂位」畫面。
- Fields:
  - `id: string`
  - `restaurantId: string`
  - `date: string (YYYY-MM-DD)`
  - `start: string (ISO datetime)`
  - `end: string (ISO datetime)`
  - `partySize: number`
  - `status: 'pending' | 'confirmed' | 'cancelled' | 'sold_out' | 'modified'`
  - `code: string`
  - `shortToken: string`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- Relationships: `restaurantId` 對應列表/詳情頁資料；`status` 決定 UI 呈現與操作是否可用。
- Validation Rules:
  - `partySize` >0，並須符合餐廳可用 bucket。
  - `status` 場景需觸發對應訊息（成功、sold_out、already_reserved 等）。
  - 修改/取消需比對 `updatedAt` 或 version 以避免樂觀鎖衝突。

## 7) AvailabilitySlot
- Purpose: `availability` 與 `availability/detail` 回傳的可預約時段、剩餘席次資料。
- Fields:
  - `slotId: string`
  - `start: string`
  - `end: string`
  - `capacity: number`
  - `reserved: number`
  - `available: number`
  - `byPartySize: Array<{ partySize: number; available: number }>`
  - `notes?: string`
- Relationships: 提供 `Reservation` 建立/修改 UI 選項；管理端亦用於 dashboard。
- Validation Rules:
  - `available` = `capacity - reserved`，不可為負數。
  - `byPartySize` 應覆蓋 UI 支援的 party size 範圍。
  - timeout/permission 狀態需落在 ViewStateContract。

## 8) TableBucket
- Purpose: 管理端設定每種桌型容量與可用量。
- Fields:
  - `bucketId: string`
  - `size: number`
  - `capacity: number`
  - `reserved: number`
  - `available: number`
- Relationships: 由管理端表單編輯並同步 `AvailabilitySlot`；與 `Reservation` partySize 驗證互動。
- Validation Rules:
  - `size` 與 `capacity` 必須為正整數。
  - 修改時若存在 confirmed 訂位且產生 409，需阻擋提交並顯示 `cannotModifyTimeslotActive`。

## 9) RestaurantAdmin
- Purpose: 餐廳管理員資訊，用於 RBAC 與管理端帳號列表。
- Fields:
  - `id: string`
  - `restaurantId: string`
  - `userId: string`
  - `name: string`
  - `email: string`
  - `role: 'owner' | 'operator'`
  - `status: 'active' | 'invited' | 'revoked'`
- Relationships: `/restaurants/{id}/admins` API；Router 依是否存在 active admin 判斷權限。
- Validation Rules:
  - 至少一位 active admin 必須存在。
  - 撤銷自身時需檢查其他 active admin。

## 10) ReservationFormState
- Purpose: 前端管理訂位表單與流程狀態，避免跨頁不一致。
- Fields:
  - `selectedDate: string`
  - `partySize: number`
  - `selectedSlotId?: string`
  - `availability: AvailabilitySlot[]`
  - `isSubmitting: boolean`
  - `businessError?: 'sold_out' | 'already_reserved_this_restaurant' | 'no_capacity_for_party_size' | 'cannotModifyTimeslotActive'`
- Relationships: 驅動 `Reservation` 建立/修改、詳情頁 CTA，以及 `ViewStateContract` 呈現。
- Validation Rules:
  - `selectedSlotId` 必須存在於 `availability` 集合。
  - 業務錯誤需轉換成可讀訊息與備選時段建議。

## 11) ReservationAuditEvent
- Purpose: 滿足 NFR-010，記錄訂位與管理端所有變動。
- Fields:
  - `eventId: string`
  - `type: 'reservation_create' | 'reservation_cancel' | 'reservation_modify' | 'admin_timeslot_update' | 'admin_table_bucket_update' | 'admin_member_update'`
  - `actorRole: 'customer' | 'admin'`
  - `actorId: string`
  - `reservationId?: string`
  - `restaurantId: string`
  - `status: 'success' | 'error'`
  - `errorCode?: string`
  - `timestamp: string`
- Validation Rules:
  - 每次關鍵操作 MUST 觸發事件，即便為錯誤情境。
  - `errorCode` 需對應 API 回傳碼（例如 `sold_out`、`cannotModifyTimeslotActive`）。
