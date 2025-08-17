// post_renderer.js
export function renderPostCard(post) {
  // <li> 요소 생성
  const li = document.createElement("li");
  li.className = "post-card";
  li.dataset.postId = post.id ?? "";

  // 안전한 기본값 설정
  const imgSrc = post.mainImageUrl || "/images/placeholders/no-image.png";
  const altText = post.heritage?.name || "게시물 이미지";

  // 내부 HTML 구성
  li.innerHTML = `
    <a href="#" class="post-thumb js-open-lightbox" data-post-id="${post.id ?? ""}" aria-label="게시물 상세 보기">
      <img class="post-thumb__img"
           src="${imgSrc}"
           alt="${altText}"
           loading="lazy"
           onerror="this.onerror=null;this.src='/images/placeholders/no-image.png'">
      <div class="post-thumb__overlay" aria-hidden="true">
        <span class="overlay-item">
          <span aria-hidden="true">♥</span> ${post.likeCount ?? 0}
        </span>
        <span class="overlay-item">
          <span aria-hidden="true">💬</span> ${post.commentCount ?? 0}
        </span>
      </div>
    </a>
  `;

  return li;
}

export function renderCommentItem(c) {
  const li = document.createElement("li");
  li.className = "comment-item";
  li.textContent = c.content || "";
  return li;
}
