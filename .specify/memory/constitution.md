<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles:
  - [PRINCIPLE_1_NAME] → I. 使用者價值優先
  - [PRINCIPLE_2_NAME] → II. 規格先行與明確範圍
  - [PRINCIPLE_3_NAME] → III. 可驗收與可測試
  - [PRINCIPLE_4_NAME] → IV. 一致性與可維護性
  - [PRINCIPLE_5_NAME] → V. 前端品質基線
- Added sections:
  - 技術與品質標準
  - 開發流程與品質閘門
  - Vue 專案標準配套（預設）
- Removed sections:
  - 無
- Templates requiring updates:
  - ✅ `.specify/templates/plan-template.md`
  - ✅ `.specify/templates/spec-template.md`
  - ✅ `.specify/templates/tasks-template.md`
- Deferred TODOs:
  - 無
-->

# MealHub Frontend Constitution

## Core Principles

### I. 使用者價值優先
所有功能需求 MUST 對應清楚的使用者問題與成功指標。若無法說明目標使用者、
使用情境與預期成效，該需求 MUST NOT 進入開發。優先順序 MUST 依使用者價值
與業務影響排序，而非僅以技術偏好決定。

### II. 規格先行與明確範圍
每個功能在實作前 MUST 完成規格澄清，至少包含 in-scope、out-of-scope、
依賴項、風險與邊界情境。開發過程中的新增需求 MUST 經過範圍評估與重排優先級，
以防止隱性擴張（scope creep）。

### III. 可驗收與可測試
每個使用者故事 MUST 有可操作的驗收條件（Acceptance Criteria），並以
Given/When/Then 或等效格式描述。功能完成定義 MUST 包含至少一項對應測試
（單元、元件、整合或端對端擇適），且測試結果可重現。

### IV. 一致性與可維護性
Vue 前端開發 MUST 優先沿用既有架構、命名、目錄與設計系統。新增模式、
套件或跨切面設計 MUST 先提出必要性與替代方案比較。程式變更 MUST 以最小可行
修改為原則，避免不必要的重構與風格漂移。

### V. 前端品質基線
所有功能 MUST 覆蓋 loading、empty、error、權限不足與逾時等狀態；
涉及 API 的流程 MUST 定義錯誤處理與重試策略。關鍵互動 MUST 具備可觀測性
（至少含事件追蹤或錯誤記錄）。效能與可及性 MUST 作為驗收項目的一部分。

## 技術與品質標準

- 技術棧以 Vue 生態為主，優先採用既有專案慣例（例如 Vue Router、Pinia、
  既有 UI 元件層與 API 存取層）。
- 元件設計 MUST 保持單一職責，跨頁共用邏輯 SHOULD 抽離為 composables 或
  service 層，避免在頁面元件中堆疊業務流程。
- 與後端介接 MUST 使用明確型別或資料契約（若專案使用 TypeScript，
  必須維持型別正確；若未使用，需以文件定義欄位契約）。
- 安全與隱私 MUST 預設啟用：不得在前端硬編敏感資訊、不得記錄個資於公開日誌、
  權限控制需有防呆與降級畫面。
- 主要互動流程 SHOULD 設定效能門檻（如初始載入、切頁、API 回應），超出門檻時
  必須提出優化或降級方案。

### Vue 專案標準配套（預設）

- 框架與語言：`vue`（優先 Vue 3）與 `typescript`（若專案已採 TS，新增功能 MUST
  維持型別完整）。
- 建置工具：`vite` 作為開發與打包工具，並透過環境變數檔管理不同環境設定。
- 路由與狀態：`vue-router` 與 `pinia`，狀態存取 SHOULD 經由 store/composable，
  不得在多處重複實作同一份狀態邏輯。
- API 層：優先使用集中式 HTTP client（例如 `axios` 封裝）與統一錯誤攔截策略。
- 程式品質：`eslint` + `prettier` +（若使用 TS）`vue-tsc` MUST 在合併前通過。
- 單元/元件測試：`vitest` + `@vue/test-utils`（必要時加 `jsdom`）作為預設。
- API 模擬：`msw` SHOULD 用於元件或整合層測試，避免直接依賴真實後端環境。
- E2E 測試：`playwright` 或 `cypress` 擇一，至少覆蓋關鍵 P1 使用者流程。
- Git Hooks：`husky` + `lint-staged` SHOULD 用於提交前的最低品質檢查。

## 開發流程與品質閘門

- 規劃階段 MUST 完成：使用者故事、驗收條件、邊界情境、非功能需求
  （效能/可及性/安全）。
- 實作階段 MUST 對應需求編號或故事編號，避免無追溯性的開發。
- 合併前 MUST 通過專案既有 lint 與測試流程；若有例外，需在 PR 明確記錄原因
  與補救計畫。
- 變更涉及 UI 行為時 SHOULD 附上畫面證據（截圖、錄影或互動說明）以利審查。
- 文件（規格、API 對接說明、操作說明）與程式交付同步更新，未更新文件視為
  未完整交付。
- 測試分層 MUST 清楚：單元測試驗證純邏輯、元件測試驗證互動與渲染、E2E 驗證
  跨頁核心流程；不得以單一層測試取代全部驗證責任。

## Governance

本憲章高於一般開發慣例，所有規格、計畫與任務文件 MUST 通過憲章檢核。
修訂流程如下：

- 修訂提案 MUST 說明變更動機、影響範圍、遷移策略與回溯相容性。
- 版本採語意化規則：
  - MAJOR：原則移除、重大重定義或不相容治理變更。
  - MINOR：新增原則、品質閘門或實質性規範擴充。
  - PATCH：文字澄清、錯字修正、非語意調整。
- 每次修訂 MUST 同步檢查 `.specify/templates/` 下相關模板的一致性。
- PR 與 Code Review MUST 顯式確認憲章遵循狀態；違反項目需有書面例外說明。

**Version**: 1.1.0 | **Ratified**: 2026-02-28 | **Last Amended**: 2026-02-28
