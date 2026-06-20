import { NextResponse } from "next/server";
import { generarResumenFinanciero } from "../../../../lib/groqService";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const { ingresos = 0, egresos = 0, disponible = 0, porCategoria = [], ultimosMovimientos = [] } = body || {};

  if (ingresos === 0 && egresos === 0) {
    return NextResponse.json({ resumen: "", tips: [], sinDatos: true });
  }

  try {
    const data = await generarResumenFinanciero({ ingresos, egresos, disponible, porCategoria, ultimosMovimientos });
    return NextResponse.json({ ...data, sinDatos: false });
  } catch (err) {
    console.error("Error /api/ia/finanzas:", err);
    const status = err.code === "NO_API_KEY" ? 500 : err.status || 502;
    return NextResponse.json(
      { error: err.message || "No se pudo generar el resumen en este momento." },
      { status }
    );
  }
}
