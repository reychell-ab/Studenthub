import { NextResponse } from "next/server";
import { generarSugerenciasAgenda } from "../../../../lib/groqService";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const actividades = Array.isArray(body?.actividades) ? body.actividades : [];
  const horario = Array.isArray(body?.horario) ? body.horario : [];

  // Si no hay datos suficientes, no llamamos a la IA — devolvemos vacío explícito
  if (actividades.length === 0) {
    return NextResponse.json({ sugerencias: [], sinDatos: true });
  }

  try {
    const sugerencias = await generarSugerenciasAgenda({ actividades, horario });
    return NextResponse.json({ sugerencias, sinDatos: false });
  } catch (err) {
    console.error("Error /api/ia/sugerencias:", err);
    const status = err.code === "NO_API_KEY" ? 500 : err.status || 502;
    return NextResponse.json(
      { error: err.message || "No se pudieron generar sugerencias en este momento." },
      { status }
    );
  }
}
