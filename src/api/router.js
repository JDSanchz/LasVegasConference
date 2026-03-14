import { API_ENDPOINTS, HTTP_METHODS } from "./endpoints.js";
import { getLeadById, insertLead, listLeads } from "./local-storage-db.js";

const REQUIRED_LEAD_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "jobTitle",
  "socialHandle",
  "company",
];

function buildResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    data,
  };
}

function normalizePath(path) {
  try {
    const url = new URL(path, "https://local.api");
    return url.pathname;
  } catch {
    return path;
  }
}

function validateLeadPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Invalid payload.";
  }

  const missingField = REQUIRED_LEAD_FIELDS.find((field) => {
    const value = payload[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingField) {
    return `Missing required field: ${missingField}.`;
  }

  return null;
}

export async function apiRequest({ method = HTTP_METHODS.GET, path, body } = {}) {
  const normalizedMethod = (method || HTTP_METHODS.GET).toUpperCase();
  const normalizedPath = normalizePath(path || "");

  if (normalizedMethod === HTTP_METHODS.GET && normalizedPath === API_ENDPOINTS.health) {
    return buildResponse(200, {
      ok: true,
      message: "Local API is healthy.",
      storage: "localStorage",
    });
  }

  if (normalizedPath === API_ENDPOINTS.leads.create) {
    if (normalizedMethod === HTTP_METHODS.GET) {
      const leads = listLeads();
      return buildResponse(200, { ok: true, leads });
    }

    if (normalizedMethod === HTTP_METHODS.POST) {
      const validationError = validateLeadPayload(body);
      if (validationError) {
        return buildResponse(400, { ok: false, error: validationError });
      }

      const created = insertLead(body);
      if (!created) {
        return buildResponse(500, {
          ok: false,
          error: "Failed to save request to local storage.",
        });
      }

      return buildResponse(201, { ok: true, lead: created });
    }
  }

  const leadIdMatch = normalizedPath.match(/^\/api\/leads\/([^/]+)$/);
  if (leadIdMatch && normalizedMethod === HTTP_METHODS.GET) {
    const lead = getLeadById(leadIdMatch[1]);
    if (!lead) {
      return buildResponse(404, { ok: false, error: "Lead not found." });
    }

    return buildResponse(200, { ok: true, lead });
  }

  return buildResponse(404, { ok: false, error: "Endpoint not found." });
}
