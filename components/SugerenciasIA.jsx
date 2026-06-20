"use client";
import Link from "next/link";

// ── Pequeños íconos SVG inline ──────────────────────────────────────────────
const IconSparkle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default function SugerenciasIA({
  sugerencias = null,
  cargandoIA = false,
  error = null,
  onReintentar = null,
  onAgendar = null,
  sinDatos = false,
}) {
  const URGENCIA = {
    alta:  { color: "#ef4444", bg: "#fef2f2", label: "Urgente" },
    media: { color: "#f59e0b", bg: "#fffbeb", label: "Esta semana" },
    baja:  { color: "#10b981", bg: "#ecfdf5", label: "Con tiempo" },
  };

  const conectado = !cargandoIA && !error && Array.isArray(sugerencias);

  return (
    <div style={{
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)",
      borderRadius: 20,
      padding: "1.5rem",
      marginTop: "1.25rem",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(99,102,241,0.25)",
    }}>
      <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(167,139,250,0.12)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-30, left:60, width:120, height:120, borderRadius:"50%", background:"rgba(99,102,241,0.15)", pointerEvents:"none" }} />

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem", position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
          <div style={{ background:"rgba(167,139,250,0.25)", borderRadius:10, padding:"6px 8px", display:"flex", color:"#c4b5fd" }}>
            <IconSparkle />
          </div>
          <div>
            <span style={{ fontWeight:800, color:"white", fontSize:"1rem", display:"block", lineHeight:1.2 }}>
              IA Sugiere
            </span>
            <span style={{ fontSize:"0.7rem", color:"#a5b4fc", fontWeight:500 }}>
              Planificación inteligente de trabajos
            </span>
          </div>
        </div>
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          background: error ? "rgba(248,113,113,0.18)" : conectado ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)",
          borderRadius:99, padding:"4px 12px",
          border: error ? "1px solid rgba(248,113,113,0.4)" : conectado ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.15)",
        }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background: error ? "#f87171" : conectado ? "#10b981" : "#6b7280" }} />
          <span style={{ fontSize:"0.7rem", fontWeight:600, color: error ? "#fca5a5" : conectado ? "#6ee7b7" : "#9ca3af" }}>
            {cargandoIA ? "Analizando…" : error ? "Error" : conectado ? "Conectado" : "Sin conectar"}
          </span>
        </div>
      </div>

      {/* ── Estado: cargando ── */}
      {cargandoIA && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"2rem 0", gap:"0.75rem" }}>
          <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid rgba(167,139,250,0.3)", borderTop:"3px solid #a78bfa", animation:"spin 0.8s linear infinite" }} />
          <span style={{ color:"#c4b5fd", fontSize:"0.85rem" }}>Analizando tus trabajos pendientes…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Estado: error ── */}
      {!cargandoIA && error && (
        <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
          <div style={{ color:"#fca5a5", display:"flex", justifyContent:"center", marginBottom:"0.6rem" }}>
            <IconAlert />
          </div>
          <div style={{ color:"#fecaca", fontSize:"0.85rem", marginBottom:"1rem", lineHeight:1.5 }}>
            {error}
          </div>
          {onReintentar && (
            <button
              onClick={onReintentar}
              style={{
                background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)",
                borderRadius:10, padding:"0.5rem 1.1rem", color:"white", fontSize:"0.8rem",
                fontWeight:600, cursor:"pointer",
              }}
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* ── Estado: aún no se ha consultado ── */}
      {!cargandoIA && !error && sugerencias === null && !sinDatos && (
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem", marginBottom:"1.25rem", opacity:0.35, filter:"blur(1.5px)", pointerEvents:"none", userSelect:"none" }}>
            {[
              { titulo:"Proyecto final de Bases de Datos", urgencia:"alta", dias:"3 días" },
              { titulo:"Ensayo Filosofía del Derecho", urgencia:"media", dias:"6 días" },
            ].map((item, i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"0.85rem 1rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background: i===0?"#ef4444":"#f59e0b", flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ color:"white", fontWeight:600, fontSize:"0.85rem" }}>{item.titulo}</div>
                  <div style={{ color:"#a5b4fc", fontSize:"0.7rem", marginTop:2 }}>Iniciar en {item.dias}</div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:99, padding:"2px 10px", fontSize:"0.68rem", color:"white", fontWeight:600 }}>
                  {item.urgencia === "alta" ? "Urgente" : "Esta semana"}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"0.875rem", color:"#c4b5fd", lineHeight:1.6 }}>
              Cargando tus trabajos pendientes…
            </div>
          </div>
        </div>
      )}

      {/* ── Estado: sin datos suficientes ── */}
      {!cargandoIA && !error && sinDatos && (
        <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
          <div style={{ color:"#a5b4fc", fontSize:"0.875rem", lineHeight:1.6, marginBottom:"0.5rem" }}>
            No tenés tareas, exámenes o proyectos pendientes registrados todavía.
          </div>
          <Link href="/agenda" style={{ fontSize:"0.8rem", color:"#c4b5fd", fontWeight:600, textDecoration:"none" }}>
            Agregar a la agenda →
          </Link>
        </div>
      )}

      {/* ── Estado: con datos, sin pendientes ── */}
      {!cargandoIA && !error && sugerencias && sugerencias.length === 0 && !sinDatos && (
        <div style={{ textAlign:"center", padding:"1.5rem 0", color:"#a5b4fc", fontSize:"0.875rem" }}>
          No hay trabajos pendientes por planificar. ¡Al día! 🎉
        </div>
      )}

      {/* ── Estado: con sugerencias ── */}
      {!cargandoIA && !error && sugerencias && sugerencias.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", position:"relative" }}>
          {sugerencias.map((s) => {
            const urg = URGENCIA[s.urgencia] ?? URGENCIA.media;
            const diasHasta = Math.ceil((new Date(s.fechaSugerida) - new Date()) / 86400000);
            return (
              <div key={s.id} style={{
                background:"rgba(255,255,255,0.07)",
                border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:14, padding:"1rem 1.1rem",
                backdropFilter:"blur(4px)",
              }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:urg.color, marginTop:5, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.5rem", flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700, color:"white", fontSize:"0.9rem" }}>{s.titulo}</span>
                      <span style={{ background:urg.bg, color:urg.color, borderRadius:99, padding:"2px 10px", fontSize:"0.68rem", fontWeight:700, flexShrink:0 }}>
                        {urg.label}
                      </span>
                    </div>
                    {s.curso && <div style={{ fontSize:"0.72rem", color:"#a5b4fc", marginTop:3 }}>{s.curso}</div>}

                    {s.razon && (
                      <div style={{ marginTop:"0.6rem", background:"rgba(99,102,241,0.2)", borderRadius:10, padding:"0.5rem 0.75rem", display:"flex", gap:"0.5rem", alignItems:"flex-start" }}>
                        <span style={{ color:"#c4b5fd", marginTop:1, flexShrink:0 }}><IconSparkle /></span>
                        <span style={{ fontSize:"0.78rem", color:"#ddd6fe", lineHeight:1.5 }}>{s.razon}</span>
                      </div>
                    )}

                    <div style={{ display:"flex", gap:"1rem", marginTop:"0.6rem", flexWrap:"wrap" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.72rem", color:"#a5b4fc" }}>
                        <IconClock />
                        Iniciar: <strong style={{ color:"white" }}>{s.fechaSugerida}</strong>
                        {diasHasta > 0 && <span style={{ color:"#6ee7b7" }}>(en {diasHasta}d)</span>}
                        {diasHasta === 0 && <span style={{ color:"#fbbf24" }}>(hoy)</span>}
                        {diasHasta < 0 && <span style={{ color:"#f87171" }}>(¡ya pasó!)</span>}
                      </div>
                      {s.fechaEntrega && (
                        <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.72rem", color:"#a5b4fc" }}>
                          Entrega: <strong style={{ color:"#fca5a5" }}>{s.fechaEntrega}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Acción: agendar */}
          {onAgendar ? (
            <button
              onClick={onAgendar}
              style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                marginTop:"0.25rem", padding:"0.65rem",
                background:"rgba(255,255,255,0.08)",
                border:"1px solid rgba(255,255,255,0.12)",
                borderRadius:12,
                color:"#c4b5fd", fontSize:"0.82rem", fontWeight:600,
                cursor:"pointer", transition:"background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >
              Agendar sugerencias <IconArrowRight />
            </button>
          ) : (
            <Link href="/agenda" style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              marginTop:"0.25rem", padding:"0.65rem",
              background:"rgba(255,255,255,0.08)",
              border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:12, textDecoration:"none",
              color:"#c4b5fd", fontSize:"0.82rem", fontWeight:600,
              transition:"background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >
              Agendar sugerencias <IconArrowRight />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
