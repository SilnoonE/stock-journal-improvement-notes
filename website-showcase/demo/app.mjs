import {summarize} from './summary.mjs';
const $ = selector => document.querySelector(selector);
const money = value => new Intl.NumberFormat('ko-KR', {style:'currency', currency:'KRW', maximumFractionDigits:0}).format(value);
let current = [];
let frame;
function scheduleDraw() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(draw);
}
function show(rows) {
  const summary = summarize(rows); // 잘못된 입력이면 기존 화면은 유지합니다.
  current = summary;
  $('#count').textContent = `${rows.length}건`;
  $('#total').textContent = money(summary.reduce((total, item) => total + item.value, 0));
  $('#values').replaceChildren(...summary.map(item => {
    const li = document.createElement('li');
    li.textContent = `${item.month}: ${money(item.value)}`;
    return li;
  }));
  $('#report').hidden = false;
  scheduleDraw(); // 보여준 후 크기를 측정합니다.
  $('#message').textContent = rows.length ? '가상 기록을 분석했습니다.' : '표시할 기록이 없습니다.';
}
function draw() {
  if ($('#report').hidden) return;
  const canvas = $('#chart');
  const width = canvas.getBoundingClientRect().width;
  if (!width) return;
  const height = 260, dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const limit = Math.max(1, ...current.map(item => Math.abs(item.value)));
  const left = 12, right = width - 12, zero = 120, usable = 92;
  ctx.strokeStyle = '#b8c9de';
  ctx.beginPath(); ctx.moveTo(left, zero); ctx.lineTo(right, zero); ctx.stroke();
  if (!current.length) {
    ctx.fillStyle = '#526379'; ctx.font = '14px sans-serif';
    ctx.fillText('표시할 기록이 없습니다.', 14, 70); return;
  }
  const slot = (right - left) / current.length;
  const labelStep = Math.max(1, Math.ceil(current.length / Math.max(1, Math.floor(width / 90))));
  current.forEach((item, i) => {
    const bar = item.value / limit * usable;
    const x = left + slot * i + slot * .18;
    ctx.fillStyle = item.value >= 0 ? '#1777f2' : '#e03a4d';
    ctx.fillRect(x, Math.min(zero, zero - bar), slot * .64, Math.max(1, Math.abs(bar)));
    if (i % labelStep === 0) {
      ctx.fillStyle = '#526379'; ctx.font = '12px sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(item.month, left + slot * (i + .5), 245);
    }
  });
}
$('#sample').addEventListener('click', () => show([
  {month:'2026-07',netPnl:203}, {month:'2026-08',netPnl:-77},
  {month:'2026-09',netPnl:320}, {month:'2026-09',netPnl:80}
]));
$('#file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 1024 * 1024) throw new Error('1MB 이하의 연습 파일을 선택해 주세요.');
    show(JSON.parse(await file.text()));
  } catch (error) {
    $('#message').textContent = `불러오기 실패: ${error.message}`;
  }
});
new ResizeObserver(scheduleDraw).observe($('#chart').parentElement);
