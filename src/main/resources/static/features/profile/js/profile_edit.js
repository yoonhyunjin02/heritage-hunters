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

    // 파일 포함한 폼 데이터 생성
    const formData = new FormData(form);

    try {
      const res = await putMultipart(`/profile/${getUserIdFromUrl()}/update`, formData);

      alert("프로필 수정 완료");

      // profileView 내부 요소만 업데이트
      profileView.querySelector(".avatar__img").src = res.profileImageUrl;
      profileView.querySelector(".user-meta__nickname").textContent = res.nickname;
      profileView.querySelector(".user-meta__bio").textContent = res.bio || "";

      form.classList.add("hidden");
      profileView.classList.remove("hidden");
    } catch (err) {
      console.error("프로필 수정 실패:", err);
      alert("프로필 수정 실패");
    }
  };
}
