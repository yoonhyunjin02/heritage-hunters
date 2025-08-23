import { getUserIdFromUrl } from "../utils.js";
import { getEl } from "/common/js/utils/dom.js";
import { getJSON, postJSON } from "/common/js/api.js";
import { formatRelativeTime } from "/common/js/utils/time_util.js";

export default function createComments(state) {
  const { modal, renderDetail } = state;

  function renderComments({ comments = [], commentCount = 0 }) {
    const list = getEl("#commentList");
    const noCommentsHint = getEl("#noCommentsHint");
    list.innerHTML = "";

    if (comments.length === 0) {
      noCommentsHint.classList.remove("hidden");
      return;
    } else {
      noCommentsHint.classList.add("hidden");
    }

    comments.forEach((c) => {
      const item = document.createElement("div");
      item.className = "comment-item";

      // 아바타
      const avatarDiv = document.createElement("div");
      avatarDiv.className = "comment-avatar";
      avatarDiv.dataset.userId = c.userId;
      const avatarImg = document.createElement("img");
      avatarImg.src = c.userProfileImage || `/images/profile/profile${(c.userId % 4) + 1}.png`;
      avatarImg.alt = c.userNickname;
      avatarDiv.appendChild(avatarImg);

      // 내용
      const contentDiv = document.createElement("div");
      contentDiv.className = "comment-content";

      const headDiv = document.createElement("div");
      headDiv.className = "comment-head";

      const nameSpan = document.createElement("span");
      nameSpan.className = "comment-name";
      nameSpan.dataset.userId = c.userId;
      nameSpan.textContent = c.userNickname;

      const timeSpan = document.createElement("span");
      timeSpan.className = "comment-time";
      timeSpan.textContent = formatRelativeTime(c.createdAt);

      headDiv.append(nameSpan, timeSpan);

      const textP = document.createElement("p");
      textP.className = "comment-text";
      textP.textContent = c.content; // textContent로 XSS 방지

      contentDiv.append(headDiv, textP);

      // 조립
      item.append(avatarDiv, contentDiv);

      // 프로필 이동 이벤트
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
      if (ev.key === "Enter" && !(ev.shiftKey || ev.ctrlKey)) {
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
