// post_renderer.js
import { applyImageFallback } from "./utils.js";

/**
 * 게시물 카드를 렌더링합니다.
 * - innerHTML 사용 금지(XSS 방지)
 * - 접근성: 시각 아이콘은 aria-hidden, 수치는 스크린리더에 읽히도록 처리
 *
 * @param {Object} post
 * @returns {HTMLLIElement}
 */
export function renderPostCard(post) {
  const li = document.createElement("li");
  li.className = "post-card";

  // 이벤트 위임 대상: 링크 하나만 dataset 보유
  const link = document.createElement("a");
  link.href = "#";
  link.className = "post-thumb";
  if (post?.id != null) link.dataset.postId = String(post.id);

  const name = typeof post?.heritage?.name === "string" && post.heritage.name.trim().length ? post.heritage.name.trim() : "게시물";

  link.setAttribute("aria-label", `${name} 상세 보기`);

  const img = document.createElement("img");
  img.className = "post-thumb__img";
  const fallbackSrc = "/images/placeholders/no-image.png";
  const mainSrc = typeof post?.mainImageUrl === "string" && post.mainImageUrl.trim() ? post.mainImageUrl : fallbackSrc;
  img.src = mainSrc;
  img.alt = name ? `${name} 이미지` : "게시물 이미지";
  img.loading = "lazy";
  img.dataset.fallback = fallbackSrc;
  applyImageFallback(img);

  const overlay = document.createElement("div");
  overlay.className = "post-thumb__overlay";
  overlay.setAttribute("aria-hidden", "false"); // 숫자 정보는 읽히게

  // 좋아요
  const likeSpan = document.createElement("span");
  likeSpan.className = "overlay-item";
  const likeIcon = document.createElement("span");
  likeIcon.setAttribute("aria-hidden", "true");
  likeIcon.textContent = "♥";
  const likeCount = document.createElement("span");
  likeCount.className = "overlay-count";
  likeCount.textContent = String(Number.isFinite(post?.likeCount) ? post.likeCount : 0);
  likeSpan.append(likeIcon, document.createTextNode(" "), likeCount);

  // 댓글
  const commentSpan = document.createElement("span");
  commentSpan.className = "overlay-item";
  const commentIcon = document.createElement("span");
  commentIcon.setAttribute("aria-hidden", "true");
  commentIcon.textContent = "💬";
  const commentCount = document.createElement("span");
  commentCount.className = "overlay-count";
  commentCount.textContent = String(Number.isFinite(post?.commentCount) ? post.commentCount : 0);
  commentSpan.append(commentIcon, document.createTextNode(" "), commentCount);

  overlay.appendChild(likeSpan);
  overlay.appendChild(commentSpan);

  link.appendChild(img);
  link.appendChild(overlay);
  li.appendChild(link);

  return li;
}
