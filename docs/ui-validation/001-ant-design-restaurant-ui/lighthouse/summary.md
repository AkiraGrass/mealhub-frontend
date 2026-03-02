# Lighthouse Summary (2026-03-01)

- Status: BLOCKED
- Before report: `before.json` (placeholder)
- After report: `after.json` (placeholder)

## Why blocked
- Current local runtime is Node.js 16.20.1.
- This project stack (`vite@6`, Playwright-based preview workflow) requires Node.js >= 18.

## Required rerun steps
1. Upgrade Node.js to 20 LTS (`nvm install 20 && nvm use 20`).
2. Start preview (`npm run build && npm run preview`).
3. Capture Lighthouse baseline and after reports.
4. Update this summary with real metrics and ensure FCP/TTI regression <= 20%.
