/**
 * 프로필 이미지 URL 처리 유틸
 *
 * 백엔드 규칙:
 *   - DB/응답 필드명: profileImageUrl
 *   - 기본값: "/images/profiles/basic_profile_image.png"
 *   - 업로드 시 정적 리소스 경로로만 저장 ("/images/profiles/...")
 *   - 백엔드가 /images/profiles/** 를 정적 리소스로 서빙
 *
 * 업로드 요청 파트명은 profileImage (응답 필드명 profileImageUrl과 다름)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

/** 서버 기본 프로필 이미지 경로 */
export const FALLBACK_PROFILE_IMAGE = `${API_BASE_URL}/images/profiles/basic_profile_image.png`

/**
 * profileImageUrl을 실제 렌더링 가능한 절대 URL로 변환한다.
 *
 * @param {string | null | undefined} profileImageUrl - 응답 JSON의 profileImageUrl 필드값
 * @returns {string} <img src>에 바로 넣을 수 있는 절대 URL
 *
 * 처리 규칙:
 *   1. null / undefined / 빈 문자열 → fallback 이미지 반환
 *   2. 이미 http:// 또는 https:// 로 시작 → 그대로 반환
 *   3. /로 시작하는 상대 웹 경로 → API_BASE_URL + 경로 반환
 *   4. 그 외(예외) → fallback 이미지 반환
 */
export function resolveProfileImageUrl(profileImageUrl) {
  if (!profileImageUrl) return FALLBACK_PROFILE_IMAGE

  if (
    profileImageUrl.startsWith('http://') ||
    profileImageUrl.startsWith('https://')
  ) {
    return profileImageUrl
  }

  if (profileImageUrl.startsWith('/')) {
    return `${API_BASE_URL}${profileImageUrl}`
  }

  return FALLBACK_PROFILE_IMAGE
}
