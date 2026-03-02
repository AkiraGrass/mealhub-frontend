# Feature Specification: Ant Design Restaurant Visual Upgrade

**Feature Branch**: `001-ant-design-restaurant-ui`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "我想增加 ant design 當作視覺，並增加適合的餐廳風格圖片跟 icon"

## Clarifications

### Session 2026-02-28

- Q: 餐廳圖片來源策略採用哪一種？ → A: 使用專案內建靜態圖片與 fallback。
- Q: icon 來源策略採用哪一種？ → A: 全部使用 `@ant-design/icons-vue`。
- Q: 視覺改版頁面範圍採用哪一種？ → A: 擴大為共用元件與所有現有頁面。
- Q: 圖片載入策略採用哪一種？ → A: 列表圖片 lazy-load，詳情主圖立即載入。
- Q: 視覺驗收基準採用哪一種？ → A: 功能驗收 + 桌機/手機截圖對照 + PM sign-off。
- Q: 畫面風格優化主視覺採用哪一種？ → A: 精緻餐廳風（深色背景、金色重點、卡片質感）。
- Q: 畫面資訊密度採用哪一種？ → A: 平衡（兼顧美觀與資訊量）。
- Q: 深色主題文字對比策略採用哪一種？ → A: 混合（標題高對比、內文中對比）。
- Q: 主色金色的使用強度採用哪一種？ → A: 中（僅用於 CTA 與重點標記）。

### Session 2026-03-01

- Q: 前端要如何決定每家餐廳使用哪一張靜態餐廳風格圖片，才能兼顧一致性與維護成本？ → A: 依據 API 既有菜系/分類欄位建立映射。

### Session 2026-03-02

- Q: 這次改版是否要納入訂位與餐廳管理功能？ → A: 是，需要同時提供前台訂位/查詢與餐廳管理端（時段、座位、預約、管理員）。
- Q: 權限角色有幾種？ → A: 一般使用者（顧客）與餐廳管理員（含營運人員），餐廳管理端必須以權限保護。
- Q: 訂位流程需支援哪些操作？ → A: 查詢可預約時段、建立訂位、查詢個人訂位、修改/取消訂位、以訂位碼查詢。
- Q: 餐廳管理端需支援哪些操作？ → A: 查看每日可用量與預約清單、調整 timeslot/table bucket、管理餐廳管理員帳號。
- Q: 如何判斷使用者是否有管理員權限而不用調整後端？ → A: 透過呼叫 `/restaurants/{id}/admins` 試探是否在管理員清單，中前端即可依回應決定，無需新增 /me 欄位。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 使用者可在一致設計語言下使用核心流程 (Priority: P1)

作為使用者，我希望登入、餐廳列表、餐廳詳情三個頁面都有一致且清楚的視覺風格，
讓我可以快速理解操作與狀態。

**Why this priority**: 這是整體視覺改版的核心價值，直接影響第一印象與可用性。

**Independent Test**: 開啟三個核心頁面，確認都採用 Ant Design 元件並維持既有功能可用。

**Acceptance Scenarios**:

1. **Given** 使用者進入登入頁，**When** 檢視畫面，**Then** 表單、按鈕、錯誤提示皆使用一致的 Ant Design 樣式。
2. **Given** 使用者進入列表頁與詳情頁，**When** 切換頁面，**Then** 版面、字級、間距與元件風格一致。

---

### User Story 2 - 使用者可透過圖片與 icon 快速辨識餐廳資訊 (Priority: P2)

作為使用者，我希望在列表與詳情頁看到符合餐廳情境的圖片與 icon，
讓我更快理解店家類型與內容區塊。

**Why this priority**: 視覺素材能提升資訊辨識與瀏覽體驗，是此需求的關鍵增值。

**Independent Test**: 列表與詳情可顯示餐廳風格圖片與 icon；素材載入失敗時有替代呈現。

**Acceptance Scenarios**:

1. **Given** 使用者在列表頁，**When** 查看卡片，**Then** 每個項目顯示餐廳風格圖片或預設占位圖。
2. **Given** 使用者進入詳情頁，**When** 查看資訊區塊，**Then** 顯示對應 icon 並保有可讀標籤。

---

### User Story 3 - 使用者在各種狀態下仍可清楚操作 (Priority: P3)

作為使用者，我希望在 loading、empty、error 狀態下仍有清楚視覺與下一步操作，
不會因改版而失去可用性。

**Why this priority**: 視覺升級不能破壞既有狀態處理，需確保核心體驗穩定。

**Independent Test**: 模擬 loading/empty/error，確認狀態元件有一致樣式且重試/返回可用。

**Acceptance Scenarios**:

1. **Given** API 載入中，**When** 頁面渲染，**Then** 顯示一致的 loading 樣式與可讀訊息。
2. **Given** API 回傳空資料或錯誤，**When** 頁面渲染，**Then** 顯示統一 empty/error 樣式與可操作按鈕。

---

### User Story 4 - 使用者可完成訂位流程並收到狀態提示 (Priority: P1)

作為一般使用者，我希望可以在餐廳詳情或訂位區選擇日期/人數，查看可用時段後完成訂位，並在成功或滿位時獲得明確訊息。

**Independent Test**: 依 API 模擬成功/`sold_out`/`already_reserved_this_restaurant` 情境，確認 UI 顯示正確且送出的 payload 符合 `/reservations` 需求。

**Acceptance Scenarios**:

1. **Given** 使用者挑選日期與人數，**When** API 回傳可用時段，**Then** UI 顯示剩餘席次並允許選擇。
2. **Given** 使用者送出訂位，**When** API 回傳成功，**Then** UI 顯示成功訊息並紀錄訂位代碼。
3. **Given** 使用者送出訂位，**When** API 回傳 `sold_out`，**Then** UI 顯示滿位提示並列出其他可用時段。

---

### User Story 5 - 使用者可查詢、修改與取消自己的訂位 (Priority: P2)

作為一般使用者，我希望可以在「我的訂位」檢視所有即將到來的訂位，必要時修改或取消。

**Independent Test**: 透過 `/reservations/my`、`/reservations/cancel`、`PATCH /reservations` 模擬多筆資料與錯誤情況，確保 UI 狀態同步。

**Acceptance Scenarios**:

1. **Given** 使用者登入，**When** 進入「我的訂位」，**Then** 顯示所有未來訂位並可展開查看細節。
2. **Given** 使用者點擊取消，**When** API 成功回應，**Then** 該筆訂位移至取消清單並顯示成功訊息。
3. **Given** 使用者修改時段，**When** API 回傳 `cannotModifyTimeslotActive`，**Then** 顯示錯誤原因並保留原狀態。

---

### User Story 6 - 餐廳管理員可掌握預約與剩餘席次 (Priority: P1)

作為餐廳管理員，我需要有 dashboard 查看每日預約、剩餘席次、可用時段細節並可篩選。

**Independent Test**: 模擬 `/restaurants/{id}/reservations`、`/availability/detail` 多筆資料，確認儀表板表格與圖卡顯示正確且允許依日期/時段切換。

**Acceptance Scenarios**:

1. **Given** 管理員登入，**When** 選擇日期，**Then** 可看到各時段 summary card（capacity/reserved/available）。
2. **Given** 管理員查看預約清單，**When** 依 timeslot 過濾，**Then** 只顯示該時段訂位。

---

### User Story 7 - 餐廳管理員可維護 timeslot、座位與管理員 (Priority: P2)

作為餐廳管理員，我想要在系統中更新餐廳資訊、時段、座位配置並管理其他管理員，確保運營流程。

**Independent Test**: 透過 `PATCH /restaurants/{id}`、`/timeslots`、`/admins` API 模擬成功與 409 錯誤，確認表單驗證與例外流程。

**Acceptance Scenarios**:

1. **Given** 管理員想新增時段，**When** 送出與現有 confirmed 訂位衝突，**Then** UI 顯示 `cannotModifyTimeslotsActive` 並阻擋。
2. **Given** 管理員指定新管理員，**When** API 成功，**Then** 列表即時更新並發出邀請提示。

### Edge Cases

- 圖片 URL 無效或載入逾時時，必須顯示預設餐廳占位圖。
- icon 資源缺漏時，必須回退到預設 icon，不可出現空白區塊。
- 小螢幕下卡片與圖片比例需維持可閱讀，避免文字被遮擋。
- 視覺升級後，既有登入/列表/詳情互動流程不可改壞。
- API timeout 或網路中斷時，列表/詳情頁必須顯示逾時狀態並提供重試/返回操作。
- 權限不足（HTTP 401/403）時，需顯示 Permission Denied 畫面與導回登入的 CTA。
- 預約同一時段/人數若座位不足，必須顯示 sold out 與其他備選時段。
- 同一使用者重複預約同餐廳需提示已預約資訊並阻擋重複提交。
- 餐廳管理端調整 timeslot/table bucket 時需避免與既有 confirmed 訂位衝突。
- 餐廳管理員撤銷自己時需檢查是否仍有至少一名活躍管理員。

### Out of Scope *(mandatory)*

- 支付串接、信用卡綁定
- 會員等級或點數機制
- 餐廳後台 ERP 整合
- 自建完整 Design System 與主題引擎
- 圖片 CMS 後台或媒體上傳功能

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 在登入、餐廳列表、餐廳詳情頁導入 Ant Design 元件並維持既有流程。
- **FR-002**: 系統 MUST 以 Ant Design 重新呈現表單、按鈕、提示訊息與基礎版面容器。
- **FR-003**: 系統 MUST 在餐廳列表顯示餐廳風格圖片（來源為 `public/images/restaurants`），且支援圖片載入失敗 fallback。
- **FR-004**: 系統 MUST 在餐廳詳情的重要資訊區塊顯示 `@ant-design/icons-vue` icon 與標籤。
- **FR-005**: 系統 MUST 保留並統一 loading、empty、error、timeout、permission-denied 的視覺與互動（重試/返回／重新登入）。
- **FR-006**: 系統 MUST 提供至少一組預設圖片與預設 icon，確保無資料時仍可呈現。
- **FR-007**: 系統 MUST 確保視覺升級不改變現有 API 串接邏輯與授權流程。
- **FR-008**: 系統 MUST 增加最小必要測試，覆蓋主要頁面渲染與狀態元件呈現。
- **FR-009**: 系統 MUST 提供部署前檢查清單，包含環境變數、圖片資產可用性、與 Vue Router history 路由驗證。
- **FR-010**: 系統 MUST 將 Ant Design 視覺規範擴展到共用元件與所有現有頁面，避免新舊風格混用。
- **FR-011**: 系統 MUST 將列表圖片設定為 lazy-load，並確保詳情頁主圖為立即載入。
- **FR-012**: 系統 MUST 採用「精緻餐廳風」主題（深色基底、金色重點、具層次卡片）並套用至所有受影響頁面與共用元件。
- **FR-013**: 系統 MUST 採用平衡資訊密度：卡片主要文字字級 ≥16px、行高 1.5±0.1、卡片段落間距維持 16~24px，並避免超出此區間的過度壓縮或留白。
- **FR-014**: 系統 MUST 將金色主色使用強度控制為中等（單一畫面金色填滿區域 <15%），僅套用於 CTA、關鍵狀態與重點標記，避免大面積金色造成干擾，並提供驗收截圖佐證。
- **FR-015**: 系統 MUST 依據 API 既有 `cuisineType`/分類欄位建立餐廳圖片映射表，並透過該映射自動選用本地靜態資產以維持一致性與低維護成本。
- **FR-016 (Reservation - Availability)**: 前台 MUST 提供日期、人數選擇 UX，呼叫 `/restaurants/{id}/availability` 與 `/availability/detail` 顯示可預約時段與剩餘席次。
- **FR-017 (Reservation - Create/Cancel/Modify)**: 使用者 MUST 能建立、取消與修改訂位（/reservations、/reservations/cancel、PATCH /reservations），並即時更新 UI（成功提示或 sold out 錯誤）。
- **FR-018 (Reservation - Self Service)**: 系統 MUST 提供「我的訂位」與「以訂位碼查詢」兩種入口（/reservations/my、/reservations/code、/reservations/short）。
- **FR-019 (Restaurant Admin - Dashboard)**: 餐廳管理員登入後 MUST 能查看每日預約摘要、剩餘座位、即時預約列表與搜尋（/restaurants/{id}/reservations）。
- **FR-020 (Restaurant Admin - Timeslot/Buckets)**: 管理端 MUST 允許調整 timeslots 與 tableBuckets（PATCH /restaurants/{id}``, `/timeslots`），並在有 active 予約時顯示警告或阻擋（處理 409）。
- **FR-021 (Restaurant Admin - Availability View)**: 管理端 MUST 顯示 `/availability/detail` 的 byPartySize、totals 視覺化表格或卡片，方便排程。
- **FR-022 (Restaurant Admin - Admins)**: 系統 MUST 允許列出、邀請、移除餐廳管理員（GET/POST/DELETE `/restaurants/{id}/admins`），並限制至少一名 active admin。
- **FR-023 (Role & Auth)**: UI MUST 依 Account 角色顯示對應頁面：一般使用者僅能操作訂位；餐廳管理員可進入管理面板並需 RBAC 驗證。
- **FR-024 (Error Handling)**: 對於 API 業務錯誤 `sold_out`、`no_capacity_for_party_size`、`already_reserved_this_restaurant`、`cannotModifyTimeslotActive` 等 MUST 提供對應提示與 fallback 行為。

### Non-Functional Requirements *(mandatory)*

- **NFR-001 (Performance)**: 視覺素材導入後，核心頁面首屏可用內容顯示時間不可比現況退化超過 20%，且 MUST 以 Lighthouse/Web Vitals 報告記錄前後指標。
- **NFR-002 (Accessibility)**: 所有新增 icon 與圖片區塊需有可讀替代文字或語意標記。
- **NFR-003 (Observability)**: 圖片載入失敗與主要頁面渲染錯誤需可被記錄。
- **NFR-004 (Security/Privacy)**: 圖片來源必須使用可信任網域與公開可用素材，不得引入需私鑰存取的資源。
- **NFR-005 (Code Quality)**: PR 合併前必須通過 `npm run lint`、`npm run typecheck`、`npm run test`。
- **NFR-006 (Deploy Readiness)**: 部署到 Vercel Preview 後，需完成核心流程 smoke test 並確認無阻斷性視覺問題。
- **NFR-007 (Visual QA)**: 每個受影響頁面 MUST 提供桌機與手機截圖對照，並完成 PM sign-off 後方可發布。
- **NFR-008 (Readability)**: 深色主題採混合對比策略：標題/關鍵操作維持高對比，內文維持中對比以兼顧可讀性與視覺舒適度。
- **NFR-009 (Security/RBAC)**: 餐廳管理功能 MUST 僅在具備管理員權限時顯示；所有管理 API 呼叫需帶權限 token 且無論 UI 或 API 均不得洩漏非授權資訊。
- **NFR-010 (Audit/Observability)**: 針對訂位建立/取消/修改與管理端調整 timeslot/table bucket/管理員操作，需發送 telemetry event 以利稽核。
- **NFR-011 (Usability)**: 訂位流程 3 步內完成，並在 10 秒內回應可預約結果；若超時需顯示 fallback 且不造成 UI 卡死。
- **NFR-012 (Localization)**: 訂位與管理端所有新文案需提供中英文對照，並確保日期/時間顯示符合在地格式。

### Technical Stack & Dependencies *(mandatory for frontend)*

- **TS-001 (Framework)**: 維持 Vue 3 + TypeScript。
- **TS-002 (UI Library)**: 導入 `ant-design-vue` 與 `@ant-design/icons-vue` 作為主要視覺元件來源。
- **TS-003 (Asset Strategy)**: 餐廳風格圖片採本地靜態資產（`public/images/restaurants`）並搭配 fallback。
- **TS-004 (Testing Unit/Component)**: 以 `vitest` + `@vue/test-utils` 驗證新 UI 渲染與狀態顯示。
- **TS-005 (Quality Gates)**: 合併前需通過 `eslint`、`prettier`、`vue-tsc`、`vitest`。
- **TS-006 (Deployment)**: 以 Vercel 為預設部署平台，並保留 `vercel.json` 的 SPA rewrite 設定。

## Deployment & Release

- Preview 部署 MUST 在每次 UI 變更後可用，供設計與功能驗收。
- Production 部署前 MUST 完成 smoke test：登入 → 餐廳列表 → 餐廳詳情 → 登出。
- 本次改版不使用外部圖片 CDN，避免外部依賴造成破圖或授權風險。
- 發布說明 MUST 記錄本次 UI 變更重點、受影響頁面與回滾方式。
- 部署檢查 MUST 覆蓋環境變數、`public/images/restaurants/meta.json` 與實際資產一致性、Vue Router history rewrite、Lighthouse 前後報告與 timeout/permission 驗證紀錄。

### Key Entities *(include if feature involves data)*

- **UiThemeConfig**: 視覺設定（色彩、圓角、間距、字級）在頁面元件的使用規範。
- **RestaurantVisualAsset**: 餐廳卡片/詳情使用的圖片與 fallback 資料。
- **RestaurantInfoIconMap**: 餐廳資訊欄位與 icon 的對應表。
- **RestaurantImageMapping**: 以 `cuisineType` 或分類欄位為 key 映射到本地靜態圖片（含 fallback）以保證一致性。
- **Reservation**: `id`, `restaurantId`, `date`, `start`, `end`, `partySize`, `status`, `code`, `shortToken`，供前台與管理端顯示與操作。
- **AvailabilitySlot**: `start`, `end`, `capacity`, `reserved`, `available`, `byPartySize[]` 等，用於計算與視覺化可用座位。
- **TableBucket**: `{size: number, capacity: number}` 映射，供管理端編輯與顯示。
- **RestaurantAdmin**: `id`, `userId`, `name`, `email`，管理端運營者資料。

## Assumptions

- 目前核心頁面（登入、列表、詳情）已存在且可運作，這次僅做視覺與素材升級。
- 餐廳圖片可先使用專案內建預設圖與公開授權素材。
- 本次不新增後端欄位；若缺圖片資料，由前端映射預設資產。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% 現有頁面與共用元件完成 Ant Design 視覺套用且功能不回歸。
- **SC-002**: 90% 以上測試使用者可在 10 秒內辨識列表卡片中的主要資訊區塊。
- **SC-003**: 圖片載入失敗情境下，100% 目標區塊可顯示 fallback，不出現破圖。
- **SC-004**: 視覺改版後主要流程（登入→列表→詳情）任務完成率維持在 95% 以上。
- **SC-005**: timeout 與 permission-denied 狀態於測試環境 100% 可重現，並於 2 秒內提供 retry/重新登入 CTA。
- **SC-006**: Lighthouse (or Web Vitals) 報告顯示 FCP/TTI 退化 ≤20%，並附於 release artifact。
- **SC-007**: 訂位流程成功率 ≥ 95%，`sold_out` / `already_reserved` 等業務錯誤均能以對應文案呈現並提供再選時段。
- **SC-008**: 餐廳管理端可在 1 分鐘內完成 timeslot/table bucket 更新並同步看到影響（包含 409 錯誤提示）。
- **SC-009**: 管理端預約列表可依日期/時段正確載入並過濾，測試涵蓋 3 種以上的 partySize 場景。
