# mealhubFrontend

## 安裝步驟

1. 切換到 Node 20（建議）
   ```bash
   nvm install 20
   nvm use 20
   ```
2. 安裝依賴
   ```bash
   npm install
   ```
3. 設定環境變數（若尚未建立）
   ```bash
   cp .env.example .env.local
   ```

## 啟動指令

- 本機開發：
  ```bash
  npm run dev
  ```
- 打包：
  ```bash
  npm run build
  ```
- 預覽打包結果：
  ```bash
  npm run preview
  ```

## 後台入口

- 路由：`/admin/:restaurantId`
- 範例：`http://localhost:5173/admin/1`
- 也可從餐廳詳情頁點「餐廳後台」進入
- 需先登入且具管理員權限；無權限會導到 permission denied 頁

## 測試指令

- Lint：
  ```bash
  npm run lint
  ```
- Type check：
  ```bash
  npm run typecheck
  ```
- 單元 / 元件測試（Vitest）：
  ```bash
  npm run test
  ```
- E2E（Playwright）：
  ```bash
  npm run test:e2e
  ```
