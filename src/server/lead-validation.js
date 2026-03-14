export const REQUIRED_LEAD_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "jobTitle",
  "socialHandle",
  "company",
];

export function validateLeadPayload(payload) {
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
