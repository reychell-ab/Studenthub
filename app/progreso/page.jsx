"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { agregarCurso, obtenerCursos, actualizarCurso, eliminarCurso } from "../../lib/db";
import GalaxyBtn from "../../components/GalaxyBtn";
import PageLoader from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";

const ESTADOS = ["activo","aprobado","reprobado","pendiente","retirado"];
const ESTADO_BADGE = { activo:"blue", aprobado:"green", reprobado:"red", pendiente:"gray", retirado:"yellow" };

function calcularNotaNecesaria(notaActual, peso, puntajeMax) {
  // ¿Cuánto necesito en el rubro restante para pasar?
  const faltante = 100 - peso;
  if (faltante <= 0) return null;
  const necesito = (70 - (notaActual * peso / 100)) / (faltante / 100);
  return Math.min(Math.max(necesito, 0), puntajeMax || 100);
}

function promedioGeneral(cursos) {
  const aprobados = cursos.filter(c => c.nota !== undefined && c.nota !== "" && c.estado === "aprobado");
  if (aprobados.length === 0) return null;
  return aprobados.reduce((s,c) => s + Number(c.nota), 0) / aprobados.length;
}

export default function ProgresoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [modalCalc, setModalCalc] = useState(false);
  const [form, setForm] = useState({ nombre:"", codigo:"", creditos:"", semestre:"", nota:"", estado:"activo" });
  const [calc, setCalc] = useState({ notaActual:"", peso:"", notaMax:"100" });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [editId, setEditId] = useState(null);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => {
    if (!user) return;
    obtenerCursos(user.uid).then(c => { setCursos(c); setCargando(false); });
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setC = (k, v) => setCalc(f => ({ ...f, [k]: v }));

  const abrirEditar = (c) => {
    setEditId(c.id);
    setForm({ nombre:c.nombre, codigo:c.codigo||"", creditos:c.creditos, semestre:c.semestre||"", nota:c.nota||"", estado:c.estado });
    setModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.creditos) {
      setMsg({ tipo:"error", texto:"Completa nombre y créditos." });
      return;
    }
    setGuardando(true);
    const datos = { nombre:form.nombre.trim(), codigo:form.codigo, creditos:Number(form.creditos), semestre:form.semestre, nota: form.nota !== "" ? Number(form.nota) : "", estado:form.estado };
    if (editId) {
      await actualizarCurso(user.uid, editId, datos);
      setCursos(prev => prev.map(c => c.id === editId ? { ...c, ...datos } : c));
    } else {
      const ref = await agregarCurso(user.uid, datos);
      setCursos(prev => [...prev, { id: ref.id, ...datos }]);
    }
    setForm({ nombre:"", codigo:"", creditos:"", semestre:"", nota:"", estado:"activo" });
    setEditId(null);
    setModal(false);
    setMsg({ tipo:"success", texto: editId ? "Curso actualizado." : "Curso agregado." });
    setGuardando(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este curso?")) return;
    await eliminarCurso(user.uid, id);
    setCursos(prev => prev.filter(c => c.id !== id));
  };

  // Estadísticas
  const totalCreditos = cursos.reduce((s,c) => s + Number(c.creditos||0), 0);
  const creditosAprobados = cursos.filter(c=>c.estado==="aprobado").reduce((s,c) => s + Number(c.creditos||0), 0);
  const pct = totalCreditos > 0 ? Math.round((creditosAprobados/totalCreditos)*100) : 0;
  const prom = promedioGeneral(cursos);

  // Calculadora notas
  const notaNecesaria = calc.notaActual !== "" && calc.peso !== ""
    ? calcularNotaNecesaria(Number(calc.notaActual), Number(calc.peso), Number(calc.notaMax))
    : null;
  const proyeccion = calc.notaActual !== "" && calc.peso !== "" && notaNecesaria !== null
    ? (Number(calc.notaActual) * Number(calc.peso)/100) + (notaNecesaria * (100-Number(calc.peso))/100)
    : null;

  const cursosActivos = cursos.filter(c=>c.estado==="activo");
  const cursosAprobados = cursos.filter(c=>c.estado==="aprobado");

  if (loading || cargando) return <PageLoader />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="flex-between page-header">
          <div>
            <h2>📈 Progreso Académico</h2>
            <p>Seguimiento de carrera, notas y créditos</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-ghost" onClick={() => setModalCalc(true)}>🧮 Calcular nota</button>
            <GalaxyBtn onClick={() => { setEditId(null); setForm({ nombre:"", codigo:"", creditos:"", semestre:"", nota:"", estado:"activo" }); setModal(true); }}>+ Agregar curso</GalaxyBtn>
          </div>
        </div>

        {msg && <div className={`alert alert-${msg.tipo === "success" ? "success" : "error"}`}>{msg.texto}</div>}

        {/* Progreso general */}
        <div className="card mb-6">
          <div className="flex-between" style={{ marginBottom:"0.75rem" }}>
            <span className="card-title">🎓 Progreso de carrera</span>
            <span style={{ fontWeight:700, fontSize:"1.25rem", color:"#7c3aed" }}>{pct}%</span>
          </div>
          <div className="progress-bar" style={{ height:14 }}>
            <div className="progress-fill" style={{ width:`${pct}%`, background:"linear-gradient(90deg, #7c3aed, #2563eb)" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8125rem", color:"#64748b", marginTop:6 }}>
            <span>{creditosAprobados} créditos aprobados</span>
            <span>{totalCreditos - creditosAprobados} créditos restantes</span>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card"><div className="stat-label">📚 Cursos activos</div><div className="stat-value" style={{ color:"#2563eb" }}>{cursosActivos.length}</div></div>
          <div className="stat-card"><div className="stat-label">✅ Cursos aprobados</div><div className="stat-value" style={{ color:"#16a34a" }}>{cursosAprobados.length}</div></div>
          <div className="stat-card">
            <div className="stat-label">📊 Promedio general</div>
            <div className="stat-value" style={{ color: prom && prom >= 70 ? "#16a34a" : prom ? "#dc2626" : "#64748b" }}>
              {prom !== null ? prom.toFixed(1) : "—"}
            </div>
          </div>
          <div className="stat-card"><div className="stat-label">🎯 Total créditos</div><div className="stat-value">{totalCreditos}</div></div>
        </div>

        {/* Tabla de cursos */}
        <div className="card">
          <span className="card-title mb-4" style={{ display:"block" }}>📋 Lista de cursos</span>
          {cursos.length === 0 ? (
            <p className="text-muted text-center" style={{ padding:"2rem 0" }}>
              No hay cursos registrados.<br/>
              <button className="btn btn-primary btn-sm" style={{ marginTop:"0.75rem" }} onClick={() => setModal(true)}>+ Agregar primer curso</button>
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Curso</th><th>Código</th><th>Créditos</th><th>Semestre</th><th>Nota</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {cursos.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight:600 }}>{c.nombre}</td>
                    <td style={{ color:"#64748b", fontFamily:"monospace" }}>{c.codigo || "—"}</td>
                    <td style={{ textAlign:"center", fontWeight:600 }}>{c.creditos}</td>
                    <td style={{ color:"#64748b" }}>{c.semestre || "—"}</td>
                    <td style={{ fontWeight:700, color: c.nota >= 70 ? "#16a34a" : c.nota !== "" && c.nota !== undefined ? "#dc2626" : "#64748b" }}>
                      {c.nota !== "" && c.nota !== undefined ? `${Number(c.nota).toFixed(1)}` : "—"}
                    </td>
                    <td><span className={`badge badge-${ESTADO_BADGE[c.estado]||"gray"}`} style={{ textTransform:"capitalize" }}>{c.estado}</span></td>
                    <td>
                      <div style={{ display:"flex", gap:4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => abrirEditar(c)}>✏️</button>
                        <button className="btn btn-ghost btn-sm" style={{ color:"#dc2626" }} onClick={() => handleEliminar(c.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal agregar/editar curso */}
        {modal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
            <div className="modal-box">
              <div className="modal-header">
                <h3>{editId ? "Editar curso" : "Agregar curso"}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
              </div>
              <form onSubmit={handleGuardar}>
                <div className="form-group">
                  <label className="form-label">Nombre del curso *</label>
                  <input className="form-input" placeholder="Ej. Cálculo 1"
                    value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Código</label>
                    <input className="form-input" placeholder="MA0101"
                      value={form.codigo} onChange={e => set("codigo", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Créditos *</label>
                    <input className="form-input" type="number" min="1" max="20" placeholder="4"
                      value={form.creditos} onChange={e => set("creditos", e.target.value)} required />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Semestre</label>
                    <input className="form-input" placeholder="I-2025"
                      value={form.semestre} onChange={e => set("semestre", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nota final</label>
                    <input className="form-input" type="number" min="0" max="100" step="0.1" placeholder="75.5"
                      value={form.nota} onChange={e => set("nota", e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={form.estado} onChange={e => set("estado", e.target.value)}>
                    {ESTADOS.map(s => <option key={s} style={{ textTransform:"capitalize" }}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={guardando}>
                    {guardando ? "Guardando..." : editId ? "Actualizar" : "Agregar curso"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal calculadora */}
        {modalCalc && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalCalc(false)}>
            <div className="modal-box">
              <div className="modal-header">
                <h3>🧮 Calculadora de notas</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setModalCalc(false)}>✕</button>
              </div>
              <p style={{ fontSize:"0.875rem", color:"#64748b", marginBottom:"1rem" }}>
                Calcula cuánto necesitas en un examen o rubro final para aprobar.
              </p>
              <div className="form-group">
                <label className="form-label">Nota acumulada hasta ahora (0-100)</label>
                <input className="form-input" type="number" min="0" max="100" step="0.1" placeholder="Ej. 65"
                  value={calc.notaActual} onChange={e => setC("notaActual", e.target.value)} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Porcentaje ya evaluado (%)</label>
                  <input className="form-input" type="number" min="0" max="100" step="1" placeholder="Ej. 60"
                    value={calc.peso} onChange={e => setC("peso", e.target.value)} />
                  <div style={{ fontSize:"0.75rem", color:"#64748b", marginTop:4 }}>Ej: si llevás 60% del curso evaluado</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nota máxima del rubro restante</label>
                  <input className="form-input" type="number" min="1" max="100" step="1" placeholder="100"
                    value={calc.notaMax} onChange={e => setC("notaMax", e.target.value)} />
                </div>
              </div>

              {notaNecesaria !== null && (
                <div style={{ background:"#eff6ff", border:"1px solid #93c5fd", borderRadius:10, padding:"1rem", marginTop:"0.5rem" }}>
                  <div style={{ fontSize:"0.875rem", color:"#1d4ed8", fontWeight:600, marginBottom:4 }}>Resultado</div>
                  <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>
                    <div>
                      <div style={{ fontSize:"0.75rem", color:"#64748b" }}>Necesitás sacar</div>
                      <div style={{ fontSize:"1.5rem", fontWeight:800, color: notaNecesaria > 70 ? "#dc2626" : "#16a34a" }}>
                        {notaNecesaria.toFixed(1)}
                      </div>
                      <div style={{ fontSize:"0.75rem", color:"#64748b" }}>en el {100-Number(calc.peso)}% restante</div>
                    </div>
                    <div>
                      <div style={{ fontSize:"0.75rem", color:"#64748b" }}>Nota proyectada</div>
                      <div style={{ fontSize:"1.5rem", fontWeight:800, color: proyeccion >= 70 ? "#16a34a" : "#dc2626" }}>
                        {proyeccion?.toFixed(1)}
                      </div>
                      <div style={{ fontSize:"0.75rem", color:"#64748b" }}>si sacás lo necesario</div>
                    </div>
                  </div>
                  {notaNecesaria > Number(calc.notaMax) && (
                    <div className="alert alert-error" style={{ marginTop:"0.75rem", marginBottom:0 }}>
                      ⚠️ No es posible aprobar con la nota acumulada actual. La nota necesaria supera el máximo del rubro.
                    </div>
                  )}
                  {notaNecesaria <= 0 && (
                    <div className="alert alert-success" style={{ marginTop:"0.75rem", marginBottom:0 }}>
                      ✅ ¡Ya tenés asegurada la nota mínima para aprobar!
                    </div>
                  )}
                </div>
              )}

              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"1rem" }}>
                <button className="btn btn-ghost" onClick={() => { setModalCalc(false); setCalc({ notaActual:"", peso:"", notaMax:"100" }); }}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
