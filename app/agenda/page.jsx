"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { agregarActividad, obtenerAgenda, eliminarActividad, actualizarActividad } from "../../lib/db";
import GalaxyBtn from "../../components/GalaxyBtn";
import PageLoader from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";

const TIPOS = ["tarea","examen","proyecto","laboratorio","otro"];
const TIPO_COLOR = { tarea:"blue", examen:"red", proyecto:"purple", laboratorio:"green", otro:"gray" };

function ordenarPorFecha(acts) {
  return [...acts].sort((a,b) => (a.fecha||"").localeCompare(b.fecha||""));
}

export default function AgendaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [agenda, setAgenda] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [form, setForm] = useState({ titulo:"", curso:"", fecha:"", tipo:"tarea", descripcion:"", nota:"" });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => {
    if (!user) return;
    obtenerAgenda(user.uid).then(a => { setAgenda(a); setCargando(false); });
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.fecha || !form.curso.trim()) {
      setMsg({ tipo:"error", texto:"Completa título, curso y fecha." });
      return;
    }
    setGuardando(true);
    const nueva = { ...form, completada: false };
    const ref = await agregarActividad(user.uid, nueva);
    setAgenda(prev => ordenarPorFecha([...prev, { id: ref.id, ...nueva }]));
    setForm({ titulo:"", curso:"", fecha:"", tipo:"tarea", descripcion:"", nota:"" });
    setModal(false);
    setMsg({ tipo:"success", texto:"Actividad agregada a la agenda." });
    setGuardando(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const toggleCompletada = async (act) => {
    const nuevo = !act.completada;
    await actualizarActividad(user.uid, act.id, { completada: nuevo });
    setAgenda(prev => prev.map(a => a.id === act.id ? { ...a, completada: nuevo } : a));
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar esta actividad?")) return;
    await eliminarActividad(user.uid, id);
    setAgenda(prev => prev.filter(a => a.id !== id));
  };

  const hoy = new Date().toISOString().split("T")[0];
  const actsFiltradas = agenda.filter(a => {
    if (filtro === "pendientes") return !a.completada;
    if (filtro === "completadas") return a.completada;
    if (TIPOS.includes(filtro)) return a.tipo === filtro;
    return true;
  });

  const pendientes = agenda.filter(a => !a.completada).length;
  const vencidas = agenda.filter(a => !a.completada && a.fecha < hoy).length;
  const hoyActs = agenda.filter(a => a.fecha === hoy).length;

  if (loading || cargando) return <PageLoader />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="flex-between page-header">
          <div>
            <h2>📅 Agenda Académica</h2>
            <p>Gestiona tareas, exámenes y proyectos de tus cursos</p>
          </div>
          <GalaxyBtn onClick={() => setModal(true)}>+ Nueva actividad</GalaxyBtn>
        </div>

        {msg && <div className={`alert alert-${msg.tipo === "success" ? "success" : "error"}`}>{msg.texto}</div>}

        <div className="stat-grid">
          <div className="stat-card"><div className="stat-label">📋 Pendientes</div><div className="stat-value">{pendientes}</div></div>
          <div className="stat-card"><div className="stat-label">📆 Hoy</div><div className="stat-value" style={{ color:"#2563eb" }}>{hoyActs}</div></div>
          <div className="stat-card"><div className="stat-label">⚠️ Vencidas</div><div className="stat-value" style={{ color: vencidas>0?"#dc2626":"#16a34a" }}>{vencidas}</div></div>
          <div className="stat-card"><div className="stat-label">✅ Completadas</div><div className="stat-value" style={{ color:"#16a34a" }}>{agenda.filter(a=>a.completada).length}</div></div>
        </div>

        {/* Filtros */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1rem" }}>
          {["todos","pendientes","completadas",...TIPOS].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`btn btn-sm ${filtro===f ? "btn-primary" : "btn-ghost"}`}
              style={{ textTransform:"capitalize" }}>{f}</button>
          ))}
        </div>

        {/* Lista */}
        <div className="card">
          {actsFiltradas.length === 0 ? (
            <p className="text-muted text-center" style={{ padding:"2rem 0" }}>
              {filtro === "todos" ? "No hay actividades registradas." : `No hay actividades de tipo "${filtro}".`}
            </p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
              {actsFiltradas.map(a => {
                const vencida = !a.completada && a.fecha < hoy;
                const esHoy   = a.fecha === hoy;
                return (
                  <div key={a.id} style={{
                    display:"flex", alignItems:"flex-start", gap:"0.75rem", padding:"0.875rem",
                    background: a.completada ? "#f0fdf4" : vencida ? "#fff1f2" : esHoy ? "#eff6ff" : "#f8fafc",
                    borderRadius:10, border:`1px solid ${a.completada?"#86efac":vencida?"#fca5a5":esHoy?"#93c5fd":"#e2e8f0"}`,
                    opacity: a.completada ? 0.75 : 1
                  }}>
                    <button onClick={() => toggleCompletada(a)} style={{
                      width:22, height:22, minWidth:22, borderRadius:"50%", cursor:"pointer",
                      border:`2px solid ${a.completada?"#16a34a":"#d1d5db"}`,
                      background: a.completada ? "#16a34a" : "white",
                      color:"white", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center"
                    }}>{a.completada ? "✓" : ""}</button>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontWeight:600, fontSize:"0.9rem", textDecoration: a.completada?"line-through":"none", color:"#0f172a" }}>{a.titulo}</span>
                        <span className={`badge badge-${TIPO_COLOR[a.tipo]||"gray"}`} style={{ fontSize:"0.7rem" }}>{a.tipo}</span>
                        {vencida && <span className="badge badge-red" style={{ fontSize:"0.7rem" }}>⚠️ Vencida</span>}
                        {esHoy && !a.completada && <span className="badge badge-blue" style={{ fontSize:"0.7rem" }}>Hoy</span>}
                      </div>
                      <div style={{ fontSize:"0.8125rem", color:"#64748b", marginTop:3 }}>
                        📚 {a.curso} · 📅 {a.fecha}
                        {a.descripcion && ` · ${a.descripcion}`}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ color:"#dc2626" }}
                      onClick={() => handleEliminar(a.id)}>🗑</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
        {modal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
            <div className="modal-box">
              <div className="modal-header">
                <h3>Nueva actividad</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
              </div>
              <form onSubmit={handleAgregar}>
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input className="form-input" placeholder="Ej. Examen parcial de Cálculo"
                    value={form.titulo} onChange={e => set("titulo", e.target.value)} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Curso *</label>
                    <input className="form-input" placeholder="Ej. Cálculo 1"
                      value={form.curso} onChange={e => set("curso", e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-select" value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                      {TIPOS.map(t => <option key={t} style={{ textTransform:"capitalize" }}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input className="form-input" type="date" min={hoy}
                    value={form.fecha} onChange={e => set("fecha", e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción (opcional)</label>
                  <textarea className="form-textarea" placeholder="Temas a estudiar, instrucciones, etc."
                    value={form.descripcion} onChange={e => set("descripcion", e.target.value)} rows={3} />
                </div>
                <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={guardando}>
                    {guardando ? "Guardando..." : "Agregar actividad"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
