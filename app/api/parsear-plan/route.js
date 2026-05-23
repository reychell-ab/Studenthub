import { NextResponse } from "next/server";

// ── Parser del formato PE_REP_020 del SAE UCR ─────────────
function parsearLineaCurso(linea) {
  linea = linea.trim();
  // Línea válida: empieza con un dígito (ciclo), luego sigla
  const m = linea.match(/^(\d)\s+([A-Z][A-Z0-9\-]*)\s+(.+)$/);
  if (!m) return null;

  const ciclo = parseInt(m[1]);
  const sigla = m[2].trim();
  const resto = m[3];

  // Saltar líneas que no son cursos
  if (linea.includes("Créditos ciclo") || linea.includes("BACHILLERATO") || linea.includes("Grado:")) return null;
  if (ciclo < 1 || ciclo > 10) return null;

  // Quitar sección de requisitos al final (empieza con sigla tipo IF, MA, EG, etc. o "Equiv")
  const restoLimpio = resto.replace(/\s+((?:IF|MA|EG|LM|XS|EF|SR|RP|OPT|Equiv)[\w\.\-;:\s,]+)$/, "").trim();

  // Extraer números — el último es créditos
  const nums = restoLimpio.match(/\d+/g);
  if (!nums) return null;

  let creditos = parseInt(nums[nums.length - 1]);
  // Si créditos es 0 intentar el anterior
  if (creditos === 0 && nums.length > 1) creditos = parseInt(nums[nums.length - 2]);

  // Nombre: quitar dígitos del texto (artefacto de extracción PDF)
  let nombre = restoLimpio.replace(/\d+/g, "").replace(/\s+/g, " ").trim();
  nombre = nombre.replace(/[() \-]+$/, "").trim();

  if (nombre.length < 3) return null;

  return {
    ciclo,
    sigla,
    nombre: nombre.toUpperCase(),
    creditos,
    anio: Math.ceil(ciclo / 2),
    semestre: ciclo % 2 === 1 ? "I" : "II",
    estado: "pendiente",
    nota: "",
    color: "#ffffff"
  };
}

function parsearTextoPlan(texto) {
  const ciclos = {};
  const siglasSeen = new Set();

  const lineas = texto.split("\n");
  for (const linea of lineas) {
    const curso = parsearLineaCurso(linea);
    if (!curso) continue;

    // Evitar duplicados por sigla+ciclo
    const key = `${curso.ciclo}-${curso.sigla}`;
    if (siglasSeen.has(key)) continue;
    siglasSeen.add(key);

    if (!ciclos[curso.ciclo]) ciclos[curso.ciclo] = [];
    ciclos[curso.ciclo].push(curso);
  }

  return ciclos;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf");
    if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Usar pdf-parse para extraer texto
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const data = await pdfParse(buffer);
    const texto = data.text;

    const ciclos = parsearTextoPlan(texto);
    const totalCursos = Object.values(ciclos).flat().length;

    if (totalCursos === 0) {
      return NextResponse.json({
        error: "No se encontraron cursos. Verificá que sea un fascículo del SAE UCR (formato PE_REP_020)."
      }, { status: 422 });
    }

    return NextResponse.json({
      ciclos,
      totalCursos,
      totalCiclos: Object.keys(ciclos).length,
      carrera: data.text.match(/BACHILLERATO EN ([^\n]+)/)?.[1]?.trim() || "Plan de estudios"
    });

  } catch (err) {
    console.error("Error parsing PDF:", err);
    return NextResponse.json({ error: "Error al procesar el PDF: " + err.message }, { status: 500 });
  }
}
