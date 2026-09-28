import assert from 'node:assert/strict';
import {summarize} from '../demo/summary.mjs';
assert.deepEqual(summarize([
  {month:'2026-08',netPnl:-77}, {month:'2026-07',netPnl:200},
  {month:'2026-07',netPnl:3}
]), [{month:'2026-07',value:203},{month:'2026-08',value:-77}]);
assert.deepEqual(summarize([]), []);
assert.throws(() => summarize([{month:'2026-13',netPnl:1}]));
assert.throws(() => summarize([{month:'2026-01',netPnl:'100'}]));
assert.throws(() => summarize([{month:'2026-01',netPnl:Infinity}]));
assert.throws(() => summarize({}));
console.log('PASS: 월별 합산, 정렬, 손실, 빈 배열, 잘못된 입력');
