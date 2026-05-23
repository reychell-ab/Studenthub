"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import {
  agregarEntradaHorario, obtenerHorario,
  eliminarEntradaHorario, actualizarEntradaHorario
} from "../../lib/db";
import GalaxyBtn from "../../components/GalaxyBtn";
import PageLoader from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";

// ── Constantes ───────────────────────────────────────────
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_CORTO = ["L", "K", "M", "J", "V", "S"];
const HORA_INICIO = 7;   // 7:00 AM
const HORA_FIN    = 22;  // 10:00 PM
const SLOT_H      = 56;  // px por hora

const COLORES = [
  { id:"blue",     bg:"#2563eb", light:"#dbeafe", text:"#1d4ed8" },
  { id:"green",    bg:"#16a34a", light:"#dcfce7", text:"#15803d" },
  { id:"amber",    bg:"#d97706", light:"#fef3c7", text:"#b45309" },
  { id:"red",      bg:"#dc2626", light:"#fee2e2", text:"#b91c1c" },
  { id:"purple",   bg:"#7c3aed", light:"#ede9fe", text:"#6d28d9" },
  { id:"pink",     bg:"#db2777", light:"#fce7f3", text:"#be185d" },
  { id:"teal",     bg:"#0d9488", light:"#ccfbf1", text:"#0f766e" },
  { id:"orange",   bg:"#ea580c", light:"#ffedd5", text:"#c2410c" },
  { id:"indigo",   bg:"#4f46e5", light:"#e0e7ff", text:"#4338ca" },
  { id:"cyan",     bg:"#0891b2", light:"#cffafe", text:"#0e7490" },
  { id:"lime",     bg:"#65a30d", light:"#ecfccb", text:"#4d7c0f" },
  { id:"rose",     bg:"#e11d48", light:"#ffe4e6", text:"#be123c" },
  { id:"sky",      bg:"#0284c7", light:"#e0f2fe", text:"#0369a1" },
  { id:"violet",   bg:"#7c3aed", light:"#f5f3ff", text:"#5b21b6" },
  { id:"fuchsia",  bg:"#a21caf", light:"#fdf4ff", text:"#86198f" },
  { id:"slate",    bg:"#475569", light:"#f1f5f9", text:"#334155" },
];

// ── Utilidades ───────────────────────────────────────────
function horaAMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatoHora12(hora) {
  if (!hora) return "";

  const [h, m] = hora.split(":").map(Number);
  const periodo = h >= 12 ? "PM" : "AM";
  const hora12 = h % 12 || 12;

  return `${hora12}:${String(m || 0).padStart(2, "0")} ${periodo}`;
}

function minutosAPixeles(minutos) {
  return ((minutos - HORA_INICIO * 60) / 60) * SLOT_H;
}

function duracionPx(inicio, fin) {
  return ((horaAMinutos(fin) - horaAMinutos(inicio)) / 60) * SLOT_H;
}

function horasDelDia() {
  const horas = [];
  for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
    horas.push(`${String(h).padStart(2,"0")}:00`);
  }
  return horas;
}

function colorPorId(id) {
  return COLORES.find(c => c.id === id) || COLORES[0];
}

function generarHorasInicio() {
  const opts = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    opts.push(`${String(h).padStart(2,"0")}:00`);
  }
  return opts;
}
function generarHorasFin() {
  const opts = [];
  for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
    opts.push(`${String(h).padStart(2,"0")}:50`);
  }
  return opts;
}

// ── Componente principal ─────────────────────────────────
export default function HorarioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entradas, setEntradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [descargando, setDescargando] = useState(false);
  const gridRef = useRef(null);
  const calendarRef = useRef(null);

  const horasInicio = generarHorasInicio();
  const horasFin = generarHorasFin();
  const horasGrid = horasDelDia();

  const formInicial = {
    nombre: "", aula: "", dias: [],
    horaInicio: "07:00", horaFin: "07:50", color: "blue"
  };
  const [form, setForm] = useState(formInicial);
  const [modoNombre, setModoNombre] = useState("nuevo"); // "nuevo" | "existente"

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    obtenerHorario(user.uid).then(h => { setEntradas(h); setCargando(false); });
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleDia = (dia) => {
    setForm(f => ({
      ...f,
      dias: f.dias.includes(dia) ? f.dias.filter(d => d !== dia) : [...f.dias, dia]
    }));
  };

  const abrirAgregar = () => {
    setEditando(null);
    setForm(formInicial);
    setModoNombre("nuevo");
    setModal(true);
  };

  const abrirEditar = (e) => {
    setEditando(e.id);
    setForm({ nombre:e.nombre, aula:e.aula||"", dias:e.dias, horaInicio:e.horaInicio, horaFin:e.horaFin, color:e.color||"blue" });
    setModoNombre("nuevo");
    setModal(true);
  };

  const handleGuardar = async (ev) => {
    ev.preventDefault();
    if (!form.nombre.trim()) { setMsg({ tipo:"error", texto:"Ingresa el nombre del curso." }); return; }
    if (form.dias.length === 0) { setMsg({ tipo:"error", texto:"Selecciona al menos un día." }); return; }
    if (horaAMinutos(form.horaFin) <= horaAMinutos(form.horaInicio)) {
      setMsg({ tipo:"error", texto:"La hora de fin debe ser posterior al inicio." }); return;
    }
    setGuardando(true);
    const datos = { nombre:form.nombre.trim(), aula:form.aula.trim(), dias:form.dias, horaInicio:form.horaInicio, horaFin:form.horaFin, color:form.color };
    if (editando) {
      await actualizarEntradaHorario(user.uid, editando, datos);
      setEntradas(prev => prev.map(e => e.id === editando ? { ...e, ...datos } : e));
    } else {
      const ref = await agregarEntradaHorario(user.uid, datos);
      setEntradas(prev => [...prev, { id:ref.id, ...datos }]);
    }
    setModal(false);
    setEditando(null);
    setMsg({ tipo:"success", texto: editando ? "Curso actualizado." : "Curso agregado al horario." });
    setGuardando(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este curso del horario?")) return;
    await eliminarEntradaHorario(user.uid, id);
    setEntradas(prev => prev.filter(e => e.id !== id));
  };

  const capturarGrid = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const el = calendarRef.current;
    // Temporarily remove scroll restriction so full grid renders
    const scrollDiv = el.querySelector("#grid-scroll");
    const prevMax = scrollDiv ? scrollDiv.style.maxHeight : null;
    if (scrollDiv) scrollDiv.style.maxHeight = "none";
    await new Promise(r => setTimeout(r, 80)); // let layout settle
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });
    if (scrollDiv && prevMax !== null) scrollDiv.style.maxHeight = prevMax;
    return canvas;
  };

  const descargarImagen = async () => {
    if (!calendarRef.current) return;
    setDescargando(true);
    try {
      const canvas = await capturarGrid();
      const link = document.createElement("a");
      link.download = "horario-semanal.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      setMsg({ tipo:"error", texto:"Error al generar la imagen. Intentá de nuevo." });
      setTimeout(() => setMsg(null), 3000);
    }
    setDescargando(false);
  };

  const descargarPDF = async () => {
    if (!calendarRef.current) return;
    setDescargando(true);
    try {
      const canvas = await capturarGrid();
      const { jsPDF } = await import("jspdf");
      const imgData = canvas.toDataURL("image/png");
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      const pdf = new jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "px", format: [w, h] });
      pdf.addImage(imgData, "PNG", 0, 0, w, h);
      pdf.save("horario-semanal.pdf");
    } catch (e) {
      setMsg({ tipo:"error", texto:"Error al generar el PDF. Intentá de nuevo." });
      setTimeout(() => setMsg(null), 3000);
    }
    setDescargando(false);
  };

  // Bloques por día
  function entradasDelDia(diaIdx) {
    const dia = DIAS[diaIdx];
    return entradas.filter(e => e.dias?.includes(dia));
  }

  if (loading || cargando) return <PageLoader />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding:"1.5rem", overflow:"hidden" }}>

        {/* Header */}
        <div className="flex-between page-header" style={{ marginBottom:"1rem" }}>
          <div>
            <h2>🗓️ Horario Semanal</h2>
            <p>{entradas.length} {entradas.length === 1 ? "curso registrado" : "cursos registrados"}</p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button
              onClick={descargarImagen}
              disabled={descargando || entradas.length === 0}
              className="cursor-pointer group relative flex gap-1.5 px-8 py-4 bg-black bg-opacity-80 text-[#f1f1f1] rounded-3xl hover:bg-opacity-70 transition font-semibold shadow-md"
              style={{ opacity:(descargando||entradas.length===0)?0.5:1, cursor:(descargando||entradas.length===0)?"not-allowed":"pointer", fontSize:"0.875rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="20px" width="20px">
                <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="#f1f1f1" d="M6 21H18M12 3V17M12 17L17 12M12 17L7 12" />
              </svg>
              {descargando ? "..." : "PNG"}
              <div className="absolute opacity-0 -bottom-full rounded-md py-2 px-2 bg-black bg-opacity-70 left-1/2 -translate-x-1/2 group-hover:opacity-100 transition-opacity shadow-lg"
                style={{ fontSize:"0.75rem", whiteSpace:"nowrap", zIndex:10 }}>
                Descargar imagen
              </div>
            </button>
            <button
              onClick={descargarPDF}
              disabled={descargando || entradas.length === 0}
              className="cursor-pointer group relative flex gap-1.5 px-8 py-4 bg-black bg-opacity-80 text-[#f1f1f1] rounded-3xl hover:bg-opacity-70 transition font-semibold shadow-md"
              style={{ opacity:(descargando||entradas.length===0)?0.5:1, cursor:(descargando||entradas.length===0)?"not-allowed":"pointer", fontSize:"0.875rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="20px" width="20px">
                <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="#f1f1f1" d="M6 21H18M12 3V17M12 17L17 12M12 17L7 12" />
              </svg>
              {descargando ? "..." : "PDF"}
              <div className="absolute opacity-0 -bottom-full rounded-md py-2 px-2 bg-black bg-opacity-70 left-1/2 -translate-x-1/2 group-hover:opacity-100 transition-opacity shadow-lg"
                style={{ fontSize:"0.75rem", whiteSpace:"nowrap", zIndex:10 }}>
                Descargar PDF
              </div>
            </button>
            <GalaxyBtn onClick={abrirAgregar}>+ Agregar curso</GalaxyBtn>
          </div>
        </div>

        {msg && <div className={`alert alert-${msg.tipo === "success" ? "success" : "error"}`} style={{ marginBottom:"1rem" }}>{msg.texto}</div>}

        {/* Leyenda de cursos */}
        {entradas.length > 0 && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:"1rem" }}>
            {[...new Map(entradas.map(e => [e.nombre, e])).values()].map(e => {
              const c = colorPorId(e.color);
              return (
                <div key={e.nombre} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:999, background:c.light, border:`1px solid ${c.bg}20` }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:c.bg }} />
                  <span style={{ fontSize:"0.8125rem", fontWeight:600, color:c.text }}>{e.nombre}</span>
                  {e.aula && <span style={{ fontSize:"0.75rem", color:c.text, opacity:0.7 }}>· {e.aula}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Calendario semanal */}
        <div ref={calendarRef} className="card" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:`56px repeat(${DIAS.length}, 1fr)`, borderBottom:"1px solid #e2e8f0" }}>
            {/* Celda vacía esquina */}
            <div style={{ padding:"0.75rem 0", borderRight:"1px solid #e2e8f0" }} />
            {/* Encabezados de días */}
            {DIAS.map((dia, i) => (
              <div key={dia} style={{ padding:"0.75rem 0.5rem", textAlign:"center", borderRight: i < DIAS.length-1 ? "1px solid #e2e8f0" : "none" }}>
                <div style={{ fontSize:"0.75rem", fontWeight:700, color:"#64748b", letterSpacing:"0.05em" }}>{DIAS_CORTO[i]}</div>
                <div style={{ fontSize:"0.8125rem", color:"#0f172a", fontWeight:500 }}>{dia}</div>
              </div>
            ))}
          </div>

          {/* Cuerpo del grid */}
          <div style={{ overflowY:"auto", maxHeight:"calc(100vh - 280px)" }} id="grid-scroll">
            <div ref={gridRef} style={{ display:"grid", gridTemplateColumns:`56px repeat(${DIAS.length}, 1fr)`, position:"relative" }}>

              {/* Columna de horas */}
              <div style={{ borderRight:"1px solid #e2e8f0" }}>
                {horasGrid.map(h => (
                  <div key={h} style={{ height:SLOT_H, borderBottom:"1px solid #f1f5f9", padding:"4px 6px 0", display:"flex", alignItems:"flex-start", justifyContent:"flex-end" }}>
                    <span style={{ fontSize:"0.7rem", color:"#94a3b8", fontWeight:500 }}>{h}</span>
                  </div>
                ))}
              </div>

              {/* Columnas de días */}
              {DIAS.map((dia, diaIdx) => {
                const bloques = entradasDelDia(diaIdx);
                return (
                  <div key={dia} style={{ position:"relative", borderRight: diaIdx < DIAS.length-1 ? "1px solid #e2e8f0" : "none" }}>
                    {/* Líneas de hora */}
                    {horasGrid.map(h => (
                      <div key={h} style={{ height:SLOT_H, borderBottom:"1px solid #f1f5f9" }} />
                    ))}

                    {/* Bloques de cursos */}
                    {bloques.map(entrada => {
                      const c = colorPorId(entrada.color);
                      const top = minutosAPixeles(horaAMinutos(entrada.horaInicio));
                      const altura = Math.max(duracionPx(entrada.horaInicio, entrada.horaFin), 24);
                      return (
                        <div
                          key={entrada.id}
                          onClick={() => abrirEditar(entrada)}
                          style={{
                            position:"absolute",
                            top: top + 1,
                            left: 3,
                            right: 3,
                            height: altura - 2,
                            background: c.light,
                            border: `1.5px solid ${c.bg}`,
                            borderLeft: `4px solid ${c.bg}`,
                            borderRadius: 6,
                            padding: "3px 6px",
                            cursor: "pointer",
                            zIndex: 2,
                            transition: "opacity 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
                          onMouseLeave={e => e.currentTarget.style.opacity="1"}
                          title={`${entrada.nombre}${entrada.aula ? " · " + entrada.aula : ""} | ${formatoHora12(entrada.horaInicio)} – ${formatoHora12(entrada.horaFin)}`}
                        >
                          <div style={{ fontSize:"0.72rem", fontWeight:700, color:c.text, lineHeight:1.25, wordBreak:"break-word", overflowWrap:"break-word", whiteSpace:"pre-wrap" }}>
                            {entrada.nombre}
                          </div>
                          <div style={{ fontSize:"0.65rem", color:c.text, opacity:0.8, marginTop:2, lineHeight:1.2 }}>
                            {formatoHora12(entrada.horaInicio)}–{formatoHora12(entrada.horaFin)}
                            {entrada.aula ? ` · ${entrada.aula}` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lista de cursos debajo */}
        {entradas.length > 0 && (
          <div className="card" style={{ marginTop:"1rem" }}>
            <span className="card-title" style={{ display:"block", marginBottom:"0.75rem" }}>📋 Cursos en el horario</span>
            <table className="data-table">
              <thead>
                <tr><th>Curso</th><th>Aula</th><th>Días</th><th>Horario</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {entradas.map(e => {
                  const c = colorPorId(e.color);
                  return (
                    <tr key={e.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:12, height:12, borderRadius:3, background:c.bg, flexShrink:0 }} />
                          <span style={{ fontWeight:600 }}>{e.nombre}</span>
                        </div>
                      </td>
                      <td style={{ color:"#64748b" }}>{e.aula || "—"}</td>
                      <td>
                        <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                          {DIAS_CORTO.map((d, i) => (
                            <span key={d} style={{
                              width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:"0.7rem", fontWeight:700,
                              background: e.dias?.includes(DIAS[i]) ? c.bg : "#f1f5f9",
                              color: e.dias?.includes(DIAS[i]) ? "white" : "#94a3b8"
                            }}>{d}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontFamily:"monospace", fontSize:"0.875rem" }}>{e.horaInicio} – {e.horaFin}</td>
                      <td>
                        <div style={{ display:"flex", gap:4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => abrirEditar(e)}>✏️</button>
                          <button className="btn btn-ghost btn-sm" style={{ color:"#dc2626" }} onClick={() => handleEliminar(e.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Estado vacío */}
        {entradas.length === 0 && (
          <div className="card" style={{ marginTop:"1rem", textAlign:"center", padding:"3rem" }}>
            <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>🗓️</div>
            <div style={{ fontWeight:700, fontSize:"1.125rem", color:"#0f172a", marginBottom:4 }}>Tu horario está vacío</div>
            <p style={{ color:"#64748b", fontSize:"0.875rem", marginBottom:"1.25rem" }}>Agregá tus cursos para visualizar tu semana</p>
            <GalaxyBtn onClick={abrirAgregar}>+ Agregar primer curso</GalaxyBtn>
          </div>
        )}

        {/* Modal agregar/editar */}
        {modal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
            <div className="modal-box" style={{ maxWidth:520 }}>
              <div className="modal-header">
                <h3>{editando ? "Editar curso" : "Agregar curso al horario"}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
              </div>

              {msg && <div className={`alert alert-${msg.tipo === "success" ? "success" : "error"}`}>{msg.texto}</div>}

              <form onSubmit={handleGuardar}>
                {/* Selector: curso existente o nuevo */}
                {(() => {
                  const nombresUnicos = [...new Set(entradas.map(e => e.nombre))].sort();
                  return (
                    <div className="form-group">
                      <label className="form-label">Nombre del curso *</label>
                      {nombresUnicos.length > 0 && (
                        <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                          {["existente","nuevo"].map(m => (
                            <button key={m} type="button"
                              onClick={() => { setModoNombre(m); if(m==="nuevo") set("nombre",""); }}
                              className={`btn btn-sm ${modoNombre===m?"btn-primary":"btn-ghost"}`}
                              style={{ textTransform:"capitalize", flex:1 }}>
                              {m === "existente" ? "📚 Desde existentes" : "✏️ Nombre nuevo"}
                            </button>
                          ))}
                        </div>
                      )}
                      {modoNombre === "existente" && nombresUnicos.length > 0 ? (
                        <select className="form-select" value={form.nombre}
                          onChange={e => {
                            const sel = entradas.find(en => en.nombre === e.target.value);
                            set("nombre", e.target.value);
                            if (sel) {
                              set("color", sel.color || "blue");
                            }
                          }} required>
                          <option value="">-- Seleccioná un curso --</option>
                          {nombresUnicos.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      ) : (
                        <input className="form-input" placeholder="Ej. Cálculo 1"
                          value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
                      )}
                    </div>
                  );
                })()}
                <div className="form-group">
                  <label className="form-label">Aula / Lugar</label>
                  <input className="form-input" placeholder="Ej. Aula 301"
                    value={form.aula} onChange={e => set("aula", e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Días *</label>
                  <div style={{ display:"flex", gap:6 }}>
                    {DIAS.map((dia, i) => (
                      <button key={dia} type="button"
                        onClick={() => toggleDia(dia)}
                        style={{
                          width:36, height:36, borderRadius:"50%", border:"1.5px solid",
                          cursor:"pointer", fontSize:"0.75rem", fontWeight:700,
                          background: form.dias.includes(dia) ? "#2563eb" : "white",
                          borderColor: form.dias.includes(dia) ? "#2563eb" : "#d1d5db",
                          color: form.dias.includes(dia) ? "white" : "#64748b",
                          transition:"all 0.15s"
                        }}>
                        {DIAS_CORTO[i]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Hora inicio *</label>
                    <select className="form-select" value={form.horaInicio} onChange={e => set("horaInicio", e.target.value)}>
                      {horasInicio.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora fin *</label>
                    <select className="form-select" value={form.horaFin} onChange={e => set("horaFin", e.target.value)}>
                      {horasFin.filter(h => h > form.horaInicio).map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {COLORES.map(c => (
                      <button key={c.id} type="button" onClick={() => set("color", c.id)}
                        style={{
                          width:28, height:28, borderRadius:"50%", background:c.bg, border:"none", cursor:"pointer",
                          outline: form.color === c.id ? `3px solid ${c.bg}` : "none",
                          outlineOffset: 2, transform: form.color === c.id ? "scale(1.15)" : "scale(1)",
                          transition:"all 0.15s"
                        }} />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {form.nombre && form.dias.length > 0 && (
                  <div style={{ marginBottom:"1rem", padding:"0.75rem", background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0" }}>
                    <div style={{ fontSize:"0.75rem", color:"#64748b", marginBottom:6, fontWeight:600 }}>Vista previa</div>
                    <div style={{
                      display:"inline-flex", alignItems:"center", gap:8, padding:"6px 12px",
                      background:colorPorId(form.color).light, borderLeft:`4px solid ${colorPorId(form.color).bg}`,
                      borderRadius:6
                    }}>
                      <span style={{ fontWeight:700, fontSize:"0.875rem", color:colorPorId(form.color).text }}>{form.nombre}</span>
                      <span style={{ fontSize:"0.75rem", color:colorPorId(form.color).text, opacity:0.75 }}>
                        {form.horaInicio} – {form.horaFin} · {form.dias.map(d => DIAS_CORTO[DIAS.indexOf(d)]).join(", ")}
                        {form.aula && ` · ${form.aula}`}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                  {editando && (
                    <button type="button" className="btn btn-danger btn-sm"
                      onClick={() => { handleEliminar(editando); setModal(false); }}>
                      Eliminar
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={guardando}>
                    {guardando ? "Guardando..." : editando ? "Actualizar" : "Agregar al horario"}
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
