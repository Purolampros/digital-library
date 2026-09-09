(function () {
  const config = window.SUPABASE_CONFIG || {};
  const enabled = Boolean(config.url && config.anonKey);
  const endpoint = enabled ? `${config.url.replace(/\/$/, "")}/rest/v1/books` : "";

  async function request(options) {
    if (!enabled) return null;
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw new Error(`Database request failed (${response.status})`);
    return response.status === 204 ? null : response.json();
  }

  window.bookDatabase = {
    enabled,
    async list() {
      return request({ method: "GET" }) || [];
    },
    async insert(book) {
      return request({
        method: "POST",
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          genre: book.genre || "Other",
          status: book.status || "unread"
        })
      });
    }
  };
})();
