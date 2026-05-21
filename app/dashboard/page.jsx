"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { obtenerGastos, obtenerAgenda, obtenerCursos } from "../../lib/db";
import GalaxyBtn from "../../components/GalaxyBtn";
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
    .filter(a => a.fecha >= hoy && !a.completada)
    .slice(0, 4);
}

function calcularProgresoCarrera(cursos) {
  const aprobados = cursos.filter(c => c.estado === "aprobado");
  const totalCreditos = cursos.reduce((s, c) => s + Number(c.creditos || 0), 0);
  const creditosAprobados = aprobados.reduce((s, c) => s + Number(c.creditos || 0), 0);
  return { totalCreditos, creditosAprobados };
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [gastos, setGastos] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function cargar() {
      const [g, a, c] = await Promise.all([
        obtenerGastos(user.uid),
        obtenerAgenda(user.uid),
        obtenerCursos(user.uid)
      ]);
      setGastos(g);
      setAgenda(a);
      setCursos(c);
      setCargando(false);
    }
    cargar();
  }, [user]);

  if (loading || cargando) return <PageLoader />;
  if (!user) return null;

  const { ingresos, egresos, disponible } = calcularResumenGastos(gastos);
  const proximasActs = obtenerProximasActividades(agenda);
  const { totalCreditos, creditosAprobados } = calcularProgresoCarrera(cursos);
  const pctProgreso = totalCreditos > 0 ? Math.round((creditosAprobados / totalCreditos) * 100) : 0;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h2>{saludo}, {user.displayName?.split(" ")[0] || "Estudiante"} 👋</h2>
          <p>Aquí está tu resumen de hoy</p>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card" style={{ borderLeft:"4px solid #16a34a" }}>
            <div className="stat-label">💵 Disponible</div>
            <div className="stat-value" style={{ color: disponible >= 0 ? "#16a34a" : "#dc2626" }}>
              ₡{disponible.toLocaleString()}
            </div>
            <div className="stat-sub">Ingresos - Gastos del mes</div>
          </div>
          <div className="stat-card" style={{ borderLeft:"4px solid #2563eb" }}>
            <div className="stat-label">📅 Actividades pendientes</div>
            <div className="stat-value">{proximasActs.length}</div>
            <div className="stat-sub">Próximas en tu agenda</div>
          </div>
          <div className="stat-card" style={{ borderLeft:"4px solid #7c3aed" }}>
            <div className="stat-label">🎓 Progreso carrera</div>
            <div className="stat-value">{pctProgreso}%</div>
            <div className="stat-sub">{creditosAprobados} de {totalCreditos} créditos</div>
          </div>
          <div className="stat-card" style={{ borderLeft:"4px solid #d97706" }}>
            <div className="stat-label">📚 Cursos registrados</div>
            <div className="stat-value">{cursos.length}</div>
            <div className="stat-sub">{cursos.filter(c=>c.estado==="activo").length} activos este semestre</div>
          </div>
        </div>

        {/* Content grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
          {/* Finanzas rápidas */}
          <div className="card">
            <div className="flex-between mb-4">
              <span className="card-title">💰 Finanzas del mes</span>
              <Link href="/gastos" style={{ fontSize:"0.8125rem", color:"#2563eb", textDecoration:"none", fontWeight:600 }}>Ver más →</Link>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
              <div style={{ padding:"0.75rem", background:"#dcfce7", borderRadius:8 }}>
                <div style={{ fontSize:"0.75rem", color:"#15803d", fontWeight:600 }}>Ingresos</div>
                <div style={{ fontSize:"1.125rem", fontWeight:700, color:"#15803d" }}>₡{ingresos.toLocaleString()}</div>
              </div>
              <div style={{ padding:"0.75rem", background:"#fee2e2", borderRadius:8 }}>
                <div style={{ fontSize:"0.75rem", color:"#b91c1c", fontWeight:600 }}>Gastos</div>
                <div style={{ fontSize:"1.125rem", fontWeight:700, color:"#b91c1c" }}>₡{egresos.toLocaleString()}</div>
              </div>
            </div>
            {gastos.length === 0 && (
              <p className="text-muted text-center" style={{ marginTop:"1rem" }}>
                Aún no has registrado movimientos.<br/>
                <Link href="/gastos" style={{ color:"#2563eb" }}>Agregar ahora →</Link>
              </p>
            )}
          </div>

          {/* Próximas actividades */}
          <div className="card">
            <div className="flex-between mb-4">
              <span className="card-title">📅 Próximas actividades</span>
              <Link href="/agenda" style={{ fontSize:"0.8125rem", color:"#2563eb", textDecoration:"none", fontWeight:600 }}>Ver más →</Link>
            </div>
            {proximasActs.length === 0 ? (
              <p className="text-muted text-center" style={{ padding:"1rem 0" }}>
                No hay actividades pendientes próximas.<br/>
                <Link href="/agenda" style={{ color:"#2563eb" }}>Agregar a la agenda →</Link>
              </p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {proximasActs.map(a => (
                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.5rem", background:"#f8fafc", borderRadius:8, borderLeft:`3px solid ${a.tipo==="examen"?"#dc2626":a.tipo==="proyecto"?"#7c3aed":"#2563eb"}` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:"0.875rem" }}>{a.titulo}</div>
                      <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{a.curso} · {a.fecha}</div>
                    </div>
                    <span className={`badge badge-${a.tipo==="examen"?"red":a.tipo==="proyecto"?"purple":"blue"}`} style={{ fontSize:"0.7rem" }}>{a.tipo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progreso carrera */}
        <div className="card" style={{ marginTop:"1rem" }}>
          <div className="flex-between mb-4">
            <span className="card-title">🎓 Progreso de carrera</span>
            <Link href="/progreso" style={{ fontSize:"0.8125rem", color:"#2563eb", textDecoration:"none", fontWeight:600 }}>Gestionar →</Link>
          </div>
          {cursos.length === 0 ? (
            <p className="text-muted text-center" style={{ padding:"1rem 0" }}>
              No has registrado cursos aún.<br/>
              <Link href="/progreso" style={{ color:"#2563eb" }}>Agregar cursos →</Link>
            </p>
          ) : (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:"0.875rem" }}>
                <span style={{ color:"#64748b" }}>{creditosAprobados} créditos aprobados de {totalCreditos}</span>
                <span style={{ fontWeight:700, color:"#7c3aed" }}>{pctProgreso}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width:`${pctProgreso}%`, background:"#7c3aed" }} />
              </div>
              <div style={{ display:"flex", gap:"1rem", marginTop:"1rem", flexWrap:"wrap" }}>
                {["aprobado","activo","pendiente"].map(est => {
                  const cnt = cursos.filter(c=>c.estado===est).length;
                  const colores = { aprobado:"#16a34a", activo:"#2563eb", pendiente:"#d97706" };
                  return (
                    <div key={est} style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.8125rem" }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:colores[est] }} />
                      <span style={{ color:"#374151", textTransform:"capitalize" }}>{est}: <strong>{cnt}</strong></span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
