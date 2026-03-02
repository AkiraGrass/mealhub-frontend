# UI Validation Artifacts

集中管理 Ant Design 餐廳改版的視覺、效能與驗收證據。完成各階段後勾選對應項目，並將實際檔案放入同名資料夾。

## 截圖 Checklist

- [ ] Desktop /login → `desktop/login-page.png`
- [ ] Desktop /restaurants → `desktop/restaurants-list.png`
- [ ] Desktop /restaurants/:id → `desktop/restaurant-detail.png`
- [ ] Desktop admin dashboard → `desktop/admin-dashboard.png`
- [ ] Mobile /login → `mobile/login-page.png`
- [ ] Mobile /restaurants → `mobile/restaurants-list.png`
- [ ] Mobile /restaurants/:id → `mobile/restaurant-detail.png`
- [ ] Mobile admin dashboard → `mobile/admin-dashboard.png`

> 建議同頁再附 loading / empty / error 狀態截圖供 PM 驗證。

## Lighthouse & 效能證據

| 檔案 | 說明 | 狀態 |
| --- | --- | --- |
| `lighthouse/before.json` | 改版前指標（需附量測時間與網路環境） | ☐ |
| `lighthouse/after.json` | 改版後指標（FCP/TTI 退化 ≤20%） | ☐ |
| `lighthouse/summary.md` | 文字摘要：差異、改善項與 action items | ☐ |

## Timeout / Permission / Telemetry

- [ ] `timeout-permission.mp4`：展示 timeout 與 permission-denied UI + CTA
- [ ] `telemetry-sample.json`：截取 `trackEvent` payload（含 reservation/admin 事件）
- [ ] `asset-fallback-log.txt`：記錄圖片 fallback 觸發案例與 `asset_fallback_shown` 事件

## 資訊密度 / 金色覆蓋率

- [ ] `density-checklist.md`：更新每頁段落間距 (16~24px) 與金色面積 (<15%) 量測結果
- [ ] `docs/ui-validation/001-ant-design-restaurant-ui/density-checklist.md#evidence`：附上標註圖層或 Figma 連結

## PM Sign-off

- Status: Pending / Approved
- Owner:
- Date:
- Evidence: 連結至上述截圖、Lighthouse、timeout/permission 錄影

## 2026-03-01 驗證更新

- 執行記錄：`docs/ui-validation/001-ant-design-restaurant-ui/validation.md`
- Deploy readiness：`scripts/check-deploy-readiness.mjs` 已通過
- Lighthouse 目前狀態：`docs/ui-validation/001-ant-design-restaurant-ui/lighthouse/summary.md`（待 Node 升級後補齊正式報告）
- Node 版本限制：目前本機 Node.js 16.20.1，`typecheck/test/test:e2e` 需於 Node 20 LTS 重新執行
