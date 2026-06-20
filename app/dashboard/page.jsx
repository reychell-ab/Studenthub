"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { obtenerGastos, obtenerAgenda, obtenerHorario, obtenerCursos, obtenerPerfil } from "../../lib/db";
import { obtenerSugerenciasIA } from "../../lib/aiService";
import PageLoader from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";
import SugerenciasIA from "../../components/SugerenciasIA";
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


function actividadesParaIA(agenda) {
  return agenda.filter(a => a.columna !== "realizado" && !a.completada && a.fecha);
}


function calcularProgresoCarrera(cursos, perfil) {
  const aprobados = cursos.filter(c => c.estado === "aprobado");
  const credAprobados = aprobados.reduce((s, c) => s + (Number(c.creditos) || 0), 0);
  const creditosCarrera = Number(perfil?.creditosTotales) || 0;
  const pct = creditosCarrera > 0 ? Math.round((credAprobados / creditosCarrera) * 100) : 0;
  return { credAprobados, creditosCarrera, pct, aprobados, totalCursos: cursos.length };
}


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
  const [horario, setHorario] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);


  const [sugerenciasIA, setSugerenciasIA] = useState(null);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState(null);
  const [sinDatosIA, setSinDatosIA] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) return;

    async function cargar() {
      try {
        const [g, a, h, c, p] = await Promise.all([
          obtenerGastos(user.uid),
          obtenerAgenda(user.uid),
          obtenerHorario(user.uid),
          obtenerCursos(user.uid),
          obtenerPerfil(user.uid),
        ]);
        setGastos(g || []);
        setAgenda(a || []);
        setHorario(h || []);
        setCursos(c || []);
        setPerfil(p || null);
      } catch (error) {
        console.error("Error Firebase:", error);
        setGastos([]); setAgenda([]); setHorario([]); setCursos([]); setPerfil(null);
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [user]);

  
  const consultarIA = useCallback(async (agendaActual, horarioActual) => {
    const pendientes = actividadesParaIA(agendaActual);

    if (pendientes.length === 0) {
      setSinDatosIA(true);
      setSugerenciasIA([]);
      setErrorIA(null);
      return;
    }

    setSinDatosIA(false);
    setCargandoIA(true);
    setErrorIA(null);
    try {
      const data = await obtenerSugerenciasIA({ actividades: pendientes, horario: horarioActual });
      setSugerenciasIA(data.sugerencias || []);
      setSinDatosIA(!!data.sinDatos);
    } catch (err) {
      setErrorIA(err.message || "No se pudieron generar sugerencias.");
      setSugerenciasIA(null);
    } finally {
      setCargandoIA(false);
    }
  }, []);

  useEffect(() => {
    if (cargando) return;
    consultarIA(agenda, horario);
  
  }, [cargando]);

  if (loading || cargando) return <PageLoader />;
  if (!user) return null;

  const { ingresos, egresos, disponible } = calcularResumenGastos(gastos);
  const proximasActs = obtenerProximasActividades(agenda);
  const { credAprobados, creditosCarrera, pct: pctProgreso, aprobados, totalCursos } = calcularProgresoCarrera(cursos, perfil);
  const actPendientes = agenda.filter(a => a.columna !== "realizado" && !a.completada).length;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
  const nombre = user.displayName?.split(" ")[0] || "Estudiante";

  const fechaHoy = new Date().toLocaleDateString("es-CR", {
    weekday: "long", day: "numeric", month: "long"
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ background: "var(--color-surface)", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: "2rem", flexWrap: "wrap", gap: "1rem",
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
              value: gastos.length === 0 ? "—" : `₡${disponible.toLocaleString()}`,
              sub: gastos.length === 0 ? "Sin movimientos registrados" : "Ingresos − Gastos del mes",
              href: "/gastos",
            },
            {
              icon: <IconCalendar />,
              accentColor: "#f59e0b",
              accentBg: "#fffbeb",
              label: "Pendientes",
              value: actPendientes === 0 ? "🎉" : actPendientes,
              sub: actPendientes === 0 ? "Todo al día" : "Actividades sin completar",
              href: "/agenda",
            },
            {
              icon: <IconChart />,
              accentColor: "#6366f1",
              accentBg: "#eef2ff",
              label: "Progreso",
              value: creditosCarrera === 0 ? "—" : `${pctProgreso}%`,
              sub: creditosCarrera === 0 ? "Define tus créditos en Progreso" : `${credAprobados} de ${creditosCarrera} créditos`,
              href: "/progreso",
            },
            {
              icon: <IconBook />,
              accentColor: "#0ea5e9",
              accentBg: "#f0f9ff",
              label: "Cursos",
              value: totalCursos === 0 ? "—" : totalCursos,
              sub: totalCursos === 0 ? "Sin cursos registrados" : `${cursos.filter(c => c.estado === "matriculado").length} matriculados`,
              href: "/progreso",
            },
          ].map((card) => (
            <Link key={card.label} href={card.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--color-card)", borderRadius: 16, padding: "1.25rem 1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)", borderLeft: `4px solid ${card.accentColor}`,
                transition: "transform 0.15s, box-shadow 0.15s", cursor: "pointer",
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
                      padding: "0.75rem 1rem", background: "var(--color-card-alt)",
                      border: "1px solid var(--color-border)", borderRadius: 12,
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.titulo}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>{a.curso} · {a.fecha}</div>
                      </div>
                      <span style={{
                        padding: "2px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color,
                        fontSize: "0.68rem", fontWeight: 700, textTransform: "capitalize", flexShrink: 0,
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

        {/* ── Progreso de carrera (única fuente: misma fórmula que Progreso) ── */}
        <div style={{ background: "var(--color-card)", borderRadius: 20, padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>Progreso de carrera</span>
            <Link href="/progreso" style={{ fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>Gestionar →</Link>
          </div>

          {totalCursos === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", paddingTop: "0.5rem" }}>
              No has registrado cursos aún.
              <br />
              <Link href="/progreso" style={{ color: "var(--color-primary)", display: "inline-block", marginTop: 8 }}>
                <span style={{ background: "var(--color-primary)", color: "white", padding: "0.45rem 1rem", borderRadius: 10, fontWeight: 600, fontSize: "0.8125rem" }}>
                  + Agregar cursos
                </span>
              </Link>
            </p>
          ) : creditosCarrera === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", paddingTop: "0.5rem" }}>
              Definí el total de créditos de tu carrera en tu perfil académico para ver tu % de avance.
              <br />
              <Link href="/progreso" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Completar perfil académico →</Link>
            </p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <span>{credAprobados} créditos aprobados de {creditosCarrera} — {pctProgreso}% completado</span>
                <span style={{ fontWeight: 800, color: "var(--color-primary)" }}>{pctProgreso}%</span>
              </div>

              <div style={{ background: "rgba(129,140,248,0.15)", borderRadius: 99, height: 10, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${Math.min(pctProgreso, 100)}%`,
                  background: "linear-gradient(90deg, #6366f1, #a78bfa)",
                  borderRadius: 99, transition: "width 0.6s ease",
                }} />
              </div>

              <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                {[
                  { est: "aprobado",    color: "#10b981", label: "Aprobados" },
                  { est: "matriculado", color: "var(--color-primary)", label: "Matriculados" },
                  { est: "pendiente",   color: "#f59e0b", label: "Pendientes" },
                ].map(({ est, color, label }) => {
                  const cnt = cursos.filter(c => c.estado === est).length;
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

        {/* ── IA Sugiere ── */}
        <SugerenciasIA
          sugerencias={sugerenciasIA}
          cargandoIA={cargandoIA}
          error={errorIA}
          sinDatos={sinDatosIA}
          onReintentar={() => consultarIA(agenda, horario)}
        />

      </main>
    </div>
  );
}
