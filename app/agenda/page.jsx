"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { agregarActividad, obtenerAgenda, eliminarActividad, actualizarActividad } from "../../lib/db";
import Sidebar from "../../components/Sidebar";
import GalaxyBtn from "../../components/GalaxyBtn";
import PageLoader from "../../components/PageLoader";

const TIPOS = ["tarea","examen","proyecto","laboratorio","otro"];
const TIPO_COLOR = { tarea:"#2563eb", examen:"#dc2626", proyecto:"#7c3aed", laboratorio:"#16a34a", otro:"#64748b" };
const COLUMNAS = [
  { id:"pendiente",  label:"📋 Pendiente",  color:"#f59e0b", bg:"#fffbeb", border:"#fbbf24" },
  { id:"en_curso",   label:"⚙️ En curso",   color:"#2563eb", bg:"#eff6ff", border:"#93c5fd" },
  { id:"realizado",  label:"✅ Realizado",  color:"#16a34a", bg:"#f0fdf4", border:"#86efac" },
];

export default function AgendaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ titulo:"", curso:"", fecha:"", tipo:"tarea", descripcion:"", columna:"pendiente" });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const dragItem = useRef(null);
  const dragOverCol = useRef(null);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => {
    if (!user) return;
    obtenerAgenda(user.uid).then(a => {
      // Migrar actividades viejas que no tienen columna
      const migradas = a.map(act => ({
        ...act,
        columna: act.columna || (act.completada ? "realizado" : "pendiente")
      }));
      setActividades(migradas);
      setCargando(false);
    });
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const hoy = new Date().toISOString().split("T")[0];

  const abrirNueva = (columna = "pendiente") => {
    setEditando(null);
    setForm({ titulo:"", curso:"", fecha:"", tipo:"tarea", descripcion:"", columna });
    setModal(true);
  };
  const abrirEditar = (act) => {
    setEditando(act.id);
    setForm({ titulo:act.titulo, curso:act.curso||"", fecha:act.fecha||"", tipo:act.tipo||"tarea", descripcion:act.descripcion||"", columna:act.columna||"pendiente" });
    setModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { setMsg({ tipo:"error", texto:"El título es obligatorio." }); return; }
    setGuardando(true);
    const datos = { titulo:form.titulo.trim(), curso:form.curso.trim(), fecha:form.fecha, tipo:form.tipo, descripcion:form.descripcion.trim(), columna:form.columna, completada: form.columna === "realizado" };
    if (editando) {
      await actualizarActividad(user.uid, editando, datos);
      setActividades(prev => prev.map(a => a.id === editando ? { ...a, ...datos } : a));
    } else {
      const ref = await agregarActividad(user.uid, datos);
      setActividades(prev => [...prev, { id:ref.id, ...datos }]);
    }
    setModal(false); setEditando(null);
    setMsg({ tipo:"success", texto: editando ? "Actividad actualizada." : "Actividad agregada." });
    setGuardando(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar esta actividad?")) return;
    await eliminarActividad(user.uid, id);
    setActividades(prev => prev.filter(a => a.id !== id));
    setModal(false);
  };

  // ── Drag & Drop ──────────────────────────────────────────
  const onDragStart = (e, act) => {
    dragItem.current = act;
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = "0.5";
  };
  const onDragEnd = (e) => { e.currentTarget.style.opacity = "1"; };
  const onDragOver = (e, colId) => {
    e.preventDefault();
    dragOverCol.current = colId;
  };
  const onDrop = async (e, colId) => {
    e.preventDefault();
    const act = dragItem.current;
    if (!act || act.columna === colId) { dragItem.current = null; return; }
    const nuevaDatos = { columna: colId, completada: colId === "realizado" };
    await actualizarActividad(user.uid, act.id, nuevaDatos);
    setActividades(prev => prev.map(a => a.id === act.id ? { ...a, ...nuevaDatos } : a));
    dragItem.current = null;
  };

  // Filtrar por búsqueda
  const filtradas = actividades.filter(a =>
    !busqueda || a.titulo?.toLowerCase().includes(busqueda.toLowerCase()) || a.curso?.toLowerCase().includes(busqueda.toLowerCase())
  );

  function actsPorColumna(colId) {
    return filtradas.filter(a => (a.columna || "pendiente") === colId);
  }

  const vencidas = actividades.filter(a => a.fecha && a.fecha < hoy && a.columna !== "realizado").length;

  if (loading || cargando) return <PageLoader />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding:"1.5rem", overflow:"hidden", display:"flex", flexDirection:"column", height:"100vh" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:8 }}>
          <div>
            <h2 style={{ fontSize:"1.5rem", fontWeight:700, color:"#0f172a" }}>📅 Agenda Académica</h2>
            <p style={{ fontSize:"0.875rem", color:"#64748b", marginTop:2 }}>
              {actividades.filter(a=>a.columna==="pendiente").length} pendientes · {actividades.filter(a=>a.columna==="en_curso").length} en curso · {actividades.filter(a=>a.columna==="realizado").length} realizadas
              {vencidas > 0 && <span style={{ color:"#dc2626", marginLeft:8 }}>· ⚠️ {vencidas} vencidas</span>}
            </p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input
              placeholder="🔍 Buscar..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ padding:"0.5rem 0.75rem", border:"1px solid #e2e8f0", borderRadius:8, fontSize:"0.875rem", outline:"none", width:180 }}
            />
            <GalaxyBtn onClick={() => abrirNueva()}>+ Nueva</GalaxyBtn>
          </div>
        </div>

        {msg && <div className={`alert alert-${msg.tipo==="success"?"success":"error"}`} style={{ marginBottom:"0.75rem" }}>{msg.texto}</div>}

        {/* Instrucción drag */}
        <p style={{ fontSize:"0.75rem", color:"#94a3b8", marginBottom:"0.75rem" }}>
          💡 Arrastrá las tarjetas entre columnas para cambiar su estado
        </p>

        {/* Kanban Board */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", flex:1, overflow:"hidden" }}>
          {COLUMNAS.map(col => {
            const items = actsPorColumna(col.id);
            return (
              <div
                key={col.id}
                onDragOver={e => onDragOver(e, col.id)}
                onDrop={e => onDrop(e, col.id)}
                style={{
                  background: col.bg,
                  border: `2px solid ${col.border}`,
                  borderRadius: 12,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                  minHeight: 0,
                }}
              >
                {/* Columna header */}
                <div style={{ padding:"0.875rem 1rem", borderBottom:`1px solid ${col.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontWeight:700, color:col.color, fontSize:"0.9rem" }}>{col.label}</span>
                    <span style={{ background:col.color, color:"white", borderRadius:999, width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:700 }}>{items.length}</span>
                  </div>
                  <button
                    onClick={() => abrirNueva(col.id)}
                    style={{ background:"none", border:"none", color:col.color, cursor:"pointer", fontSize:1.25+"rem", fontWeight:700, lineHeight:1, padding:"0 4px" }}
                    title="Agregar en esta columna">+</button>
                </div>

                {/* Tarjetas */}
                <div style={{ padding:"0.75rem", overflowY:"auto", flex:1, display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                  {items.length === 0 && (
                    <div style={{
                      border:`2px dashed ${col.border}`, borderRadius:8,
                      padding:"1.5rem", textAlign:"center",
                      color:col.color, fontSize:"0.8125rem", opacity:0.6
                    }}>
                      Soltá una tarjeta aquí
                    </div>
                  )}
                  {items.map(act => {
                    const vencida = act.fecha && act.fecha < hoy && col.id !== "realizado";
                    return (
                      <div
                        key={act.id}
                        draggable
                        onDragStart={e => onDragStart(e, act)}
                        onDragEnd={onDragEnd}
                        onClick={() => abrirEditar(act)}
                        style={{
                          background: "white",
                          border: `1px solid ${vencida ? "#fca5a5" : "#e2e8f0"}`,
                          borderLeft: `4px solid ${TIPO_COLOR[act.tipo] || "#64748b"}`,
                          borderRadius: 8,
                          padding: "0.75rem",
                          cursor: "grab",
                          transition: "box-shadow 0.15s, transform 0.15s",
                          userSelect: "none",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.1)"; e.currentTarget.style.transform="translateY(-1px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="translateY(0)"; }}
                      >
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:6 }}>
                          <span style={{ fontWeight:600, fontSize:"0.875rem", color:"#0f172a", lineHeight:1.35 }}>{act.titulo}</span>
                          <span style={{ background:TIPO_COLOR[act.tipo]+"20", color:TIPO_COLOR[act.tipo], fontSize:"0.68rem", fontWeight:700, padding:"2px 7px", borderRadius:999, flexShrink:0, textTransform:"uppercase" }}>{act.tipo}</span>
                        </div>
                        {act.curso && <div style={{ fontSize:"0.75rem", color:"#64748b", marginTop:4 }}>📚 {act.curso}</div>}
                        {act.descripcion && <div style={{ fontSize:"0.75rem", color:"#94a3b8", marginTop:3, lineHeight:1.4 }}>{act.descripcion}</div>}
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
                          {act.fecha
                            ? <span style={{ fontSize:"0.7rem", color: vencida ? "#dc2626" : "#64748b", fontWeight: vencida ? 700 : 400 }}>
                                {vencida ? "⚠️ " : "📅 "}{act.fecha}
                              </span>
                            : <span />
                          }
                          <button
                            onClick={e => { e.stopPropagation(); handleEliminar(act.id); }}
                            style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:"0.75rem", padding:"2px 4px" }}
                            onMouseEnter={e => e.currentTarget.style.color="#dc2626"}
                            onMouseLeave={e => e.currentTarget.style.color="#94a3b8"}
                          >🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {modal && (
          <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
            <div className="modal-box" style={{ maxWidth:460 }}>
              <div className="modal-header">
                <h3>{editando ? "Editar actividad" : "Nueva actividad"}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
              </div>
              {msg && <div className={`alert alert-${msg.tipo==="success"?"success":"error"}`}>{msg.texto}</div>}
              <form onSubmit={handleGuardar}>
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input className="form-input" placeholder="Ej. Examen parcial de Cálculo"
                    value={form.titulo} onChange={e=>set("titulo",e.target.value)} required />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Curso</label>
                    <input className="form-input" placeholder="Ej. Cálculo 1"
                      value={form.curso} onChange={e=>set("curso",e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-select" value={form.tipo} onChange={e=>set("tipo",e.target.value)}>
                      {TIPOS.map(t=><option key={t} style={{textTransform:"capitalize"}}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input className="form-input" type="date" value={form.fecha} onChange={e=>set("fecha",e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Columna</label>
                    <select className="form-select" value={form.columna} onChange={e=>set("columna",e.target.value)}>
                      {COLUMNAS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-textarea" rows={2} placeholder="Notas adicionales..."
                    value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} />
                </div>
                <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                  {editando && <button type="button" className="btn btn-danger btn-sm" onClick={()=>handleEliminar(editando)}>Eliminar</button>}
                  <button type="button" className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando?"Guardando...":editando?"Actualizar":"Agregar"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
