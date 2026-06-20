// ─────────────────────────────────────────────────────────────────────────
// lib/groqService.js
// Servicio centralizado para llamadas a la IA (Groq).
//
// IMPORTANTE: este archivo SOLO debe importarse desde código de servidor
// (Route Handlers en app/api/.../route.js). Nunca lo importes desde un
// componente "use client" — la API key se leería como undefined en el
// navegador (y si se expusiera, sería un riesgo de seguridad).
// ─────────────────────────────────────────────────────────────────────────

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

/**
 * Llama al endpoint de chat completions de Groq.
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ jsonMode?: boolean, temperature?: number, maxTokens?: number }} opts
 * @returns {Promise<string>} contenido de texto de la respuesta del modelo
 */
async function llamarGroq(messages, opts = {}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    const err = new Error(
      "GROQ_API_KEY no está configurada. Agrega la variable de entorno en .env.local (servidor)."
    );
    err.code = "NO_API_KEY";
    throw err;
  }

  const body = {
    model: MODEL,
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 1024,
  };

  if (opts.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  let res;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    const err = new Error("No se pudo conectar con el servicio de IA. Verificá tu conexión.");
    err.code = "NETWORK_ERROR";
    throw err;
  }

  if (!res.ok) {
    let detalle = "";
    try {
      const errJson = await res.json();
      detalle = errJson?.error?.message || "";
    } catch {
      /* noop */
    }

    const err = new Error(
      res.status === 401
        ? "La clave de Groq no es válida o expiró."
        : res.status === 429
        ? "Se alcanzó el límite de solicitudes a la IA. Intentá de nuevo en un momento."
        : `Error del servicio de IA (${res.status}). ${detalle}`
    );
    err.code = "GROQ_ERROR";
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const texto = data?.choices?.[0]?.message?.content;

  if (!texto) {
    const err = new Error("La IA no devolvió una respuesta utilizable.");
    err.code = "EMPTY_RESPONSE";
    throw err;
  }

  return texto;
}

/**
 * Intenta parsear un texto como JSON, limpiando posibles fences de markdown.
 */
function parsearJSONSeguro(texto) {
  let limpio = texto.trim();
  limpio = limpio.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  try {
    return JSON.parse(limpio);
  } catch {
    const err = new Error("La IA devolvió un formato inesperado.");
    err.code = "PARSE_ERROR";
    throw err;
  }
}

// ── Fecha de hoy en formato legible para anclar al modelo en el tiempo ───
function fechaHoyISO() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Genera sugerencias de planificación para tareas/exámenes/proyectos
 * pendientes, combinando agenda + horario académico.
 *
 * @param {{ actividades: Array, horario: Array }} datos
 * @returns {Promise<Array<{id, titulo, curso, fechaEntrega, fechaSugerida, razon, urgencia}>>}
 */
export async function generarSugerenciasAgenda({ actividades = [], horario = [] }) {
  const hoy = fechaHoyISO();

  const actividadesTexto = actividades
    .map((a, i) => `${i + 1}. [${a.id}] "${a.titulo}" — curso: ${a.curso || "N/A"} · tipo: ${a.tipo || "tarea"} · entrega: ${a.fecha || "sin fecha"} · estado: ${a.columna || "pendiente"}`)
    .join("\n");

  const horarioTexto = horario
    .map((h) => `- ${h.nombre} — días: ${(h.dias || []).join(", ")} — ${h.horaInicio}–${h.horaFin}`)
    .join("\n");

  const systemPrompt = `Eres un asistente de planificación académica para estudiantes universitarios costarricenses. Hoy es ${hoy}. Respondes SIEMPRE en español de Costa Rica, en JSON válido y nada más (sin texto antes o después, sin markdown).

Tu tarea: analizar las tareas/exámenes/proyectos PENDIENTES (no completados) del estudiante junto con su horario de clases, y sugerir para CADA UNA (máximo 5, prioriza las más urgentes) cuándo conviene iniciarla, considerando:
- Días cercanos a la fecha de entrega.
- Días en que el horario de clases está más cargado (evitar sugerir iniciar ese día) vs días más libres.
- Si hay riesgo de atraso (poco tiempo restante).

Responde SOLO con este JSON (sin texto adicional):
{
  "sugerencias": [
    {
      "id": "<usa el mismo id que viene entre corchetes en la actividad>",
      "titulo": "<título de la tarea>",
      "curso": "<curso>",
      "fechaEntrega": "YYYY-MM-DD",
      "fechaSugerida": "YYYY-MM-DD (día recomendado para iniciar, debe ser hoy o una fecha futura, antes o igual a la entrega)",
      "razon": "<explicación breve, 1-2 oraciones, en tono cercano y útil, mencionando el horario si es relevante>",
      "urgencia": "alta" | "media" | "baja"
    }
  ]
}

Si no hay actividades pendientes con fecha, responde { "sugerencias": [] }.`;

  const userPrompt = `ACTIVIDADES PENDIENTES:\n${actividadesTexto || "(ninguna)"}\n\nHORARIO DE CLASES:\n${horarioTexto || "(sin horario registrado)"}`;

  const texto = await llamarGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { jsonMode: true, temperature: 0.45, maxTokens: 1400 }
  );

  const parsed = parsearJSONSeguro(texto);
  const lista = Array.isArray(parsed?.sugerencias) ? parsed.sugerencias : [];

  // Saneamos cada sugerencia para que siempre tenga forma válida
  return lista
    .filter((s) => s && s.titulo)
    .map((s, i) => ({
      id: s.id || `ia-${i}`,
      titulo: String(s.titulo).slice(0, 120),
      curso: s.curso ? String(s.curso).slice(0, 80) : "",
      fechaEntrega: s.fechaEntrega || "",
      fechaSugerida: s.fechaSugerida || hoy,
      razon: s.razon ? String(s.razon).slice(0, 300) : "",
      urgencia: ["alta", "media", "baja"].includes(s.urgencia) ? s.urgencia : "media",
    }));
}

/**
 * Genera un resumen financiero breve a partir de los movimientos del usuario.
 *
 * @param {{ ingresos: number, egresos: number, disponible: number, porCategoria: Array<[string, number]>, ultimosMovimientos: Array }} datos
 * @returns {Promise<{ resumen: string, tips: string[] }>}
 */
export async function generarResumenFinanciero({
  ingresos = 0,
  egresos = 0,
  disponible = 0,
  porCategoria = [],
  ultimosMovimientos = [],
}) {
  const categoriasTexto = porCategoria
    .map(([cat, monto]) => `- ${cat}: ₡${monto.toLocaleString("es-CR")}`)
    .join("\n");

  const movimientosTexto = ultimosMovimientos
    .slice(0, 8)
    .map((m) => `- ${m.tipo === "ingreso" ? "+" : "-"}₡${Number(m.monto).toLocaleString("es-CR")} · ${m.descripcion} (${m.categoria})`)
    .join("\n");

  const systemPrompt = `Eres un asesor financiero personal para estudiantes universitarios en Costa Rica (moneda: colones, símbolo ₡). Respondes SIEMPRE en español, en JSON válido y nada más.

Analiza los datos financieros del mes del estudiante y genera un resumen breve, cercano y accionable.

Responde SOLO con este JSON:
{
  "resumen": "<2-3 oraciones resumiendo la situación financiera del mes, mencionando cifras concretas en colones cuando ayude>",
  "tips": ["<consejo accionable 1>", "<consejo accionable 2>", "<consejo accionable 3 opcional>"]
}

Los tips deben ser cortos (menos de 18 palabras cada uno), específicos a los datos (categorías, montos), y constructivos — no genéricos.`;

  const userPrompt = `INGRESOS DEL MES: ₡${ingresos.toLocaleString("es-CR")}
GASTOS DEL MES: ₡${egresos.toLocaleString("es-CR")}
SALDO DISPONIBLE: ₡${disponible.toLocaleString("es-CR")}

GASTOS POR CATEGORÍA:
${categoriasTexto || "(sin datos por categoría)"}

ÚLTIMOS MOVIMIENTOS:
${movimientosTexto || "(sin movimientos recientes)"}`;

  const texto = await llamarGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { jsonMode: true, temperature: 0.5, maxTokens: 500 }
  );

  const parsed = parsearJSONSeguro(texto);

  return {
    resumen: typeof parsed?.resumen === "string" ? parsed.resumen.slice(0, 600) : "",
    tips: Array.isArray(parsed?.tips) ? parsed.tips.slice(0, 4).map((t) => String(t).slice(0, 150)) : [],
  };
}
