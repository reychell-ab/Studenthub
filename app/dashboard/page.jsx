"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { obtenerGastos, obtenerAgenda, obtenerPlanCarrera } from "../../lib/db";
import PageLoader from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";
import Link from "next/link";

function calcularResumenGastos(gastos) {
  const ingresos = gastos.filter(g => g.tipo === "ingreso").reduce((s, g) => s + Number(g.monto), 0);
  const egresos  = gastos.filter(g => g.tipo === "egreso").reduce((s, g) => s + Number(g.monto), 0);
  return { ingresos, egresos, disponible: ingresos - egresos };
}

function obtenerProximasActividades(agenda) {
  const hoy = new Date().toISOString().split("T")[0];
  return agenda
    .filter(a => a.fecha >= hoy && a.columna !== "realizado" && !a.completada)
    .slice(0, 4);
}

function calcularProgresoDesde(plan) {
  if (!plan?.ciclos) return { totalCreditos: 0, creditosAprobados: 0, todosCursos: [] };
  const todosCursos = Object.values(plan.ciclos).flat();
  const aprobados = todosCursos.filter(c => c.estado === "aprobado");
  const totalCreditos = todosCursos.reduce((s, c) => s + Number(c.creditos || 0), 0);
  const creditosAprobados = aprobados.reduce((s, c) => s + Number(c.creditos || 0), 0);
  return { totalCreditos, creditosAprobados, todosCursos };
}

// ── Pequeños íconos SVG inline ──────────────────────────────────────────────
const IconWallet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SugerenciasIA — Card lista para conectar con el MCP de tu compañero.
 *
 * Props que el MCP debe proveer (vía prop `sugerencias`):
 *   sugerencias: Array<{
 *     id: string,
 *     titulo: string,          // nombre del trabajo/tarea
 *     curso: string,           // nombre del curso
 *     fechaEntrega: string,    // "YYYY-MM-DD"
 *     fechaSugerida: string,   // "YYYY-MM-DD" — día recomendado para iniciar
 *     razon: string,           // explicación breve de la IA (1-2 oraciones)
 *     urgencia: "alta"|"media"|"baja"
 *   }>
 *   cargandoIA: boolean        // true mientras el MCP consulta
 *
 * Cuando no hay prop, muestra estado "desconectado" elegante.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function SugerenciasIA({ sugerencias = null, cargandoIA = false }) {
  const URGENCIA = {
    alta:  { color: "#ef4444", bg: "#fef2f2", label: "Urgente" },
    media: { color: "#f59e0b", bg: "#fffbeb", label: "Esta semana" },
    baja:  { color: "#10b981", bg: "#ecfdf5", label: "Con tiempo" },
  };

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
      {/* Orbes decorativos de fondo */}
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
        {/* Badge estado */}
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          background: sugerencias ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)",
          borderRadius:99, padding:"4px 12px",
          border: sugerencias ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.15)",
        }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background: sugerencias ? "#10b981" : "#6b7280" }} />
          <span style={{ fontSize:"0.7rem", fontWeight:600, color: sugerencias ? "#6ee7b7" : "#9ca3af" }}>
            {cargandoIA ? "Analizando…" : sugerencias ? "Conectado" : "Sin conectar"}
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

      {/* ── Estado: desconectado ── */}
      {!cargandoIA && !sugerencias && (
        <div style={{ position:"relative" }}>
          {/* Tarjetas fantasma (decorativas) */}
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

          {/* Overlay CTA */}
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"0.875rem", color:"#c4b5fd", lineHeight:1.6, marginBottom:"1rem" }}>
              Conecta el asistente de IA para recibir sugerencias<br/>
              personalizadas sobre cuándo iniciar cada trabajo.
            </div>
            {/* Instrucción para el compañero — visible solo en dev si quieres */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6,
              background:"rgba(255,255,255,0.08)",
              border:"1px dashed rgba(167,139,250,0.5)",
              borderRadius:12, padding:"0.6rem 1.1rem",
              fontSize:"0.78rem", color:"#a5b4fc", fontWeight:500,
            }}>
              <IconSparkle />
              Pasa la prop <code style={{ background:"rgba(0,0,0,0.2)", padding:"1px 6px", borderRadius:4, fontFamily:"monospace" }}>sugerencias</code> desde el MCP
            </div>
          </div>
        </div>
      )}

      {/* ── Estado: con datos ── */}
      {!cargandoIA && sugerencias && sugerencias.length === 0 && (
        <div style={{ textAlign:"center", padding:"1.5rem 0", color:"#a5b4fc", fontSize:"0.875rem" }}>
          No hay trabajos pendientes por planificar. ¡Al día! 🎉
        </div>
      )}

      {!cargandoIA && sugerencias && sugerencias.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", position:"relative" }}>
          {sugerencias.map((s) => {
            const urg = URGENCIA[s.urgencia] ?? URGENCIA.media;
            // Días hasta la fecha de inicio sugerida
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
                    <div style={{ fontSize:"0.72rem", color:"#a5b4fc", marginTop:3 }}>{s.curso}</div>

                    {/* Sugerencia */}
                    <div style={{ marginTop:"0.6rem", background:"rgba(99,102,241,0.2)", borderRadius:10, padding:"0.5rem 0.75rem", display:"flex", gap:"0.5rem", alignItems:"flex-start" }}>
                      <span style={{ color:"#c4b5fd", marginTop:1, flexShrink:0 }}><IconSparkle /></span>
                      <span style={{ fontSize:"0.78rem", color:"#ddd6fe", lineHeight:1.5 }}>{s.razon}</span>
                    </div>

                    {/* Footer: inicio sugerido y entrega */}
                    <div style={{ display:"flex", gap:"1rem", marginTop:"0.6rem", flexWrap:"wrap" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.72rem", color:"#a5b4fc" }}>
                        <IconClock />
                        Iniciar: <strong style={{ color:"white" }}>{s.fechaSugerida}</strong>
                        {diasHasta > 0 && <span style={{ color:"#6ee7b7" }}>(en {diasHasta}d)</span>}
                        {diasHasta === 0 && <span style={{ color:"#fbbf24" }}>(hoy)</span>}
                        {diasHasta < 0 && <span style={{ color:"#f87171" }}>(¡ya pasó!)</span>}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.72rem", color:"#a5b4fc" }}>
                        Entrega: <strong style={{ color:"#fca5a5" }}>{s.fechaEntrega}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Acción */}
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
        </div>
      )}
    </div>
  );
}

const TIPO_CONFIG = {
  examen:   { color: "#ef4444", bg: "#fef2f2", label: "Examen" },
  proyecto: { color: "#8b5cf6", bg: "#f5f3ff", label: "Proyecto" },
  tarea:    { color: "#0ea5e9", bg: "#f0f9ff", label: "Tarea" },
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [gastos, setGastos] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [plan, setPlan] = useState({
  ciclos: {}
});
  
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

 useEffect(() => {
  if (!user?.uid) return;

  async function cargar() {
    try {
      const g = await obtenerGastos(user.uid);
      const a = await obtenerAgenda(user.uid);
      const p = await obtenerPlanCarrera(user.uid);

      setGastos(g || []);
      setAgenda(a || []);
      setPlan(p || null);

    } catch (error) {
      console.error("Error Firebase:", error);

      // evita que la app muera
      setGastos([]);
      setAgenda([]);
      setPlan(null);

    } finally {
      setCargando(false);
    }
  }

  cargar();

}, [user]);

  if (loading || cargando) return <PageLoader />;
  if (!user) return null;

  const { ingresos, egresos, disponible } = calcularResumenGastos(gastos);
  const proximasActs = obtenerProximasActividades(agenda);
  const { totalCreditos, creditosAprobados, todosCursos } = calcularProgresoDesde(plan);
  const pctProgreso = totalCreditos > 0 ? Math.round((creditosAprobados / totalCreditos) * 100) : 0;
  const actPendientes = agenda.filter(a => a.columna !== "realizado" && !a.completada).length;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
  const nombre = user.displayName?.split(" ")[0] || "Estudiante";

  // Fecha formateada
  const fechaHoy = new Date().toLocaleDateString("es-CR", {
    weekday: "long", day: "numeric", month: "long"
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ background: "var(--color-surface)", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
              {fechaHoy}
            </p>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1.15, margin: 0 }}>
              {saludo}, {nombre} 👋
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.4rem" }}>
             {actPendientes > 0
    ? `Tienes ${actPendientes} actividades pendientes esta semana.`
    : "No tienes actividades pendientes. ¡Buen trabajo! 🎉"}
            </p>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            {
  icon: <IconWallet />,
  accentColor: disponible >= 0 ? "#10b981" : "#ef4444",
  accentBg: disponible >= 0 ? "#ecfdf5" : "#fef2f2",
  label: "Disponible",
  value:
    gastos.length === 0
      ? "—"
      : `₡${disponible.toLocaleString()}`,
  sub:
    gastos.length === 0
      ? "Sin movimientos registrados"
      : "Ingresos − Gastos del mes",
  href: "/gastos",
},
{
  icon: <IconCalendar />,
  accentColor: "#f59e0b",
  accentBg: "#fffbeb",
  label: "Pendientes",
  value: actPendientes === 0 ? "🎉" : actPendientes,
  sub:
    actPendientes === 0
      ? "Todo al día"
      : "Actividades sin completar",
  href: "/agenda",
},
{
  icon: <IconChart />,
  accentColor: "#6366f1",
  accentBg: "#eef2ff",
  label: "Progreso",
  value: totalCreditos === 0 ? "—" : `${pctProgreso}%`,
  sub:
    totalCreditos === 0
      ? "Agrega cursos"
      : `${creditosAprobados} de ${totalCreditos} créditos`,
  href: "/progreso",
},
{
  icon: <IconBook />,
  accentColor: "#0ea5e9",
  accentBg: "#f0f9ff",
  label: "Cursos",
  value: todosCursos.length === 0 ? "—" : todosCursos.length,
  sub:
    todosCursos.length === 0
      ? "Sin cursos registrados"
      : `${todosCursos.filter(c => c.estado === "matriculado").length} matriculados`,
  href: "/progreso",
},
          ].map((card) => (
            <Link key={card.label} href={card.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--color-card)",
                borderRadius: 16,
                padding: "1.25rem 1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                borderLeft: `4px solid ${card.accentColor}`,
                transition: "transform 0.15s, box-shadow 0.15s",
                cursor: "pointer",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {card.label}
                  </span>
                  <span style={{ color: card.accentColor, background: card.accentBg, borderRadius: 8, padding: "4px 8px", display: "flex" }}>
                    {card.icon}
                  </span>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>{card.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Content grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>

          {/* Finanzas */}
          <div style={{ background: "var(--color-card)", borderRadius: 20, padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>Finanzas del mes</span>
              <Link href="/gastos" style={{ fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>Ver más →</Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ padding: "1rem", background: "var(--accent-progress)", borderRadius: 12 }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Ingresos</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-success)" }}>₡{ingresos.toLocaleString()}</div>
              </div>
              <div style={{ padding: "1rem", background: "rgba(248,113,113,0.12)", borderRadius: 12 }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-danger)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Gastos</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-danger)" }}>₡{egresos.toLocaleString()}</div>
              </div>
            </div>

            {gastos.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", marginTop: "0.5rem" }}>
                Aún no hay movimientos.{" "}
                <Link href="/gastos" style={{ color: "var(--color-primary)" }}>Agregar →</Link>
              </p>
            )}
          </div>

          {/* Próximas actividades */}
          <div style={{ background: "var(--color-card)", borderRadius: 20, padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>Próximas actividades</span>
              <Link href="/agenda" style={{ fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>Ver más →</Link>
            </div>

            {proximasActs.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", paddingTop: "0.5rem" }}>
                No hay actividades próximas.{" "}
                <Link href="/agenda" style={{ color: "var(--color-primary)" }}>Agregar →</Link>
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {proximasActs.map(a => {
                  const cfg = TIPO_CONFIG[a.tipo] ?? TIPO_CONFIG.tarea;
                  return (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      background: "var(--color-card-alt)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                    }}>
                      {/* dot */}
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.titulo}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>{a.curso} · {a.fecha}</div>
                      </div>
                      <span style={{
                        padding: "2px 10px", borderRadius: 20,
                        background: cfg.bg, color: cfg.color,
                        fontSize: "0.68rem", fontWeight: 700,
                        textTransform: "capitalize", flexShrink: 0,
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Progreso de carrera ── */}
        <div style={{ background: "var(--color-card)", borderRadius: 20, padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>Progreso de carrera</span>
            <Link href="/progreso" style={{ fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>Gestionar →</Link>
          </div>

          {todosCursos.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", paddingTop: "0.5rem" }}>
              No has registrado cursos aún.{" "}
              <Link href="/progreso" style={{ color: "var(--color-primary)" }}>Agregar cursos →</Link>
            </p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <span>{creditosAprobados} créditos aprobados de {totalCreditos}</span>
                <span style={{ fontWeight: 800, color: "var(--color-primary)" }}>{pctProgreso}%</span>
              </div>

              {/* Barra de progreso */}
              <div style={{ background: "rgba(129,140,248,0.15)", borderRadius: 99, height: 10, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${pctProgreso}%`,
                  background: "linear-gradient(90deg, #6366f1, #a78bfa)",
                  borderRadius: 99,
                  transition: "width 0.6s ease",
                }} />
              </div>

              {/* Leyenda */}
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                {[
                  { est: "aprobado",   color: "#10b981", label: "Aprobados" },
                  { est: "matriculado", color: "var(--color-primary)", label: "Matriculados" },
                  { est: "pendiente",   color: "#f59e0b", label: "Pendientes" },
                ].map(({ est, color, label }) => {
                  const cnt = todosCursos.filter(c => c.estado === est).length;
                  return (
                    <div key={est} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                      {label}: <strong style={{ color: "var(--text-primary)" }}>{cnt}</strong>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>


        {/*
          ── IA Sugiere ──────────────────────────────────────────────────────
          Para activar esta sección:
          1. Obtener trabajos pendientes de la agenda (obtenerAgenda ya existe).
          2. Llamar al MCP con esos trabajos para que sugiera fechas de inicio.
          3. Guardar el resultado: const [sugerenciasIA, setSugerenciasIA] = useState(null)
          4. Pasar: <SugerenciasIA sugerencias={sugerenciasIA} cargandoIA={cargandoMCP} />

          Estructura de cada sugerencia → ver JSDoc del componente SugerenciasIA arriba.
          ────────────────────────────────────────────────────────────────────
        */}
        <SugerenciasIA
          sugerencias={null}   /* ← reemplazar con el estado del MCP */
          cargandoIA={false}   /* ← true mientras el MCP consulta    */
        />

      </main>
    </div>
  );
}
