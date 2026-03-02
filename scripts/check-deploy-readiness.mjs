#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const requiredEnvKeys = ['VITE_API_BASE_URL'];
const logger = globalThis.console ?? {
  info: () => {},
  error: () => {}
};

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return fs
    .readFileSync(filePath, 'utf-8')
    .split(/\r?\n/)
    .filter(Boolean)
    .reduce((acc, line) => {
      const [key, ...rest] = line.split('=');
      if (!key) return acc;
      acc[key.trim()] = rest.join('=').trim();
      return acc;
    }, {});
};

const collectEnv = () => {
  const env = { ...process.env };
  const envLocal = parseEnvFile(path.join(projectRoot, '.env.local'));
  const envExample = parseEnvFile(path.join(projectRoot, '.env.example'));
  return { ...envExample, ...envLocal, ...env };
};

const ensureEnv = (envValues) => {
  const missing = requiredEnvKeys.filter((key) => !envValues[key]);
  return missing.length ? [`缺少環境變數: ${missing.join(', ')}`] : [];
};

const ensureImageMeta = () => {
  const errors = [];
  const metaPath = path.join(projectRoot, 'public', 'images', 'restaurants', 'meta.json');
  if (!fs.existsSync(metaPath)) {
    return ['找不到 public/images/restaurants/meta.json'];
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  if (!Array.isArray(meta.mapping)) {
    return ['meta.json 缺少 mapping 陣列'];
  }
  meta.mapping.forEach((entry, index) => {
    if (!entry.cuisineType || !entry.image || !entry.alt) {
      errors.push(`meta.json 第 ${index + 1} 筆缺少必要欄位`);
      return;
    }
    const assetPath = path.join(projectRoot, 'public', 'images', 'restaurants', entry.image);
    if (!fs.existsSync(assetPath)) {
      errors.push(`找不到圖片資產 ${entry.image} (for cuisineType: ${entry.cuisineType})`);
    }
  });
  return errors;
};

const ensureVercelRewrite = () => {
  const errors = [];
  const vercelPath = path.join(projectRoot, 'vercel.json');
  if (!fs.existsSync(vercelPath)) {
    return ['缺少 vercel.json 以維持 SPA rewrite'];
  }
  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
  const rewrites = Array.isArray(vercelConfig.rewrites) ? vercelConfig.rewrites : [];
  const hasSpaRewrite = rewrites.some((rewrite) => rewrite.destination === '/' && rewrite.source === '/(.*)');
  if (!hasSpaRewrite) {
    errors.push('vercel.json 缺少 /(.*) -> / rewrite');
  }
  return errors;
};

const errors = [
  ...ensureEnv(collectEnv()),
  ...ensureImageMeta(),
  ...ensureVercelRewrite()
];

if (errors.length) {
  logger.error('\n❌ Deploy readiness check 失敗:');
  errors.forEach((err) => logger.error(` - ${err}`));
  process.exit(1);
}

logger.info('✅ Deploy readiness check 通過：環境變數、圖片資產、Vercel rewrite 皆已就緒');
