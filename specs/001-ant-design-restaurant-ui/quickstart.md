# Quickstart - Ant Design Restaurant Visual Upgrade

## 1) Prerequisites
- Node.js 20+
- npm 10+
- `.env.local` with `VITE_API_BASE_URL` 指向對應後端（可由 `.env.example` 複製）
- `public/images/restaurants/` 與 `meta.json` 同步完成（含 fallback 圖片）

## 2) Install Dependencies

```bash
npm install
```

## 3) Run Local Dev Server

```bash
npm run dev
```

Access http://localhost:5173，使用測試帳號登入並驗證桌機/手機 breakpoint。

## 4) Required Commands Before PR

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e   # 覆蓋登入→列表→詳情→訂位流程
```

## 5) Visual Verification Checklist
1. 登入頁使用 Ant Design 表單/按鈕，錯誤訊息沿用統一樣式。
2. 餐廳列表卡片、分頁、狀態提示採用深色+金色主題；列表圖片 lazy-load 並有 skeleton。
3. 餐廳詳情顯示 hero 圖、資訊 icon map、可辨識 CTA；詳情主圖 eager-load。
4. 圖片失敗或 icon 缺漏時顯示 fallback，且記錄 telemetry warning。
5. timeout、permission-denied、empty、error 狀態顯示統一元件與 CTA。
6. 金色填滿面積 <15%，卡片主要段落間距 16~24px；附桌機/手機截圖佐證。

## 6) Functional Validation Checklist
1. **Availability**：在詳情或訂位頁輸入日期/人數，驗證 `/restaurants/{id}/availability` 與 `/availability/detail` 可成功、sold_out、網路逾時、permission-denied 等情境。
2. **Create Reservation**：提交訂位後顯示成功訊息與訂位碼；測試 `sold_out`、`already_reserved_this_restaurant`、`no_capacity_for_party_size` 錯誤文案與備選建議。
3. **My Reservations**：登入後於「我的訂位」載入 `/reservations/my`，可展開詳情、取消（`/reservations/cancel`）與修改（`PATCH /reservations`）。
4. **Lookup by Code**：未登入情境下使用 `/reservations/code` 或 `/reservations/short` 查詢，顯示結果與錯誤提示。
5. **Admin Dashboard**：以管理員帳號登入，確認 `/restaurants/{id}/reservations` 和 `/availability/detail` 以 Ant Design Table/Card 呈現並支援日期/時段過濾。
6. **Timeslot & Table Buckets**：透過 Drawer/Form 編輯 timeslot 與 bucket（`PATCH /restaurants/{id}`, `/timeslots`），模擬 409 `cannotModifyTimeslotActive`、`cannotModifyTimeslotsActive`，UI 需阻擋並提示。
7. **Admin Management**：在管理端新增/移除管理員（`/restaurants/{id}/admins`），驗證至少一名 active admin 條件與 permission-denied 畫面。
8. **State Guards**：非管理員造訪管理頁，應顯示 permission-denied 並導回登入；access token 過期後 refresh token 流程仍可支援。

## 7) Observability & Telemetry
1. `trackEvent` MUST 在以下操作觸發：
   - `restaurants_list_*`（成功/timeout/permission-denied/失敗）
   - `reservation_{create|cancel|modify}_{success|error}`（包含錯誤碼）
   - `admin_{timeslot|bucket|member}_{success|error}`
2. 觸發任一錯誤（timeout、sold_out 等）時在 DevTools Console 或 mock logger 可看到事件 payload。
3. 圖片載入失敗需記錄 `asset_fallback_shown`，包含 `assetKey` 與原因。
4. 於 Playwright smoke 測試加上 basic assertion 確認 telemetry hook 無例外。

## 8) Deployment Verification (Vercel Preview/Production)
1. 建立 Preview 部署並檢視登入→列表→詳情→訂位→我的訂位→管理端全流程。
2. 確認環境變數、`public/images/restaurants/meta.json` 與實體資產一致；執行 `npm run check:deploy`。
3. 以 Lighthouse CLI 或 Chrome DevTools 產出升級前後報告（存於 `docs/ui-validation/001-ant-design-restaurant-ui/lighthouse/`），確保 FCP/TTI 退化 ≤20%。
4. 提供桌機與手機截圖對照並加註密度/金色比重。
5. 在 Preview 驗證 timeout、permission-denied、sold_out、409 與 RBAC 情境，附錄錄影或截圖。
6. PM sign-off 後發布 Production，並在 smoke test 中再次驗證 `/reservations`、`/admin` 關鍵操作。

## 9) Release Note Template
- 變更摘要：
- 影響頁面：登入／餐廳列表／餐廳詳情／訂位／我的訂位／管理端 dashboard & 設定
- 新增資產：`public/images/restaurants/*`、`RestaurantImageMapping`
- 風險與回滾策略：
- Telemetry / Logging Link：
- Lighthouse 報告（Before/After）：
- timeout/permission/409 測試證據：
- PM sign-off 與 QA 截圖：

## 10) Latest Verification Evidence (2026-03-01)
- Command logs: `docs/ui-validation/001-ant-design-restaurant-ui/validation.md`
- Lighthouse artifacts:
  - `docs/ui-validation/001-ant-design-restaurant-ui/lighthouse/before.json`
  - `docs/ui-validation/001-ant-design-restaurant-ui/lighthouse/after.json`
  - `docs/ui-validation/001-ant-design-restaurant-ui/lighthouse/summary.md`
- Deploy readiness result: `node scripts/check-deploy-readiness.mjs` ✅
- 注意：目前本機為 Node.js 16.20.1，`typecheck/test/test:e2e` 受版本限制未能完成，需先升級到 Node 20 LTS 後重跑。
