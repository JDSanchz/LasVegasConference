export const API_BASE_PATH = "/api";

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
};

export const API_ENDPOINTS = {
  health: `${API_BASE_PATH}/health`,
  leads: {
    create: `${API_BASE_PATH}/leads`,
    list: `${API_BASE_PATH}/leads`,
    detail: (id) => `${API_BASE_PATH}/leads/${id}`,
  },
};
