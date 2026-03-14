import { getLeadById } from "../../../../src/server/lead-storage.js";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const lead = await getLeadById(params.id);

    if (!lead) {
      return Response.json({ ok: false, error: "Lead not found." }, { status: 404 });
    }

    return Response.json({ ok: true, lead });
  } catch (error) {
    return Response.json(
      { ok: false, error: error?.message || "Failed to fetch lead." },
      { status: 500 },
    );
  }
}
