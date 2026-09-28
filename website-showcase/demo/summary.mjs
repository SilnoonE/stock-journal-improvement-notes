// 가상 데이터의 월별 합산만 수행하는 공개용 함수입니다.
export function summarize(rows) {
  if (!Array.isArray(rows) || rows.length > 10000) {
    throw new Error('10,000건 이하의 JSON 배열을 선택해 주세요.');
  }
  const months = new Map();
  for (const row of rows) {
    if (!row || typeof row.month !== 'string' ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(row.month) ||
        typeof row.netPnl !== 'number' || !Number.isFinite(row.netPnl) ||
        Math.abs(row.netPnl) > 1e12) {
      throw new Error('month(YYYY-MM)와 유한한 숫자 netPnl을 확인하세요.');
    }
    months.set(row.month, (months.get(row.month) || 0) + row.netPnl);
  }
  return [...months].sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({month, value}));
}
