const API_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL?.trim();

function requireApiUrl() {
  if (!API_URL) throw new Error('VITE_GOOGLE_SHEETS_API_URL is not configured');
  return API_URL;
}

async function parseResponse(res: Response) {
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const payload = await res.json();
  if (payload?.error) throw new Error(payload.error);
  if (payload?.success === false) throw new Error(payload.error || 'The request was not completed');
  return payload;
}

async function fetchApi(params: Record<string, string>) {
  const url = new URL(requireApiUrl());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return parseResponse(res);
}

async function postApi(body: Record<string, unknown>) {
  const res = await fetch(requireApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export const sheetsApi = {
  getAll: () => fetchApi({ action: 'getAll' }),

  checkUser: (email: string) => fetchApi({ action: 'checkUser', email }),

  add: (sheet: string, data: Record<string, unknown>) =>
    postApi({ action: 'add', sheet, data }),

  update: (sheet: string, id: string, data: Record<string, unknown>) =>
    postApi({ action: 'update', sheet, id, data }),

  delete: (sheet: string, id: string) =>
    postApi({ action: 'delete', sheet, id }),

  deleteRelated: (targetSheet: string, foreignKeyField: string, foreignKeyValue: string) =>
    postApi({ action: 'deleteRelated', targetSheet, foreignKeyField, foreignKeyValue }),
};