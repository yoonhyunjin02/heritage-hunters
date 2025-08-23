// app.js
import { C } from "./constants.js";
import { U } from "./utils.js";
import { UI } from "./ui.js";
import { KeyRR } from "./keyRR.js";
import { AI } from "./ai.js";

export const App = {
  initSimpleInteractions() {
    // 이미지 라이트박스
    const img = U.qs(C.SELECTOR.thumbImg);
    if (img) {
      img.style.cursor = "pointer";
      img.addEventListener("click", () => UI.openLightbox(img.src, img.alt));
    }

    // 주소 복사
    U.qsa(C.SELECTOR.addresses).forEach((addr) => {
      addr.style.cursor = "pointer";
      addr.title = "클릭하여 주소 복사";
      addr.addEventListener("click", () => {
        navigator.clipboard
          .writeText(addr.textContent.trim())
          .then(() => UI.showToast(C.MSG.copied))
          .catch(() => UI.showToast(C.MSG.copyFail));
      });
    });

    // 본문 토글
    UI.initContentToggle();

    // 뒤로가기 버튼
    const backBtn = U.qs("#backButton");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        history.back();
      });
    }
  },

  initAi() {
    const heritageId = U.getHeritageId();
    const base = U.getHeritagePayloadBase();

    // 랜덤 오프셋으로 queue 시작점 변경
    KeyRR.initOffset();

    // 초기 로드
    AI.fetchContent(heritageId, C.AI_TARGET.recommends, "recommends", KeyRR.next(), base);
    AI.fetchContent(heritageId, C.AI_TARGET.weather, "weather", KeyRR.next(), base);
    AI.fetchContent(heritageId, C.AI_TARGET.news, "news", KeyRR.next(), base);
    AI.fetchContent(heritageId, C.AI_TARGET.summary, "summary", KeyRR.next(), base);

    // 새로고침 버튼
    U.qsa(C.SELECTOR.refreshBtns).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const type = btn.dataset.type;
        if (!type || !C.AI_TARGET[type]) return;

        const code = btn.dataset.code ? Number(btn.dataset.code) : KeyRR.next();
        const selector = C.AI_TARGET[type];
        const btnSelector = `.ai-refresh[data-type="${type}"]`;

        UI.setLoading(selector, btnSelector);

        try {
          await AI.reset(heritageId, { type, code });
          console.log(`✅ reset 성공 - ${type}`);
        } catch (e) {
          console.warn("⚠️ reset 실패(계속 진행):", e.message);
        }
        await AI.fetchContent(heritageId, selector, type, code, base);
      });
    });
  },

  boot() {
    this.initSimpleInteractions();
    this.initAi();
  },
};
