import { pingDatabase } from "../../../src/server/lead-storage.js";

export const runtime = "nodejs";

export async function GET() {
  try {
    await pingDatabase();

    return Response.json({
      ok: true,
      message: "API is healthy.",
      storage: "postgres",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error?.message || "Database health check failed.",
        storage: "postgres",
      },
      { status: 500 },
    );
  }
}
