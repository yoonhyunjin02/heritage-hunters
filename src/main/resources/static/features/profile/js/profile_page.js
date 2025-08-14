// features/profile/js/profile_page.js
// 프로필 페이지 상호작용: 탭, 무한 스크롤, 라이트박스, 좋아요/댓글
// 서버에서 엔드포인트를 주입하면 바로 동작합니다.
// 예시(thymeleaf):
//   - #posts-sentinel: th:attr="data-endpoint=@{'/api/users/' + ${user.id} + '/posts'}"
//   - #liked-sentinel: th:attr="data-endpoint=@{'/api/users/' + ${user.id} + '/likes'}"
//   - body(or main): th:attr="data-post-detail='/api/posts/:id', data-post-like='/api/posts/:id/likes', data-post-comments='/api/posts/:id/comments'"

(function () {
  "use strict";

  // -----------------------------
  // Utils
  // -----------------------------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const fetchJSON = async (url, options = {}) => {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const replaceId = (pattern, id) => (typeof pattern === "string" ? pattern.replace(":id", String(id)) : null);

  const setHidden = (el, isHidden) => {
    if (!el) return;
    if (isHidden) el.setAttribute("hidden", "");
    else el.removeAttribute("hidden");
  };

  // -----------------------------
  // Tabs
  // -----------------------------
  function initTabs() {
    const nav = $(".profile-tabs");
    if (!nav) return;

    const tabs = $$(".tab-btn", nav);
    const panels = $$(".tab-panel", $(".profile-panels"));
    const indicator = $(".tab-indicator", nav);

    const indexOf = (btn) => tabs.findIndex((t) => t === btn);

    const activate = (btn) => {
      const idx = indexOf(btn);
      tabs.forEach((t, i) => {
        const selected = i === idx;
        t.classList.toggle("is-active", selected);
        t.setAttribute("aria-selected", String(selected));
        if (selected) t.removeAttribute("tabindex");
        else t.setAttribute("tabindex", "-1");
      });
      panels.forEach((panel, i) => setHidden(panel, i !== idx));
      if (indicator) indicator.style.transform = `translateX(${idx * 100}%)`;
    };

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => activate(btn));
      btn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const cur = indexOf(document.activeElement);
          const next = e.key === "ArrowRight" ? (cur + 1) % tabs.length : (cur - 1 + tabs.length) % tabs.length;
          tabs[next].focus();
          activate(tabs[next]);
        }
      });
    });

    // 초기 활성 탭 유지
    const initial = tabs.find((t) => t.classList.contains("is-active")) || tabs[0];
    if (initial) activate(initial);
  }

  // -----------------------------
  // Infinite scroll
  // -----------------------------
  class InfiniteScroller {
    constructor({ listEl, sentinelEl, endpoint, params = {}, renderItem, onAppend, root = null, rootMargin = "800px 0px", threshold = 0.01 }) {
      this.listEl = listEl;
      this.sentinelEl = sentinelEl;
      this.endpoint = endpoint;
      this.params = { ...params }; // { cursor, page, size }
      this.renderItem = renderItem;
      this.onAppend = onAppend;
      this.loading = false;
      this.done = false;

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) this.loadMore();
          });
        },
        { root, rootMargin, threshold }
      );
    }

    buildURL() {
      const url = new URL(this.endpoint, window.location.origin);
      Object.entries(this.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
      });
      return url.toString();
    }

    parsePaging(data) {
      // 다양한 페이징 형태 지원
      // 1) { items, nextCursor, hasMore }
      // 2) { items, cursor, hasNext }
      // 3) { content, next, hasNext }  등
      const items = data.items || data.content || data.results || [];
      const nextCursor = data.nextCursor ?? data.cursor ?? data.next ?? data.next_token ?? null;
      const hasMore = data.hasMore ?? data.hasNext ?? nextCursor != null ?? items.length > 0;

      return { items, nextCursor, hasMore };
    }

    async loadMore() {
      if (this.loading || this.done || !this.endpoint) return;
      this.loading = true;
      this.sentinelEl?.setAttribute("aria-busy", "true");

      try {
        const url = this.buildURL();
        const data = await fetchJSON(url);
        const { items, nextCursor, hasMore } = this.parsePaging(data);

        if (Array.isArray(items) && items.length) {
          const frag = document.createDocumentFragment();
          for (const item of items) {
            const node = this.renderItem(item);
            if (node) frag.appendChild(node);
          }
          this.listEl.appendChild(frag);
          if (typeof this.onAppend === "function") this.onAppend(items);
        }

        if (!hasMore) {
          this.done = true;
          this.observer.disconnect();
          this.sentinelEl?.setAttribute("data-done", "true");
        } else if (nextCursor != null) {
          this.params.cursor = nextCursor;
        } else if (this.params.page != null) {
          this.params.page = Number(this.params.page) + 1;
        }
      } catch (err) {
        // 에러 시 관찰 중지(중복 호출 방지). 필요시 재시도 로직 추가 가능.
        this.observer.disconnect();
        console.error("[InfiniteScroller] load error:", err);
      } finally {
        this.loading = false;
        this.sentinelEl?.removeAttribute("aria-busy");
      }
    }

    start() {
      if (!this.sentinelEl) return;
      this.observer.observe(this.sentinelEl);
    }

    stop() {
      this.observer.disconnect();
    }
  }

  // -----------------------------
  // Renderers
  // -----------------------------
  function renderPostCard(item) {
    // item: { id, thumbnailUrl, title, likeCount, commentCount }
    const li = document.createElement("li");
    li.className = "post-card";
    li.dataset.postId = item.id;

    const a = document.createElement("a");
    a.href = "#";
    a.className = "post-thumb js-open-lightbox";
    a.setAttribute("aria-label", "게시물 상세 보기");
    a.dataset.postId = item.id;

    const img = document.createElement("img");
    img.className = "post-thumb__img";
    img.loading = "lazy";
    img.src = item.thumbnailUrl;
    img.alt = item.title || "게시물 썸네일";

    const overlay = document.createElement("div");
    overlay.className = "post-thumb__overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <span class="overlay-item">
        <span class="overlay-item__icon" aria-hidden="true">♥</span>
        <span class="overlay-item__count">${item.likeCount ?? 0}</span>
      </span>
      <span class="overlay-item">
        <span class="overlay-item__icon" aria-hidden="true">💬</span>
        <span class="overlay-item__count">${item.commentCount ?? 0}</span>
      </span>
    `;

    a.appendChild(img);
    a.appendChild(overlay);
    li.appendChild(a);
    return li;
  }

  function renderCommentItem(c) {
    // c: { id, author: { nickname, avatarUrl }, content, createdAt }
    const li = document.createElement("li");
    li.className = "comment-item";
    li.innerHTML = `
      <div class="comment" style="display:flex; gap:.5rem; align-items:flex-start;">
        <img src="${
          c.author?.avatarUrl || ""
        }" alt="작성자" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid var(--gray-200);background:var(--gray-100);" />
        <div style="display:grid; gap:.125rem; min-width:0;">
          <div style="display:flex; gap:.5rem; align-items:baseline; flex-wrap:wrap;">
            <strong style="font-weight:700;">${escapeHTML(c.author?.nickname || "익명")}</strong>
            <time style="font-size:.8125rem;color:var(--gray-700);">${escapeHTML(c.createdAt || "")}</time>
          </div>
          <div style="white-space:pre-wrap; word-break:break-word;">${escapeHTML(c.content || "")}</div>
        </div>
      </div>
    `;
    return li;
  }

  function escapeHTML(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // -----------------------------
  // Lightbox
  // -----------------------------
  function initLightbox() {
    const lightbox = $("#post-lightbox");
    if (!lightbox) return;

    const dialog = $(".lightbox__dialog", lightbox);
    const backdrop = $(".lightbox__backdrop", lightbox);
    const btnClose = $(".lightbox__close", lightbox);

    const img = $(".lightbox__img", lightbox);
    const avatar = $(".lightbox__avatar", lightbox);
    const nickname = $(".lightbox__nickname", lightbox);
    const email = $(".lightbox__email", lightbox);
    const text = $(".lightbox__text", lightbox);

    const btnLike = $(".btn-like", lightbox);
    const likeCountEl = $(".js-like-count", lightbox);
    const commentCountEl = $(".js-comment-count", lightbox);

    const commentsList = $(".lightbox__comments", lightbox);
    const commentsSentinel = $("#comments-sentinel");
    const commentForm = $(".lightbox__comment-form", lightbox);
    const commentInput = $("#comment-input", lightbox);

    let commentsScroller = null;
    let currentPostId = null;

    // 엔드포인트 패턴 (body/main에 data- 속성으로 주입 가능)
    const hostEl = document.body;
    const postDetailPattern = hostEl.getAttribute("data-post-detail") || "/api/posts/:id";
    const postLikePattern = hostEl.getAttribute("data-post-like") || "/api/posts/:id/likes";
    const postCommentsPattern = hostEl.getAttribute("data-post-comments") || "/api/posts/:id/comments";

    function openLightbox() {
      setHidden(lightbox, false);
      trapFocus(dialog);
      document.addEventListener("keydown", escToClose);
    }

    function closeLightbox() {
      setHidden(lightbox, true);
      untrapFocus();
      document.removeEventListener("keydown", escToClose);
      // 상태 초기화
      img.src = "";
      avatar.src = "";
      nickname.textContent = "";
      email.textContent = "";
      text.textContent = "";
      likeCountEl.textContent = "0";
      commentCountEl.textContent = "0";
      btnLike.setAttribute("aria-pressed", "false");
      currentPostId = null;
      commentsList.innerHTML = "";
      commentsScroller?.stop();
      commentsScroller = null;
    }

    function escToClose(e) {
      if (e.key === "Escape") closeLightbox();
    }

    backdrop.addEventListener("click", closeLightbox);
    btnClose.addEventListener("click", closeLightbox);

    // 게시물 썸네일 클릭(이벤트 위임)
    document.addEventListener("click", async (e) => {
      const a = e.target.closest(".js-open-lightbox");
      if (!a) return;
      e.preventDefault();
      const postId = a.dataset.postId;
      if (!postId) return;

      try {
        // 상세 호출
        const detailURL = replaceId(postDetailPattern, postId);
        const detail = await fetchJSON(detailURL);

        // 기대 응답 예시:
        // {
        //   id, images:[url], text, likeCount, commentCount, liked,
        //   author:{ nickname, email, avatarUrl }
        // }
        const imageUrl = (detail.images && detail.images[0]) || detail.imageUrl || "";
        img.src = imageUrl || "";
        avatar.src = detail.author?.avatarUrl || "";
        nickname.textContent = detail.author?.nickname || "";
        email.textContent = detail.author?.email || "";
        text.textContent = detail.text || "";
        likeCountEl.textContent = String(detail.likeCount ?? 0);
        commentCountEl.textContent = String(detail.commentCount ?? 0);
        btnLike.setAttribute("aria-pressed", String(!!detail.liked));

        currentPostId = detail.id || postId;

        // 댓글 무한 스크롤 세팅
        commentsList.innerHTML = "";
        commentsScroller?.stop();
        const commentsEndpoint = replaceId(postCommentsPattern, currentPostId);

        commentsScroller = new InfiniteScroller({
          listEl: commentsList,
          sentinelEl: commentsSentinel,
          endpoint: commentsEndpoint,
          params: { size: 20 },
          renderItem: renderCommentItem,
        });
        commentsScroller.start();

        openLightbox();
      } catch (err) {
        console.error("게시물 상세 호출 실패:", err);
      }
    });

    // 좋아요 토글
    btnLike.addEventListener("click", async () => {
      if (!currentPostId) return;
      const liked = btnLike.getAttribute("aria-pressed") === "true";
      const url = replaceId(postLikePattern, currentPostId);

      try {
        // 낙관적 업데이트
        btnLike.setAttribute("aria-pressed", String(!liked));
        likeCountEl.textContent = String(Math.max(0, Number(likeCountEl.textContent || 0) + (liked ? -1 : 1)));

        const method = liked ? "DELETE" : "POST";
        await fetchJSON(url, { method });

        // 성공 시 그대로 유지. 서버 응답에 count가 있다면 동기화:
        // const res = await fetchJSON(url, { method });
        // if (typeof res.likeCount === 'number') likeCountEl.textContent = String(res.likeCount);
      } catch (err) {
        // 롤백
        btnLike.setAttribute("aria-pressed", String(liked));
        likeCountEl.textContent = String(Math.max(0, Number(likeCountEl.textContent || 0) + (liked ? 1 : -1)));
        console.error("좋아요 처리 실패:", err);
      }
    });

    // 댓글 작성
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentPostId) return;
      const content = commentInput.value.trim();
      if (!content) return;

      const url = replaceId(postCommentsPattern, currentPostId);
      try {
        const newComment = await fetchJSON(url, {
          method: "POST",
          body: JSON.stringify({ content }),
        });
        // 상단에 추가
        const node = renderCommentItem(newComment);
        commentsList.insertBefore(node, commentsList.firstChild);
        commentInput.value = "";
        // 카운트 증가
        commentCountEl.textContent = String(Number(commentCountEl.textContent || 0) + 1);
      } catch (err) {
        console.error("댓글 작성 실패:", err);
      }
    });

    // Focus trap
    let previousActive = null;
    function trapFocus(modalEl) {
      previousActive = document.activeElement;
      const focusable = getFocusable(modalEl);
      if (focusable.length) focusable[0].focus();

      function loop(e) {
        if (e.key !== "Tab") return;
        const list = getFocusable(modalEl);
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      modalEl.addEventListener("keydown", loop);
      modalEl._trapHandler = loop; // store
    }

    function untrapFocus() {
      const modalEl = dialog;
      if (modalEl && modalEl._trapHandler) {
        modalEl.removeEventListener("keydown", modalEl._trapHandler);
        modalEl._trapHandler = null;
      }
      if (previousActive && previousActive.focus) {
        previousActive.focus();
      }
    }

    function getFocusable(root) {
      return $$(
        [
          "a[href]",
          "button:not([disabled])",
          "textarea:not([disabled])",
          "input:not([disabled])",
          "select:not([disabled])",
          "[tabindex]:not([tabindex='-1'])",
        ].join(","),
        root
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    }
  }

  // -----------------------------
  // Page-level infinite scrollers
  // -----------------------------
  function initPageInfiniteScroll() {
    // 내가 올린 게시물
    const postsList = $('.post-grid[data-infinite="posts"]');
    const postsSentinel = $("#posts-sentinel");
    const postsEndpoint = postsSentinel?.dataset.endpoint || null; // 서버에서 data-endpoint 주입 권장

    if (postsList && postsSentinel && postsEndpoint) {
      const postsScroller = new InfiniteScroller({
        listEl: postsList,
        sentinelEl: postsSentinel,
        endpoint: postsEndpoint,
        params: {
          size: 30,
          cursor: postsSentinel.dataset.cursor || null,
          page: postsSentinel.dataset.page || null,
        },
        renderItem: renderPostCard,
      });
      postsScroller.start();
    }

    // 좋아요한 게시물
    const likedList = $('.post-grid[data-infinite="liked"]');
    const likedSentinel = $("#liked-sentinel");
    const likedEndpoint = likedSentinel?.dataset.endpoint || null;

    if (likedList && likedSentinel && likedEndpoint) {
      const likedScroller = new InfiniteScroller({
        listEl: likedList,
        sentinelEl: likedSentinel,
        endpoint: likedEndpoint,
        params: {
          size: 30,
          cursor: likedSentinel.dataset.cursor || null,
          page: likedSentinel.dataset.page || null,
        },
        renderItem: renderPostCard,
      });
      likedScroller.start();
    }
  }

  // -----------------------------
  // Boot
  // -----------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initPageInfiniteScroll();
    initLightbox();
  });
})();
