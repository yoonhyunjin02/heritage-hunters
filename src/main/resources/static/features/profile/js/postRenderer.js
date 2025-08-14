export function renderPostCard(item) {
  const li = document.createElement("li");
  li.className = "post-card";
  li.dataset.postId = item.id;
  li.innerHTML = `
    <a href="#" class="post-thumb js-open-lightbox" data-post-id="${item.id}">
      <img class="post-thumb__img" src="${item.thumbnailUrl}" alt="${item.title || "게시물"}" loading="lazy">
      <div class="post-thumb__overlay" aria-hidden="true">
        <span class="overlay-item"><span aria-hidden="true">♥</span> ${item.likeCount || 0}</span>
        <span class="overlay-item"><span aria-hidden="true">💬</span> ${item.commentCount || 0}</span>
      </div>
    </a>`;
  return li;
}

export function renderCommentItem(c) {
  const li = document.createElement("li");
  li.className = "comment-item";
  li.textContent = c.content || "";
  return li;
}
