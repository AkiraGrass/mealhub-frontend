# UI Visual Contract - Ant Design Restaurant Upgrade

## Scope
- 受影響範圍：所有現有頁面與共用元件。
- 目標：統一 Ant Design 視覺、圖片與 icon 行為，不改變既有業務流程。

## UI Library Contract
- 頁面容器、表單、按鈕、提示、卡片 MUST 優先採用 `ant-design-vue`。
- icon MUST 採用 `@ant-design/icons-vue`，不得混用其他 icon 套件。

## Image Asset Contract
- 圖片來源 MUST 為 `public/images/restaurants`。
- 列表圖片 MUST 使用 lazy-load。
- 詳情主圖 MUST 使用 eager-load。
- 圖片載入失敗 MUST 顯示預設 fallback 圖，不可出現破圖。
- `RestaurantImageMapping` MUST 以 `cuisineType`/分類為 key，若未命中則回退預設圖並記錄 warning。

## State Rendering Contract
- loading：顯示一致載入元件與可讀訊息。
- empty：顯示一致空狀態文案。
- error：顯示錯誤訊息與重試/返回操作。

## Quality Gate Contract
- PR 前 MUST 通過：
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
- Preview 驗收 MUST 提供：
  - 桌機與手機截圖對照
  - PM sign-off 記錄

## Deployment Contract
- Vercel Preview MUST 可用於設計驗收。
- Production 前 MUST 完成 smoke flow：登入 → 列表 → 詳情 → 登出。
- `vercel.json` rewrite MUST 維持有效。
