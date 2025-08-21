import { getUserIdFromUrl } from "./utils.js";
import { getEl } from "/common/js/utils/dom.js";
import { putJSON } from "/common/js/api.js";

export default function initProfileEdit() {
  const editBtn = getEl("#editProfileBtn");
  if (!editBtn) return;

  const profileView = getEl("#profileHeaderView");
  const form = getEl("#profileHeaderEdit");
  editBtn.addEventListener("click", () => {
    form.classList.remove("hidden");
    profileView.classList.add("hidden");
  });

  const cancelBtn = getEl("#cancelProfileEdit");
  cancelBtn.addEventListener("click", () => {
    form.classList.add("hidden");
    profileView.classList.remove("hidden");
  });

  form.onsubmit = async (e) => {
    e.preventDefault();

    const loadingText = "수정 중...";
    const nicknameEl = getEl(".user-meta__nickname");
    nicknameEl.textContent = loadingText;
    nicknameEl.classList.add("loading-text");
    const bioEl = getEl(".user-meta__bio");
    bioEl.textContent = loadingText;
    bioEl.classList.add("loading-text");

    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await putJSON(`/profile/${getUserIdFromUrl()}/update`, data);
      alert("프로필 수정 완료");
      // window.location.reload();
      form.classList.add("hidden");
      profileView.classList.remove("hidden");
      getEl(".avatar__image").src = res.avatarUrl;
      getEl(".user-meta__nickname").textContent = res.nickname;
      getEl(".user-meta__bio").textContent = res.bio;
    } catch (err) {
      console.error("프로필 수정 실패:", err);
      alert("실패");
    } finally {
      nicknameEl.classList.remove("loading-text");
      bioEl.classList.remove("loading-text");
    }
  };
}
