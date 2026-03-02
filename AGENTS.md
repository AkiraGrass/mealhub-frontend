# mealhubFrontend Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-28

## Active Technologies
- TypeScript 5.x + Vue 3 SFC (`<script setup>`) + ant-design-vue 4.x, @ant-design/icons-vue, Vue Router 4, Pinia 2, Axios 1.x (001-ant-design-restaurant-ui)
- 瀏覽器記憶體 accessToken + `localStorage` refreshToken（沿用現有策略，無新增後端儲存） (001-ant-design-restaurant-ui)
- N/A（本功能不新增資料儲存模型） (001-ant-design-restaurant-ui)
- Browser memory（`accessToken`）+ `localStorage`（`refreshToken`） (001-mealhub-frontend-mvp)
- TypeScript 5.x + Vue 3 + Vue Router 4, Pinia 2, Axios 1.x (001-mealhub-frontend-mvp)
- TypeScript 5.7 + Vue 3.5 SFC (`<script setup>`) compiled through Vite 6 pipelines. + `ant-design-vue@4`, `@ant-design/icons-vue@7`, Vue Router 4 history mode, Pinia 2 stores, Axios 1 client/interceptors, MSW 2 mocks, Vitest + @vue/test-utils, Playwright, ConfigProvider theme tokens. (001-ant-design-restaurant-ui)
- Browser memory `accessToken` (Pinia) + `localStorage` `refreshToken`; remote Restaurant/Reservation REST APIs remain authoritative (no new persistence). (001-ant-design-restaurant-ui)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x + Vue 3: Follow standard conventions

## Recent Changes
- 001-ant-design-restaurant-ui: Added TypeScript 5.7 + Vue 3.5 SFC (`<script setup>`) compiled through Vite 6 pipelines. + `ant-design-vue@4`, `@ant-design/icons-vue@7`, Vue Router 4 history mode, Pinia 2 stores, Axios 1 client/interceptors, MSW 2 mocks, Vitest + @vue/test-utils, Playwright, ConfigProvider theme tokens.
- 001-ant-design-restaurant-ui: Added TypeScript 5.x + Vue 3 SFC (`<script setup>`) + ant-design-vue 4.x, @ant-design/icons-vue, Vue Router 4, Pinia 2, Axios 1.x
- 001-ant-design-restaurant-ui: Added token storage detail（瀏覽器記憶體 accessToken + `localStorage` refreshToken）
<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
