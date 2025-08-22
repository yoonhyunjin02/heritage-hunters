// profile_edit.js
import { getUserIdFromUrl } from "./utils.js";
import { getEl } from "/common/js/utils/dom.js";
import { putMultipart } from "/common/js/api.js";

export default function initProfileEdit() {
  const editBtn = getEl("#editProfileBtn");
  if (!editBtn) return;

  const viewSection = getEl("#profileHeaderSection");
  const editSection = getEl("#profileHeaderEditSection");
  const form = getEl("#profileHeaderEditForm");
  const cancelBtn = getEl("#cancelProfileEdit");

  editBtn.addEventListener("click", () => {
    viewSection.classList.add("hidden");
    editSection.classList.remove("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    editSection.classList.add("hidden");
    viewSection.classList.remove("hidden");
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const res = await putMultipart(`/profile/${getUserIdFromUrl()}/update`, formData);
      alert("프로필 수정 완료");

      // 읽기 뷰 갱신
      const avatarImg = getEl(".avatar__img", viewSection);
      avatarImg.src = res.profileImageUrl;
      avatarImg.alt = `${res.nickname}님의 프로필 사진`;

      getEl(".user-meta__nickname", viewSection).textContent = res.nickname;
      getEl(".user-meta__bio", viewSection).textContent = res.bio || "";

      // 편집 섹션 닫고 읽기 섹션 열기
      editSection.classList.add("hidden");
      viewSection.classList.remove("hidden");
    } catch (err) {
      console.error("프로필 수정 실패:", err);
      if (err.status >= 400 && err.status < 500) {
        alert(`요청 오류: ${err.message}`);
      } else if (err.status >= 500) {
        alert(`서버 오류: ${err.message}`);
      } else {
        alert(`알 수 없는 오류: ${err.message}`);
      }
    }
  };

  // 이미지 미리보기
  const profileImageInput = getEl("#profileImageInput");
  const avatarPreview = getEl("#avatarPreview");
  profileImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      avatarPreview.src = URL.createObjectURL(file);
    }
  });
}
