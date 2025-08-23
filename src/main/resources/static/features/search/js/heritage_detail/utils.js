// utils.js
import { C } from "./constants.js";

export const U = {
  qs(sel) {
    return document.querySelector(sel);
  },
  qsa(sel) {
    return document.querySelectorAll(sel);
  },
  getHeritageId() {
    return Number(window.location.pathname.split("/").pop());
  },
  getHeritagePayloadBase() {
    const data = window.HERITAGE_DETAIL || {};
    if (!data.id) {
      const $d = document.getElementById("heritage-data");
      if ($d) {
        data.id = Number($d.dataset.id);
        data.name = $d.dataset.name || "";
        data.address = $d.dataset.address || "";
        data.content = $d.dataset.content || "";
      }
    }
    return {
      name: data.name || "",
      address: data.address || "",
      content: data.content || "",
    };
  },
  clientCodeOf() {
    const sec = new Date().getSeconds();
    return (sec % 3) + 1;
  },
  getCsrf() {
    const tokenEl = document.querySelector('meta[name="_csrf"]');
    const headerEl = document.querySelector('meta[name="_csrf_header"]');
    return {
      token: tokenEl?.content ?? "",
      header: headerEl?.content ?? "X-CSRF-TOKEN",
    };
  },
  postJson(url, body) {
    const { token, header } = U.getCsrf();
    return fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [header]: token,
      },
      body: JSON.stringify(body),
    });
  },
};
