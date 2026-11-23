export async function onRequestGet({ env }) {
  if (!env.DB) {
    return Response.json(
      { connected: false, error: "D1 binding DB belum tersedia" },
      { status: 503 }
    );
  }

  try {
    const result = await env.DB.prepare("SELECT 1 AS ok").first();

    return Response.json({
      connected: result?.ok === 1,
      database: "semeistvotech-db"
    });
  } catch {
    return Response.json(
      { connected: false, error: "Gagal mengakses database D1" },
      { status: 500 }
    );
  }
}
