// ─────────────────────────────────────────────────────────────────────────
// lib/aiService.js
// Capa cliente para consumir la IA. NUNCA llama a Groq directamente —
// siempre pasa por los endpoints internos /api/ia/*, que son los únicos
// que conocen la GROQ_API_KEY (guardada solo en el servidor).
// ─────────────────────────────────────────────────────────────────────────

/**
 * Pide a la IA sugerencias de planificación para la agenda académica.
 * @param {{ actividades: Array, horario: Array }} payload
 * @returns {Promise<Array>} sugerencias (puede ser vacío)
 */
export async function obtenerSugerenciasIA(payload) {
  const res = await fetch("/api/ia/sugerencias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "No se pudieron generar sugerencias. Intentá de nuevo.");
  }

  return data;
}

/**
 * Pide a la IA un resumen inteligente de las finanzas del usuario.
 * @param {{ ingresos: number, egresos: number, disponible: number, porCategoria: Array, ultimosMovimientos: Array }} payload
 * @returns {Promise<{ resumen: string, tips: string[], sinDatos: boolean }>}
 */
export async function obtenerResumenFinancieroIA(payload) {
  const res = await fetch("/api/ia/finanzas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "No se pudo generar el resumen financiero. Intentá de nuevo.");
  }

  return data;
}
