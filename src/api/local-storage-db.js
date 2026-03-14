const LEADS_STORAGE_KEY = "lv_conf_leads";

function readLeads() {
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLeads(leads) {
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    return true;
  } catch {
    return false;
  }
}

function createLeadId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function insertLead(lead) {
  const leads = readLeads();
  const record = {
    id: createLeadId(),
    ...lead,
    createdAt: new Date().toISOString(),
  };

  leads.push(record);
  const saved = writeLeads(leads);

  return saved ? record : null;
}

export function listLeads() {
  return readLeads();
}

export function getLeadById(id) {
  const leads = readLeads();
  return leads.find((lead) => lead.id === id) || null;
}
