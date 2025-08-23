import { getUserIdFromUrl } from "../utils.js";
import { getEl } from "/common/js/utils/dom.js";
import { patchJSON } from "/common/js/api.js";

export default function createEdit(state) {
  const { modal, renderDetail } = state;

  function bindPostEditForm() {
    const postEditForm = getEl("#editPostForm", modal);
    const postContent = getEl("#postContent", modal);
    const postEditTextarea = getEl("textarea", postEditForm);
    const postEditCharCount = getEl("#editPostCharCount", postEditForm);
    const saveBtn = getEl("#savePostBtn", modal);
    const cancelBtn = getEl("#cancelPostEdit", modal);

    postEditTextarea.oninput = () => {
      postEditCharCount.textContent = postEditTextarea.value.length;
    };

    getEl('[data-action="edit-post"]', modal)?.addEventListener("click", () => {
      postEditTextarea.value = postContent.textContent.trim();
      postEditCharCount.textContent = postEditTextarea.value.length;
      postEditForm.classList.remove("hidden");
      postContent.classList.add("hidden");
    });

    cancelBtn?.addEventListener("click", () => {
      postEditForm.classList.add("hidden");
      postContent.classList.remove("hidden");
    });

    saveBtn?.addEventListener("click", async () => {
      if (saveBtn.disabled) return;
      const contentVal = postEditTextarea.value.trim();
      if (!contentVal) {
        alert("게시물 내용을 입력해주세요.");
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = "저장 중...";
      try {
        const updated = await patchJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}`, { content: contentVal });
        renderDetail(updated);
        alert("게시물이 수정되었습니다.");
        postEditForm.classList.add("hidden");
        postContent.classList.remove("hidden");
      } catch (err) {
        alert(err.message || "수정 실패");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "저장";
      }
    });
  }

  return { bindPostEditForm };
}
