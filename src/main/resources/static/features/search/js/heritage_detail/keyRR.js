// keyRR.js
export const KeyRR = {
  queue: [1, 2, 3],
  blacklist: new Map(),
  TTL_MS: 60 * 60 * 1000,

  initOffset() {
    const offset = Math.floor(Math.random() * this.queue.length);
    this.queue = this.queue.slice(offset).concat(this.queue.slice(0, offset));
  },
  isBlocked(code) {
    const until = this.blacklist.get(code);
    if (!until) return false;
    if (Date.now() > until) {
      this.blacklist.delete(code);
      return false;
    }
    return true;
  },
  block(code, ttl = this.TTL_MS) {
    this.blacklist.set(code, Date.now() + ttl);
  },
  next() {
    if (!this.queue.length) throw new Error("No keys configured");
    let tries = this.queue.length;
    while (tries-- > 0) {
      const code = this.queue.shift();
      this.queue.push(code);
      if (!this.isBlocked(code)) return code;
    }
    return this.queue[0];
  },
  use(code) {
    const idx = this.queue.indexOf(code);
    if (idx > -1) {
      this.queue.splice(idx, 1);
      this.queue.push(code);
    }
  },
};
