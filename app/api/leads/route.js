import { insertLead, listLeads } from "../../../src/server/lead-storage.js";
import { validateLeadPayload } from "../../../src/server/lead-validation.js";

export const runtime = "nodejs";

export async function GET() {
  try {
    const leads = await listLeads();
    return Response.json({ ok: true, leads });
  } catch (error) {
    return Response.json(
      { ok: false, error: error?.message || "Failed to load leads." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const validationError = validateLeadPayload(payload);
  if (validationError) {
    return Response.json({ ok: false, error: validationError }, { status: 400 });
  }

  try {
    const lead = await insertLead(payload);
    return Response.json({ ok: true, lead }, { status: 201 });
  } catch (error) {
    return Response.json(
      { ok: false, error: error?.message || "Failed to create lead." },
      { status: 500 },
    );
  }
}
