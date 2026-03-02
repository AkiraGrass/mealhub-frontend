# Lighthouse / Web Vitals 報告

- `before.json`：改版前 (main) 量測
- `after.json`：改版後 (feature) 量測
- 請以 `npm run lighthouse:compare` 或等效流程產生，並在 release note 填入報告連結。
- 驗證重點：FCP / TTI 退化 ≤ 20%，CLS 無明顯惡化。
