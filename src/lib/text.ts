/**
 * 네이버 사전 IPA 표기 정규화.
 * - <sup>│</sup>  → ˈ  (primary stress)
 * - <sub>│</sub>  → ˌ  (secondary stress)
 * - 그 외 HTML 태그는 모두 제거
 * - 잔존 │ 문자는 ˈ 로 치환
 *
 * 예: "<sup>│</sup>prɒdʒekt; 美 <sup>│</sup>prɑːdʒekt"
 *  →  "ˈprɒdʒekt; 美 ˈprɑːdʒekt"
 */
export function normalizeIpa(input: string | null | undefined): string {
  if (!input) return "";
  return String(input)
    .replace(/<sup>│<\/sup>/g, "ˈ")
    .replace(/<sub>│<\/sub>/g, "ˌ")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/│/g, "ˈ")
    .trim();
}

/**
 * HTML 태그를 모두 제거 (정의/뜻 등에 박힌 잔존 태그용).
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return String(input)
    .replace(/<\/?[^>]+>/g, "")
    .trim();
}
