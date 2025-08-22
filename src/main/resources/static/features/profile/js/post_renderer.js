// post_renderer.js
/**
 * 프로필 페이지의 포스트 카드 렌더러
 */
export function renderPostCard(post) {
  const li = document.createElement("li");
  li.className = "post-card";

  const a = document.createElement("a");
  a.href = "#";
  a.className = "post-thumb";
  a.dataset.postId = post.id;
  a.setAttribute("aria-label", `${post.heritage?.name ?? "게시물"} 상세 보기`);

  const img = document.createElement("img");
  img.className = "post-thumb__img";
  img.src = post.mainImageUrl || "/images/placeholders/no-image.png";
  img.alt = post.heritage?.name ?? "게시물 이미지";
  img.loading = "lazy";
  img.dataset.fallback = "/images/placeholders/no-image.png";

  const overlay = document.createElement("div");
  overlay.className = "post-thumb__overlay";

  // ♥ 아이콘
  const likeSpan = document.createElement("span");
  likeSpan.className = "overlay-item";
  const heart = document.createElement("span");
  heart.setAttribute("aria-hidden", "true");
  heart.textContent = "♥";
  if (post.likedByCurrentUser) {
    heart.classList.add("liked"); // likedByCurrentUser가 true면 .liked 클래스 추가
  }
  likeSpan.append(heart, ` ${post.likeCount ?? 0}`);

  // 💬 아이콘
  const commentSpan = document.createElement("span");
  commentSpan.className = "overlay-item";
  const commentIcon = document.createElement("span");
  commentIcon.setAttribute("aria-hidden", "true");
  commentIcon.textContent = "💬";
  commentSpan.append(commentIcon, ` ${post.commentCount ?? 0}`);

  overlay.append(likeSpan, commentSpan);

  a.append(img, overlay);
  li.appendChild(a);
  return li;
}
