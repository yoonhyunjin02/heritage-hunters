/**
 * 프로필 페이지 전용 유틸
 */

// URL 경로에서 userId 추출
export function getUserIdFromUrl() {
  const segments = window.location.pathname.split("/");
  return segments[segments.length - 1];
}
