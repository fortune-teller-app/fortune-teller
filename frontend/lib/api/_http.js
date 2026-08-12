// Base HTTP client — configure base URL, auth headers, and error handling here when backend is ready
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function request(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.error?.message || `${method} ${path} → ${res.status}`);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }

  return data;
}

export const http = {
  get:   (path, opts)       => request('GET',    path, opts),
  post:  (path, body, opts) => request('POST',   path, { ...opts, body }),
  put:   (path, body, opts) => request('PUT',    path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH',  path, { ...opts, body }),
  del:   (path, opts)       => request('DELETE', path, opts),
};
