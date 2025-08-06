// src/main/resources/static/features/search/js/search_page.js

document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("reset-filters");
  const toggleBtn = document.getElementById("toggle-filters");
  const filterPanel = document.getElementById("filter-panel");
  const filterGroups = document.querySelectorAll(".search__filter");

  // 1) 리셋 버튼: 각 그룹에서 “전체” 체크박스만 켜고 나머지 끄기
  resetBtn.addEventListener("click", () => {
    filterGroups.forEach((group) => {
      const checkboxes = Array.from(group.querySelectorAll('input[type="checkbox"]'));
      const allBox = checkboxes.find((cb) => cb.value === "전체");
      checkboxes.forEach((cb) => (cb.checked = cb === allBox));
    });
  });

  // 2) 토글 버튼: 패널 클래스 교체(search__mid--open / search__mid--closed) 및 버튼 텍스트·aria-expanded 변경
  toggleBtn.addEventListener("click", () => {
    const isClosed = filterPanel.classList.contains("search__mid--closed");

    if (isClosed) {
      filterPanel.classList.remove("search__mid--closed");
      filterPanel.classList.add("search__mid--open");
      toggleBtn.textContent = "상세검색 닫기";
      toggleBtn.setAttribute("aria-expanded", "true");
    } else {
      filterPanel.classList.remove("search__mid--open");
      filterPanel.classList.add("search__mid--closed");
      toggleBtn.textContent = "상세검색 열기";
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  });

  // 3) 각 필터 그룹: “전체” 체크박스 로직
  filterGroups.forEach((group) => {
    group.addEventListener("change", (e) => {
      const target = e.target;
      if (target.type !== "checkbox") return;

      const checkboxes = Array.from(group.querySelectorAll('input[type="checkbox"]'));
      const allBox = checkboxes.find((cb) => cb.value === "전체");

      // “전체” 박스를 클릭했을 때
      if (target === allBox) {
        if (allBox.checked) {
          checkboxes.forEach((cb) => (cb.checked = cb === allBox));
        }
        return;
      }

      // 다른 옵션을 클릭했을 때
      if (target.checked) {
        allBox.checked = false;
      } else {
        // 나머지 옵션 중에 하나도 체크되지 않았다면 “전체” 자동 체크
        const anyChecked = checkboxes.filter((cb) => cb !== allBox).some((cb) => cb.checked);

        if (!anyChecked) {
          allBox.checked = true;
        }
      }
    });
  });
});
