(function () {
  const config = window.SUPABASE_CONFIG || {};
  const enabled = Boolean(config.url && config.anonKey);
  const baseUrl = config.url ? config.url.replace(/\/$/, "") : "";
  const endpoint = enabled ? `${baseUrl}/rest/v1/books` : "";
  const storageEndpoint = enabled ? `${baseUrl}/storage/v1/object` : "";

  function headers(extraHeaders) {
    return {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
      ...(extraHeaders || {})
    };
  }

  async function request(options) {
    if (!enabled) return null;
    const response = await fetch(endpoint, {
      ...options,
      headers: headers({
        Prefer: "return=representation",
        ...(options.headers || {})
      })
    });
    if (!response.ok) throw new Error(`Database request failed (${response.status})`);
    return response.status === 204 ? null : response.json();
  }

  async function uploadFile(file) {
    if (!enabled || !file) return null;
    const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-").replace(/-+/g, "-");
    const randomId = window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const path = `${randomId}-${safeName}`;
    const response = await fetch(`${storageEndpoint}/books/${path}`, {
      method: "POST",
      headers: headers({
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false"
      }),
      body: file
    });
    if (!response.ok) throw new Error(`File upload failed (${response.status})`);
    return {
      fileName: file.name,
      filePath: path,
      fileUrl: `${storageEndpoint}/public/books/${path}`,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size
    };
  }

  async function deleteFile(path) {
    if (!enabled || !path) return;
    const response = await fetch(`${storageEndpoint}/remove`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ prefixes: [`books/${path}`] })
    });
    if (!response.ok) throw new Error(`File cleanup failed (${response.status})`);
  }

  function base64Url(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function createPkcePair() {
    const verifier = base64Url(crypto.getRandomValues(new Uint8Array(64)));
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(verifier)
    );
    return { verifier, challenge: base64Url(digest) };
  }

  async function saveOAuthSessionFromUrl() {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      const verifier = sessionStorage.getItem("supabase.pkce_verifier");
      if (!verifier) return false;
      const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=pkce`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ auth_code: code, code_verifier: verifier })
      });
      if (!response.ok) throw new Error(`OAuth session exchange failed (${response.status})`);
      const session = await response.json();
      localStorage.setItem("supabase.access_token", session.access_token);
      localStorage.setItem("supabase.refresh_token", session.refresh_token);
      localStorage.setItem("auth.token", session.access_token);
      sessionStorage.removeItem("supabase.pkce_verifier");
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }

    if (!accessToken) return false;

    localStorage.setItem("supabase.access_token", accessToken);
    if (refreshToken) localStorage.setItem("supabase.refresh_token", refreshToken);
    localStorage.setItem("auth.token", accessToken);
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    return true;
  }

  window.bookDatabase = {
    enabled,
    auth: {
      restoreSession: saveOAuthSessionFromUrl,
      async signInWithProvider(provider) {
        if (!enabled) throw new Error("Supabase is not configured.");
        const { verifier, challenge } = await createPkcePair();
        sessionStorage.setItem("supabase.pkce_verifier", verifier);
        const redirectTo = new URL("book.html", window.location.href).href;
        const authorizeUrl = new URL(`${baseUrl}/auth/v1/authorize`);
        authorizeUrl.searchParams.set("provider", provider);
        authorizeUrl.searchParams.set("redirect_to", redirectTo);
        authorizeUrl.searchParams.set("code_challenge", challenge);
        authorizeUrl.searchParams.set("code_challenge_method", "s256");
        window.location.assign(authorizeUrl.toString());
      }
    },
    async list() {
      return request({ method: "GET" }) || [];
    },
    async insert(book, file) {
      const uploadedFile = await uploadFile(file);
      try {
        return await request({
          method: "POST",
          body: JSON.stringify({
            title: book.title,
            author: book.author,
            genre: book.genre || "Other",
            status: book.status || "unread",
            file_name: uploadedFile && uploadedFile.fileName,
            file_path: uploadedFile && uploadedFile.filePath,
            file_url: uploadedFile && uploadedFile.fileUrl,
            file_type: uploadedFile && uploadedFile.fileType,
            file_size: uploadedFile && uploadedFile.fileSize
          })
        });
      } catch (error) {
        if (uploadedFile) await deleteFile(uploadedFile.filePath);
        throw error;
      }
    },
    async deleteFile(path) {
      return deleteFile(path);
    }
  };
})();
