// 실제 검토에서 확인한 변경 패턴을 축약한 독립 실행 예제.
// 앱 원본 파일이나 배포용 복원 구현이 아닙니다. 식별자와 모델은 일반화했습니다.
data class Entry(
    val id: Long, val time: Long, val amount: Double,
    val memo: String = "", val fee: Double = 0.0,
    val exchangeRate: Double = 1.0, val uid: String = ""
)

// 1. 홈 표시: 전체 입력을 유지하면서 표시만 제한합니다.
fun beforeVisible(entries: List<Entry>) = entries
fun afterVisible(entries: List<Entry>) = entries.sortedWith(
    compareByDescending<Entry> { it.time }.thenByDescending { it.id }
).take(10)

// 2. 편집: 생성자 기본값으로 재구성하면 숨은 필드가 사라집니다.
fun beforeEdit(old: Entry, memo: String) = Entry(old.id, old.time, old.amount, memo)
fun afterEdit(old: Entry, memo: String) = old.copy(memo = memo)

// 3. 차트: 전체 구간 대신 선택 기간과의 교집합으로 집계합니다.
fun beforeBucket(entries: List<Entry>, bucketStart: Long, bucketEnd: Long) =
    entries.filter { it.time >= bucketStart && it.time < bucketEnd }.sumOf { it.amount }
fun afterBucket(entries: List<Entry>, bucketStart: Long, bucketEnd: Long,
                reportStart: Long, reportEndExclusive: Long): Double {
    val start = maxOf(bucketStart, reportStart)
    val end = minOf(bucketEnd, reportEndExclusive)
    if (start >= end) return 0.0
    return entries.filter { it.time >= start && it.time < end }.sumOf { it.amount }
}

// 4. 비용 문자열: 구버전에 없는 값과 손상된 값을 구분합니다.
fun beforeOptionalFee(raw: String?) = raw?.toDoubleOrNull() ?: 0.0
fun afterOptionalFee(raw: String?): Double {
    if (raw == null) return 0.0 // 이 예제에서 정의한 구버전 호환 정책
    return raw.toDoubleOrNull() ?: error("Invalid fee")
}

// 5. 즐겨찾기: 교체와 추가를 구분합니다.
fun beforeFavorites(current: Set<String>, incoming: Set<String>) = incoming
fun afterFavorites(current: Set<String>, incoming: Set<String>) = current + incoming

fun main() {
    val source = (1L..15L).map { Entry(it, it, 1.0) }
    check(afterVisible(source).size == 10)
    check(afterVisible(source).first().id == 15L)
    check(source.size == 15) // 전체 기록은 유지
    val old = Entry(1, 1, 100.0, fee = 2.0, exchangeRate = 1350.0, uid = "sample")
    check(beforeEdit(old, "changed").fee == 0.0)
    check(afterEdit(old, "changed") == old.copy(memo = "changed"))
    val dividends = listOf(Entry(1, 1, 30.0), Entry(2, 15, 20.0))
    check(beforeBucket(dividends, 0, 31) == 50.0)
    check(afterBucket(dividends, 0, 31, 10, 21) == 20.0)
    check(afterOptionalFee(null) == 0.0)
    check(runCatching { afterOptionalFee("invalid") }.isFailure)
    check(afterFavorites(setOf("a", "b"), setOf("a", "c")) == setOf("a", "b", "c"))
    println("PASS: display limit, edit preservation, period intersection, invalid fee, favorites union")
}
