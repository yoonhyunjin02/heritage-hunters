// profile_post_modal.js
(function () {
  const match = window.location.pathname.match(/\/profile\/(\d+)/);
  const userId = match ? match[1] : null;
  if (!userId) {
    console.error("userId를 URL에서 찾을 수 없습니다.");
    return;
  }

  const modalRoot = document.getElementById("post-modal-root");
  const modal = document.getElementById("postDetailModal");

  // 닫기 버튼 & 바깥 클릭 → 닫기
  modal?.querySelector(".modal-close")?.addEventListener("click", closePostDetail);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closePostDetail();
  });

  // 게시글 클릭 이벤트
  document.addEventListener("click", async (e) => {
    const card = e.target.closest(".post-card, .js-open-lightbox");
    if (!card) return;

    e.preventDefault();
    const postId = card.dataset.postId;
    if (!postId) return;
    await openPostModal(userId, postId);
  });

  async function openPostModal(userId, postId) {
    try {
      const currentId = modal.dataset.postId;
      modalRoot.style.display = "flex";
      modal.hidden = false;
      modal.classList.add("show");
      document.body.classList.add("modal-open");

      if (currentId !== postId) {
        showLoading(true);
        resetPostModal();
      }

      const res = await fetch(`/profile/${userId}/posts/${postId}`, {
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error(res.status);
      const post = await res.json();
      fillPostModal(post);

      if (currentId !== postId) {
        showLoading(false);
      }

      if (window.likeManager?.initializeLikeButtons) {
        window.likeManager.initializeLikeButtons(true);
      }
    } catch (err) {
      console.error("모달 로딩 실패:", err);
      alert("게시글을 불러오지 못했습니다.");
    }
  }

  function showLoading(isLoading) {
    const spinner = modal.querySelector("#modalLoading");
    const modalBody = modal.querySelector(".modal-body");
    if (!spinner) return;
    spinner.style.display = isLoading ? "flex" : "none";
    modalBody.style.display = isLoading ? "none" : "block";
  }

  function closePostDetail() {
    modalRoot.style.display = "none";
    modal.hidden = true;
    modal.classList.remove("show");
    document.body.classList.remove("modal-open");
    resetPostModal();
  }

  function resetPostModal() {
    // modal.dataset.postId = "";
    modal.querySelector("#authorName").textContent = "";
    modal.querySelector("#postContent").textContent = "";
    modal.querySelector("#viewCount").textContent = "0";
    modal.querySelector("#likeCount").textContent = "0";
    modal.querySelector("#commentCount").textContent = "0";
    modal.querySelector("#authorAvatar").src = "";
    // modal.querySelector("#authorAvatarPlaceholder").textContent = "U";
    modal.querySelector("#mainImage").src = "";
    modal.querySelector("#thumbContainer").innerHTML = "";
    modal.querySelector("#commentList").innerHTML = "";
    // modal.querySelector("#noImageMsg").style.display = "";
    modal.querySelector("#galleryWrapper").style.display = "";
  }

  function fillPostModal(post) {
    const m = document.getElementById("postDetailModal");
    if (!m) return;

    m.dataset.postId = post.id;
    m.querySelector("#authorName").textContent = post.userNickname ?? "";
    m.querySelector("#postContent").textContent = post.content ?? "";
    m.querySelector("#viewCount").textContent = post.viewCount ?? 0;
    m.querySelector("#likeCount").textContent = post.likeCount ?? 0;
    m.querySelector("#commentCount").textContent = post.commentCount ?? 0;
    m.querySelector("#postCreatedAt").textContent = post.createdAtFormatted ?? "";

    // 아바타
    const avatar = m.querySelector("#authorAvatar");
    // const placeholder = m.querySelector("#authorAvatarPlaceholder");
    if (post.userProfileImage) {
      avatar.src = post.userProfileImage;
      avatar.alt = post.userNickname ?? "";
      avatar.hidden = false;
      // placeholder.hidden = true;
    } else {
      avatar.hidden = true;
      // placeholder.hidden = false;
      // placeholder.textContent = post.userNickname?.charAt(0) ?? "U";
    }

    // 이미지
    if (post.images?.length > 0) {
      const main = m.querySelector("#mainImage");
      main.src = post.images[0].url;
      const thumbs = m.querySelector("#thumbContainer");
      thumbs.innerHTML = "";
      post.images.forEach((img, idx) => {
        const btn = document.createElement("button");
        btn.className = "thumb" + (idx === 0 ? " active" : "");
        btn.dataset.index = idx;
        btn.innerHTML = `<img src="${img.url}" alt="썸네일 ${idx + 1}">`;
        thumbs.appendChild(btn);
      });
      // m.querySelector("#noImageMsg").style.display = "none";
    } else {
      m.querySelector("#galleryWrapper").style.display = "none";
      // m.querySelector("#noImageMsg").style.display = "";
    }

    // 댓글
    const list = m.querySelector("#commentList");
    list.innerHTML = "";
    if (post.comments?.length > 0) {
      post.comments.forEach((c) => {
        const item = document.createElement("div");
        item.className = "comment-item";
        item.innerHTML = `
          <div class="c-avatar">
            ${
              c.userProfileImage
                ? `<img src="${c.userProfileImage}" alt="${c.userNickname}">`
                : `<div class="avatar-fallback">${c.userNickname?.charAt(0) ?? "U"}</div>`
            }
          </div>
          <div class="c-body">
            <div class="c-head">
              <span class="c-name">${c.userNickname}</span>
              <time class="c-time">${c.createdAtFormatted ?? ""}</time>
            </div>
            <p class="c-text">${c.content}</p>
          </div>
        `;
        list.appendChild(item);
      });
    } else {
      list.innerHTML = `<div class="no-comments">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</div>`;
    }
  }

  function closePostDetail() {
    const modalRoot = document.getElementById("post-modal-root");
    const modal = document.getElementById("postDetailModal");
    if (modalRoot && modal) {
      modalRoot.style.display = "none";
      modal.hidden = true;
      modal.classList.remove("show");
      document.body.classList.remove("modal-open");
    }
  }
})();
