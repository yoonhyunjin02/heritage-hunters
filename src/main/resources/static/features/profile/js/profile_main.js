import initTabs from "./tabs.js";
import initInfiniteScroll from "./infinite_scroller.js";
import initPostModal from "./profile_post_modal.js";
import initProfileEdit from "./profile_edit.js";

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initInfiniteScroll();
  initPostModal();
  initProfileEdit();
});
