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
  overlay.innerHTML = `
    <span class="overlay-item"><span aria-hidden="true">♥</span> ${post.likeCount ?? 0}</span>
    <span class="overlay-item"><span aria-hidden="true">💬</span> ${post.commentCount ?? 0}</span>
  `;

  a.append(img, overlay);
  li.appendChild(a);
  return li;
}
