import { API_ENDPOINTS, HTTP_METHODS } from "./endpoints.js";

async function apiRequest({ method = HTTP_METHODS.GET, path, body } = {}) {
  if (!path) {
    return {
      ok: false,
      status: 400,
      data: { ok: false, error: "Missing API path." },
    };
  }

  try {
    const response = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = { ok: response.ok };
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { ok: false, error: "Unable to reach API." },
    };
  }
}

export function checkApiHealth() {
  return apiRequest({
    method: HTTP_METHODS.GET,
    path: API_ENDPOINTS.health,
  });
}

export function createLead(payload) {
  return apiRequest({
    method: HTTP_METHODS.POST,
    path: API_ENDPOINTS.leads.create,
    body: payload,
  });
}

export function listLeadRequests() {
  return apiRequest({
    method: HTTP_METHODS.GET,
    path: API_ENDPOINTS.leads.list,
  });
}

export function getLeadRequestById(id) {
  return apiRequest({
    method: HTTP_METHODS.GET,
    path: API_ENDPOINTS.leads.detail(id),
  });
}
