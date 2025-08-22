// profile_edit.js
import { getUserIdFromUrl } from "./utils.js";
import { getEl } from "/common/js/utils/dom.js";
import { putMultipart } from "/common/js/api.js";

export default function initProfileEdit() {
  const editBtn = getEl("#editProfileBtn");
  if (!editBtn) return;

  const profileView = getEl("#profileHeaderView");
  const form = getEl("#profileHeaderEdit");
  const cancelBtn = getEl("#cancelProfileEdit");

  editBtn.addEventListener("click", () => {
    form.classList.remove("hidden");
    profileView.classList.add("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    form.classList.add("hidden");
    profileView.classList.remove("hidden");
  });

  form.onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const res = await putMultipart(`/profile/${getUserIdFromUrl()}/update`, formData);

      alert("프로필 수정 완료");

      getEl(".avatar__img", profileView).src = res.profileImageUrl;
      getEl(".avatar__img", profileView).alt = res.nickname;
      getEl(".user-meta__nickname", profileView).textContent = res.nickname;
      getEl(".user-meta__bio", profileView).textContent = res.bio || "";

      form.classList.add("hidden");
      profileView.classList.remove("hidden");
    } catch (err) {
      console.error("프로필 수정 실패:", err);
      // 서버가 준 메시지나 status를 alert에
      if (err.status >= 400 && err.status < 500) {
        alert(`요청 오류: ${err.message}`);
      } else if (err.status >= 500) {
        alert(`서버 오류: ${err.message}`);
      } else {
        alert(`알 수 없는 오류: ${err.message}`);
      }
    }
  };
}
