/* 把 demo/js/scenario.js 的劇本資料抽成 JSON，供 import_scenario.php 匯入 MySQL。
 *
 * scenario.js 是給瀏覽器用的裸 script（頂層 const，沒有 export），
 * 所以這裡用 new Function 包一層再把要的變數 return 出來，
 * 不必改動 demo 的原始檔——demo 仍可獨立打開跑。
 *
 * 用法：node api/tools/export_scenario.mjs [scenario.js 路徑] > scenario.json
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SRC = resolve(here, '../../../../demo/js/scenario.js');

const src = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_SRC;
const code = readFileSync(src, 'utf8');

const EXPORTS = [
  'SCENARIO',
  'PHASE_SECONDS',
  'MAX_INTERROGATIONS',
  'ZONES',
  'RANKING_QUESTION',
  'SHOW_OWN_CLASSIFICATION',
];

let data;
try {
  data = new Function(`${code}\n;return { ${EXPORTS.join(', ')} };`)();
} catch (e) {
  console.error(`無法解析 ${src}：${e.message}`);
  process.exit(1);
}

// 匯出前先驗一次結構，避免把半殘的資料灌進資料庫
const errors = [];
const S = data.SCENARIO;

if (!S || !Array.isArray(S.levels)) errors.push('SCENARIO.levels 不存在');
if (!S || !Array.isArray(S.characters)) errors.push('SCENARIO.characters 不存在');

const charKeys = (S?.characters ?? []).map((c) => c.key);

for (const L of S?.levels ?? []) {
  const at = `關卡 ${L.no}`;
  const keys = Object.keys(L.testimonies ?? {});
  if (keys.length !== charKeys.length) {
    errors.push(`${at}：發言數 ${keys.length}，角色數 ${charKeys.length}`);
  }
  for (const k of charKeys) {
    const t = L.testimonies?.[k];
    if (!t) { errors.push(`${at}：缺少角色 ${k} 的發言`); continue; }
    if (t.correct !== 'reasonable' && t.correct !== 'flaw') {
      errors.push(`${at} 角色 ${k}：correct 值異常（${t.correct}）`);
    }
  }
  // reasonableCount 是文檔附錄的檢核值，對不上代表判定被改壞了
  const actual = charKeys.filter((k) => L.testimonies?.[k]?.correct === 'reasonable').length;
  if (actual !== L.reasonableCount) {
    errors.push(`${at}：reasonableCount 標 ${L.reasonableCount}，實際合理發言 ${actual}`);
  }
}

if (errors.length) {
  console.error('劇本資料驗證失敗：');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

process.stdout.write(JSON.stringify(data, null, 2));
