import { getUserIdFromUrl } from "../utils.js";
import { getEl } from "/common/js/utils/dom.js";
import { getJSON, postJSON } from "/common/js/api.js";
import { formatRelativeTime } from "/common/js/utils/time_util.js";

export default function createComments(state) {
  const { modal, renderDetail } = state;

  function renderComments({ comments = [] }) {
    const list = getEl("#commentList");
    list.innerHTML = "";
    comments.forEach((c) => {
      const item = document.createElement("div");
      item.className = "comment-item";
      item.innerHTML = `
        <div class="comment-avatar" data-user-id="${c.userId}">
          <img src="${c.userProfileImage || `/images/profile/profile${(c.userId % 4) + 1}.png`}" alt="${c.userNickname}">
        </div>
        <div class="comment-content">
          <div class="comment-head">
            <span class="comment-name" data-user-id="${c.userId}">${c.userNickname}</span>
            <span class="comment-time">${formatRelativeTime(c.createdAt)}</span>
          </div>
          <p class="comment-text">${c.content}</p>
        </div>`;
      item.querySelectorAll("[data-user-id]").forEach((el) => {
        el.addEventListener("click", () => {
          const uid = el.getAttribute("data-user-id");
          if (uid) window.location.href = `/profile/${uid}`;
        });
      });
      list.appendChild(item);
    });
  }

  function bindCommentForm(data) {
    const form = getEl("#commentForm");
    const ta = getEl("#commentTextarea");
    const countEl = getEl("#commentCharCount");
    const submitBtn = form.querySelector('[type="submit"]');

    ta.value = "";
    countEl.textContent = "0";
    ta.oninput = () => (countEl.textContent = ta.value.length);

    ta.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        form.requestSubmit();
      }
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      if (submitBtn.disabled) return;
      const content = ta.value.trim();
      if (!content) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "등록 중...";
      try {
        await postJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}/comments`, { content });
        ta.value = "";
        countEl.textContent = "0";
        const comments = await getJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}/comments`);
        renderDetail({ ...data, comments });
      } catch (err) {
        console.error("댓글 작성 실패:", err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "등록";
      }
    };
  }

  return { renderComments, bindCommentForm };
}
