# Phase 0 Research - Ant Design Restaurant Visual Upgrade

## Decision 1: UI 元件庫策略
- Decision: 全面採用 `ant-design-vue` + `@ant-design/icons-vue`。
- Rationale: 風格一致、元件完整、可快速覆蓋多頁改版。
- Alternatives considered:
  - 混用自訂 SVG：維護成本提升，風格易分裂。
  - 保持原生樣式：無法達成一致視覺升級目標。

## Decision 2: 圖片資產來源
- Decision: 使用本地靜態資產 `public/images/restaurants`。
- Rationale: 降低部署與授權風險，避免外部 CDN 可用性問題。
- Alternatives considered:
  - 外部 CDN：上手快但有來源不穩與合規追蹤成本。
  - 混合來源：運維複雜度較高。

## Decision 3: 圖片載入策略
- Decision: 列表圖片 lazy-load；詳情主圖即時載入。
- Rationale: 平衡首屏效能與詳情頁沉浸感。
- Alternatives considered:
  - 全部 eager：列表首屏壓力較高。
  - 全部 lazy：詳情主圖體驗不穩。

## Decision 4: 視覺改版範圍
- Decision: 擴展到所有現有頁面與共用元件。
- Rationale: 避免新舊風格混用，降低後續整併成本。
- Alternatives considered:
  - 僅改核心三頁：短期快，但一致性不足。

## Decision 5: 驗收與發布門檻
- Decision: 功能驗收 + 桌機/手機截圖對照 + PM sign-off。
- Rationale: 讓視覺品質具體可追蹤，不只看功能是否可用。
- Alternatives considered:
  - 只做功能驗收：無法控管視覺品質。
  - 多輪設計會審：時程成本高於本次需求目標。

## Decision 6: 餐廳圖片映射策略
- Decision: 依 API `cuisineType`/分類欄位建立 `RestaurantImageMapping`，統一選用本地靜態資產。
- Rationale: 無須新增 API、維護成本低且可確保同類餐廳視覺一致；映射更新僅調整常數檔即可。
- Alternatives considered:
  - 逐店指定圖片：需維護大量 id → asset 映射，易與資料不同步。
  - 完全由後端回傳圖片：本次不動後端，成本較高。

## Decision 7: Ant Design 主題自訂方式
- Decision: 透過 `ConfigProvider` token override + CSS variables 控制深色背景、金色 accent、字級間距。
- Rationale: 與 Ant Design 生態一致，避免自訂樣式散落； token 亦可被測試或 Storybook 驗證。
- Alternatives considered:
  - 以全域 SCSS 直接覆寫：維護困難且易與元件更新衝突。
  - 建立獨立設計系統：超出本次需求範圍。

## Decision 8: 測試與觀測策略
- Decision: 以 Vitest + @vue/test-utils 驗證元件狀態、Playwright 覆蓋登入→列表→詳情→訂位，並透過 `msw` 模擬 API 狀態；圖片錯誤/渲染失敗記錄於 telemetry/composable。
- Rationale: 與現有技術棧相容，覆蓋規格要求之 loading/empty/error 與 fallback 行為。
- Alternatives considered:
  - 僅以人工檢查：無法保證迭代品質。
  - 新增 Cypress/其他測試框架：增加維護成本，與現有工具重疊。

## Decision 9: 訂位流程架構
- Decision: 建立 `reservations.store.ts` + `useReservations` composable，以 Pinia 管理 `/availability`, `/availability/detail`, `/reservations`, `/reservations/cancel`, `PATCH /reservations` 的狀態與錯誤，並由 Ant Design Form/Steps/Result 元件驅動 3 步驟 UX。
- Rationale: 集中處理 loading/empty/error/sold_out/permission 狀態，確保 customer 與詳情頁共用同一邏輯並覆蓋 telemetry。
- Alternatives considered:
  - 各頁自行呼叫 API：易產生重複邏輯與不一致的錯誤處理。
  - 依賴現有詳情頁邏輯：無法覆蓋「我的訂位」與代碼查詢入口。

## Decision 10: 自助訂位入口策略
- Decision: 提供「我的訂位」(需登入，呼叫 `/reservations/my`) 與「輸入訂位碼」(支援 `/reservations/code` + `/reservations/short`) 兩入口，並以相同 state components 呈現。
- Rationale: 滿足 FR-018 要求，讓忘記登入的使用者仍可查詢；共用 UI 可保持一致且減少維護成本。
- Alternatives considered:
  - 僅保留登入入口：無法覆蓋 code 查詢需求。
  - 各入口各自實作畫面：造成雙倍維護與驗收成本。

## Decision 11: 管理員權限偵測與保護
- Decision: 透過 `/restaurants/{id}/admins` 回應判定使用者是否在清單中並快取於 `admin.store.ts`，Router guard 依據此狀態開放或隱藏 admin routes。
- Rationale: 依規格可避免後端 schema 更動，並確保管理端只有必要人員可見；同時可在 UI 顯示 permission-denied 狀態與 CTA。
- Alternatives considered:
  - 依 access token claims 判斷：目前 token 無該資訊且會牽涉後端。
  - 新增 `/me` 欄位：違背「不調整後端」限制。

## Decision 12: 管理端操作與遙測
- Decision: 使用 Ant Design Table/Statistic/Card 呈現 `/restaurants/{id}/reservations` 與 `/availability/detail`，以 Drawer/Form 編輯 timeslot/table bucket/admin 帳號；所有建立/取消/修改/管理員變更事件透過 `trackEvent` 發送 `reservation_{action}` 或 `admin_{action}` 事件（含結果）。
- Rationale: 滿足 FR-019~022 與 NFR-010，並可在 telemetry 中追蹤成功/409 錯誤及使用情形，便於稽核。
- Alternatives considered:
  - 以自訂卡片不結構化呈現：難以排序/篩選且無法搭配 Ant Design 表格樣式。
  - 省略 telemetry：無法符合稽核要求。
