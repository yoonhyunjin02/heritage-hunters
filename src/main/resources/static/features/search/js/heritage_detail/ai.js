// ai.js
import { U } from "./utils.js";
import { UI } from "./ui.js";
import { C } from "./constants.js";
import { KeyRR } from "./keyRR.js";

export const AI = {
  async ask(heritageId, payload) {
    const res = await U.postJson(`/heritage/${heritageId}/ai`, payload);
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },
  async reset(heritageId, payload) {
    const res = await U.postJson(`/heritage/${heritageId}/ai/reset`, payload);
    if (!res.ok) throw new Error(`reset HTTP ${res.status}`);
  },
  async fetchContent(heritageId, selector, type, code, base) {
    const btnSelector = `.ai-refresh[data-type="${type}"]`;
    UI.setLoading(selector, btnSelector);
    const start = performance.now();
    try {
      let json;
      try {
        json = await AI.ask(heritageId, { type, code, ...base });
      } catch (e) {
        if (e && e.status === 429) {
          console.warn(`429 for code=${code}, blacklist & retry`);
          KeyRR.block(code);
          const retryCode = KeyRR.next();
          json = await AI.ask(heritageId, { type, code: retryCode, ...base });
        } else {
          throw e;
        }
      }
      const markdown = json?.content ?? C.MSG.empty;
      const html = window.marked.parse(markdown);
      const target = U.qs(selector);
      if (target) target.innerHTML = html;
    } catch (e) {
      console.error(e);
      UI.setText(selector, C.MSG.aiFail);
    } finally {
      UI.unsetLoading(selector, btnSelector);
      console.log(`type: ${type}, code: ${code}, ⏱ ${Math.round(performance.now() - start)}ms`);
    }
  },
};
