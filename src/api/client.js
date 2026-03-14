import { API_ENDPOINTS, HTTP_METHODS } from "./endpoints.js";
import { apiRequest } from "./router.js";

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
