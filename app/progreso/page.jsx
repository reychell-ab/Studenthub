"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import {
  agregarCurso,
  obtenerCursos,
  actualizarCurso,
  eliminarCurso,
  guardarPerfil,
  obtenerPerfil
} from "../../lib/db";
import Sidebar from "../../components/Sidebar";
import GalaxyBtn from "../../components/GalaxyBtn";
import PageLoader from "../../components/PageLoader";

export default function ProgresoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cursos, setCursos] = useState([]); // cursos manuales (legacy)
     // plan completo del PDF
  const [ciclos, setCiclos] = useState({}); // { 1: [...cursos], 2: [...] }
  const [cargando, setCargando] = useState(true);
  const [modalCurso, setModalCurso] = useState(false);
  const [editandoCurso, setEditandoCurso] = useState(null); // { ciclo, idx }
  const [formCurso, setFormCurso] = useState({ sigla: "", nombre: "", creditos: "", anio: 1, semestre: "I", estado: "pendiente", nota: "" });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [verAnio, setVerAnio] = useState("todos");
  const [perfil, setPerfil] = useState(null);

const [carrera, setCarrera] = useState("");
const [universidad, setUniversidad] = useState("");
const [creditosTotales, setCreditosTotales] = useState("");
const [editandoPerfil, setEditandoPerfil] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => {
    if (!user) return;
Promise.all([
  obtenerCursos(user.uid),
  obtenerPerfil(user.uid)
]).then(([cs, perfilData]) => {
            setCursos(cs);

            const cursosPorCiclo = {};

cs.forEach((curso) => {
  const ciclo =
    (Number(curso.anio || 1) - 1) * 2 +
    (curso.semestre === "I" ? 1 : 2);

  if (!cursosPorCiclo[ciclo]) {
    cursosPorCiclo[ciclo] = [];
  }

  cursosPorCiclo[ciclo].push(curso);
});

setCiclos(cursosPorCiclo);

            if (perfilData) {
  setPerfil(perfilData);
  setCarrera(perfilData.carrera || "");
  setUniversidad(perfilData.universidad || "");
  setCreditosTotales(perfilData.creditosTotales || "");
}
if (!perfilData) {
  setEditandoPerfil(true);
}
      setCargando(false);
    });
  }, [user]);

  const setF = (k, v) => setFormCurso(f => ({ ...f, [k]: v }));
  const showMsg = (tipo, texto) => { setMsg({ tipo, texto }); setTimeout(() => setMsg(null), 3000); };

  const guardarDatosPerfil = async () => {
  try {
    await guardarPerfil(user.uid, {
      carrera,
      universidad,
      creditosTotales: Number(creditosTotales)
    });

    setPerfil({
      carrera,
      universidad,
      creditosTotales: Number(creditosTotales)
    });

    setEditandoPerfil(false);

    showMsg("success", "Perfil académico guardado.");
  } catch (error) {
    showMsg("error", "No se pudo guardar el perfil.");
  }
};

  // ── Guardar cambio en curso del plan ──────────────────────
  const guardarCambioCurso = async (cicloNum, idx, cambios) => {
  const curso = ciclos[cicloNum][idx];

  await actualizarCurso(user.uid, curso.id, cambios);

  const nuevos = { ...ciclos };
  nuevos[cicloNum] = [...nuevos[cicloNum]];
  nuevos[cicloNum][idx] = {
    ...nuevos[cicloNum][idx],
    ...cambios
  };

  setCiclos(nuevos);
};

  // ── Agregar curso manual ──────────────────────────────────
 const handleAgregarCurso = async (e) => {
  e.preventDefault();

  if (!formCurso.nombre.trim()) {
    showMsg("error", "Ingresa el nombre del curso.");
    return;
  }

  setGuardando(true);

  try {
    const nuevo = {
      sigla: formCurso.sigla.trim(),
      nombre: formCurso.nombre.trim(),
      creditos: Number(formCurso.creditos) || 0,
      anio: Number(formCurso.anio),
      semestre: formCurso.semestre,
      estado: formCurso.estado,
      nota: formCurso.nota || ""
    };

    if (editandoCurso) {
      const cursoActual =
        ciclos[editandoCurso.ciclo][editandoCurso.idx];

      await actualizarCurso(
        user.uid,
        cursoActual.id,
        nuevo
      );

      const nuevos = { ...ciclos };
      nuevos[editandoCurso.ciclo] = [
        ...nuevos[editandoCurso.ciclo]
      ];

      nuevos[editandoCurso.ciclo][editandoCurso.idx] = {
        ...cursoActual,
        ...nuevo
      };

      setCiclos(nuevos);

      showMsg("success", "Curso actualizado.");
    } else {
      const docRef = await agregarCurso(user.uid, nuevo);

      const cicloNum =
        (nuevo.anio - 1) * 2 +
        (nuevo.semestre === "I" ? 1 : 2);

      const nuevos = { ...ciclos };

      if (!nuevos[cicloNum]) {
        nuevos[cicloNum] = [];
      }

      nuevos[cicloNum].push({
        id: docRef.id,
        ...nuevo
      });

      setCiclos(nuevos);

      showMsg("success", "Curso agregado.");
    }

    setModalCurso(false);
    setEditandoCurso(null);

  } catch (error) {
    console.error(error);
    showMsg("error", "No se pudo guardar el curso.");
  }

  setGuardando(false);
};

  const abrirEditarCurso = (cicloNum, idx) => {
    const c = ciclos[cicloNum][idx];
    setEditandoCurso({ ciclo: cicloNum, idx });
    setFormCurso({
      sigla: c.sigla || "", nombre: c.nombre || "", creditos: c.creditos || "",
      anio: c.anio || Math.ceil(cicloNum / 2),
      semestre: c.semestre || (cicloNum % 2 === 1 ? "I" : "II"),
      estado: c.estado || "pendiente", nota: c.nota || "", color: c.color || "#ffffff"
    });
    setModalCurso(true);
  };

  const eliminarCursoPlan = async (cicloNum, idx) => {
     if (!confirm("¿Eliminar este curso?")) return;

  const curso = ciclos[cicloNum][idx];

  await eliminarCurso(user.uid, curso.id);

  const nuevos = { ...ciclos };
  nuevos[cicloNum] = nuevos[cicloNum].filter((_, i) =>i !== idx);
    setCiclos(nuevos);
    setModalCurso(false); setEditandoCurso(null);
  };

  // ── Estadísticas ──────────────────────────────────────────
  const todosCursos = Object.values(ciclos).flat();
  const aprobados = todosCursos.filter(c => c.estado === "aprobado");

  const totalCreds = todosCursos.reduce(
  (s, c) => s + (Number(c.creditos) || 0),
  0
);

const credAprobados = aprobados.reduce(
  (s, c) => s + (Number(c.creditos) || 0),
  0
);

const creditosCarrera =
  Number(perfil?.creditosTotales) || 0;

const pct =
  creditosCarrera > 0
    ? Math.round(
        (credAprobados / creditosCarrera) * 100
      )
    : 0;

  // Años únicos
  const anios = [...new Set(todosCursos.map(c => c.anio).filter(Boolean))].sort((a, b) => a - b);

  // Promedio anual
  function promedioAnio(anio) {
    // Incluye todos los semestres del año (I, II, y verano si existe)
    const delAnio = todosCursos.filter(c =>
      c.anio === anio && c.estado === "aprobado" &&
      c.nota !== "" && c.nota !== null && c.nota !== undefined &&
      !isNaN(Number(c.nota))
    );
    if (!delAnio.length) return null;
    const sumaCred = delAnio.reduce((s, c) => s + (Number(c.creditos) || 1), 0);
    const suma = delAnio.reduce((s, c) => s + (Number(c.nota) * (Number(c.creditos) || 1)), 0);
    return sumaCred > 0 ? suma / sumaCred : null;
  }

  // Ciclos a mostrar
  const ciclosOrdenados = Object.keys(ciclos).map(Number).sort((a, b) => a - b)
    .filter(c => verAnio === "todos" || ciclos[c]?.some(cur => cur.anio === Number(verAnio) || (verAnio === "verano" && cur.semestre === "Verano")));

  if (loading || cargando) return <PageLoader />;

  return (
    <div className="app-layout">
      <Sidebar 
  onEditarPerfil={() => setEditandoPerfil(true)}
/>
      <main className="main-content" style={{ padding: "1.5rem" }}>

        {/* Header */}


<div
  className="card"
  style={{
    marginBottom: "1rem",
    padding: "1.25rem"
  }}
>
  <h3 style={{ marginBottom: "1rem" }}>
    🎓 Perfil Académico
  </h3>

{perfil && !editandoPerfil ? (


<div>
  <div style={{ marginBottom: "0.75rem" }}>
    <strong>Carrera:</strong> {perfil.carrera}
  </div>

  <div style={{ marginBottom: "0.75rem" }}>
    <strong>Universidad:</strong> {perfil.universidad}
  </div>

  <div style={{ marginBottom: "1rem" }}>
    <strong>Créditos totales:</strong> {perfil.creditosTotales}
  </div>

  <button
    className="btn btn-secondary"
    onClick={() => setEditandoPerfil(true)}
  >
    Editar perfil
  </button>
</div>

) : (


<>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      gap: "1rem"
    }}
  >
    <input
      className="form-input"
      placeholder="Carrera"
      value={carrera}
      onChange={(e) => setCarrera(e.target.value)}
    />

    <input
      className="form-input"
      placeholder="Universidad"
      value={universidad}
      onChange={(e) => setUniversidad(e.target.value)}
    />

    <input
      className="form-input"
      type="number"
      placeholder="Créditos totales de la carrera"
      value={creditosTotales}
      onChange={(e) => setCreditosTotales(e.target.value)}
    />
  </div>

  <div style={{ marginTop: "1rem" }}>
    <button
      className="btn btn-primary"
      onClick={guardarDatosPerfil}
    >
      Guardar perfil
    </button>
  </div>
</>


)}

</div>

        {msg && <div className={`alert alert-${msg.tipo === "success" ? "success" : "error"}`} style={{ marginBottom: "1rem" }}>{msg.texto}</div>}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.875rem", marginBottom: "1.25rem" }}>
          <div className="stat-card" style={{ borderLeft: "4px solid #7c3aed" }}>
            <div className="stat-label">🎓 Progreso</div>
            <div className="stat-value" style={{ color: "#7c3aed" }}>{pct}%</div>
            <div className="stat-sub">
  {credAprobados} / {creditosCarrera} créditos
</div>
          </div>
          <div className="stat-card" style={{ borderLeft: "4px solid #16a34a" }}>
            <div className="stat-label">✅ Aprobados</div>
            <div className="stat-value" style={{ color: "#16a34a" }}>{aprobados.length}</div>
            <div className="stat-sub">de {todosCursos.length} cursos</div>
          </div>
          {anios.slice(-3).map(anio => {
            const prom = promedioAnio(anio);
            return (
              <div key={anio} className="stat-card" style={{ borderLeft: "4px solid #2563eb" }}>
                <div className="stat-label">📊 Año {anio}</div>
                <div className="stat-value" style={{ color: prom ? (prom >= 70 ? "#16a34a" : "#dc2626") : "#94a3b8" }}>
                  {prom !== null ? prom.toFixed(2) : "—"}
                </div>
                <div className="stat-sub">Promedio ponderado</div>
              </div>
            );
          })}
        </div>

        {/* Perfil Académico */}
<div
  className="card"
  style={{
    marginBottom: "1.25rem",
    padding: "1.25rem",
    borderLeft: "4px solid #7c3aed"
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "1rem"
    }}
  >
    <div>
      <h3
        style={{
          margin: 0,
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#0f172a"
        }}
      >
        🎓 Perfil Académico
      </h3>

      <p
        style={{
          marginTop: 4,
          color: "#64748b",
          fontSize: "0.875rem"
        }}
      >
        Resumen general de tu avance universitario
      </p>
    </div>

    <div
      style={{
        fontSize: "2rem",
        fontWeight: 800,
        color: "#7c3aed"
      }}
    >
      {pct}%
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      gap: "1rem",
      marginTop: "1rem"
    }}
  >
    <div>
      <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
        Créditos aprobados
      </div>
      <div style={{ fontWeight: 700 }}>
        {credAprobados}
      </div>
    </div>

    <div>
  <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
    Créditos pendientes
  </div>
  <div style={{ fontWeight: 700 }}>
    {Math.max(0, creditosCarrera - credAprobados)}
  </div>
</div>

    <div>
      <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
        Cursos aprobados
      </div>
      <div style={{ fontWeight: 700 }}>
        {aprobados.length}
      </div>
    </div>

    <div>
      <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
        Cursos totales
      </div>
      <div style={{ fontWeight: 700 }}>
        {todosCursos.length}
      </div>
    </div>
  </div>
</div>

        {/* Barra de progreso */}
        <div className="card" style={{ marginBottom: "1rem", padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.875rem" }}>
            <span style={{ color: "#64748b" }}>{credAprobados} créditos aprobados</span>
            <span style={{ fontWeight: 700, color: "#7c3aed" }}>{pct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 12 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#7c3aed,#2563eb)" }} />
          </div>
        </div>

        {/* Filtro por año */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.8125rem", color: "#64748b", fontWeight: 600 }}>Ver:</span>
          <button className={`btn btn-sm ${verAnio === "todos" ? "btn-primary" : "btn-ghost"}`} onClick={() => setVerAnio("todos")}>Todos</button>
          {anios.map(a => (
            <button key={a} className={`btn btn-sm ${verAnio === a ? "btn-primary" : "btn-ghost"}`} onClick={() => setVerAnio(a)}>Año {a}</button>
          ))}
        </div>

        {/* Tabla de ciclos */}
        {
          todosCursos.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📄</div>
              <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "#0f172a", marginBottom: 4 }}>Sin plan de estudios</div>
              <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            Aún no has creado tu plan académico.
Empieza agregando cursos para visualizar tu progreso,
créditos completados y estadísticas de rendimiento.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <GalaxyBtn onClick={() => { setEditandoCurso(null); setModalCurso(true); }}>+ Agregar curso</GalaxyBtn>
              </div>
            </div>
          ) : (
            ciclosOrdenados.map(cicloNum => {
              const cursosDelCiclo = (ciclos[cicloNum] || []).filter(c =>
                verAnio === "todos" || c.anio === Number(verAnio)
              );
              if (cursosDelCiclo.length === 0) return null;
              const anio = cursosDelCiclo?.[0]?.anio || Math.ceil(cicloNum / 2);
              const sem = cicloNum % 2 === 1 ? "I Semestre" : "II Semestre";
              const credsCiclo = cursosDelCiclo.reduce((s, c) => s + (Number(c.creditos) || 0), 0);
              const aprobCiclo = cursosDelCiclo.filter(c => c.estado === "aprobado").length;

              return (
                <div key={cicloNum} className="card" style={{ marginBottom: "1rem", padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "0.75rem 1rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>Ciclo {cicloNum} — Año {Math.ceil(cicloNum / 2)} · {sem}</span>
                      <span style={{ fontSize: "0.8125rem", color: "#64748b", marginLeft: 12 }}>{aprobCiclo}/{cursosDelCiclo.length} aprobados · {credsCiclo} créditos</span>
                    </div>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Sigla</th>
                        <th>Nombre del curso</th>
                        <th style={{ textAlign: "center" }}>Cred.</th>
                        <th>Estado</th>
                        <th style={{ width: 80 }}>Nota</th>
                        <th style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cursosDelCiclo.map((curso, idx) => {
                        const realIdx = (ciclos[cicloNum] || []).findIndex(c => c === curso);
                        const isAprobado = curso.estado === "aprobado";
                        return (
                          <tr key={idx}>

                            <td style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "#475569" }}>{curso.sigla || "—"}</td>
                            <td style={{ fontWeight: isAprobado ? 600 : 400 }}>{curso.nombre}</td>
                            <td style={{ textAlign: "center", fontWeight: 600 }}>{curso.creditos}</td>
                            <td>
                              <select
                                value={curso.estado || "pendiente"}
                                onChange={e => guardarCambioCurso(cicloNum, realIdx, { estado: e.target.value })}
                                style={{
                                  fontSize: "0.75rem", fontWeight: 600, padding: "2px 6px",
                                  borderRadius: 6, border: "none", cursor: "pointer",
                                  background: curso.estado === "aprobado" ? "#dcfce7" : curso.estado === "reprobado" ? "#fee2e2" : curso.estado === "matriculado" ? "#dbeafe" : "#f1f5f9",
                                  color: curso.estado === "aprobado" ? "#15803d" : curso.estado === "reprobado" ? "#b91c1c" : curso.estado === "matriculado" ? "#1d4ed8" : "#475569"
                                }}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="matriculado">Matriculado</option>
                                <option value="aprobado">Aprobado</option>
                                <option value="reprobado">Reprobado</option>
                                <option value="retirado">Retirado</option>
                              </select>
                            </td>
                            <td>
                              {isAprobado ? (
                                <input
                                  type="number" min="0" max="10" step="0.5"
                                  value={curso.nota || ""}
                                  onChange={e => guardarCambioCurso(cicloNum, realIdx, { nota: e.target.value })}
                                  placeholder="0.0"
                                  style={{
                                    width: 64, padding: "2px 6px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.8125rem", fontWeight: 700,
                                    color: Number(curso.nota) >= 7 ? "#15803d" : "#b91c1c"
                                  }}
                                />
                              ) : <span style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>—</span>}
                            </td>
                            <td>
                              <button className="btn btn-ghost btn-sm" onClick={() => abrirEditarCurso(cicloNum, realIdx)} style={{ padding: "2px 6px" }}>✏️</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })
          )
        }

        <div
  style={{
    display: "flex",
    justifyContent: "center",
    margin: "1.5rem 0"
  }}
>
  <GalaxyBtn
    onClick={() => {
      setEditandoCurso(null);
      setFormCurso({
        sigla: "",
        nombre: "",
        creditos: "",
        anio: 1,
        semestre: "I",
        estado: "pendiente",
        nota: ""
      });
      setModalCurso(true);
    }}
  >
    + Agregar curso
  </GalaxyBtn>
</div>

        {/* Tabla de promedios anuales */}
        {
          anios.length > 0 && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <span className="card-title" style={{ display: "block", marginBottom: "0.75rem" }}>📊 Promedios anuales</span>
              <table className="data-table">
                <thead>
                  <tr><th>Año</th><th>Ciclos incluidos</th><th>Cursos aprobados</th><th>Créditos</th><th>Promedio ponderado</th></tr>
                </thead>
                <tbody>
                  {anios.map(anio => {
                    const prom = promedioAnio(anio);
                    const delAnio = todosCursos.filter(c => c.anio === anio);
                    const aprobDelAnio = delAnio.filter(c => c.estado === "aprobado");
                    const credsAnio = aprobDelAnio.reduce((s, c) => s + (Number(c.creditos) || 0), 0);
                    // Ciclos de este año
                    const ciclosAnio = Object.keys(ciclos).map(Number).filter(n => Math.ceil(n / 2) === anio).sort();
                    return (
                      <tr key={anio}>
                        <td style={{ fontWeight: 700 }}>Año {anio}</td>
                        <td style={{ color: "#64748b" }}>{ciclosAnio.map(c => `Ciclo ${c}`).join(", ")}</td>
                        <td>{aprobDelAnio.length} / {delAnio.length}</td>
                        <td>{credsAnio}</td>
                        <td style={{ fontWeight: 800, fontSize: "1.125rem", color: prom === null ? "#94a3b8" : prom >= 7 ? "#16a34a" : "#dc2626" }}>
                          {prom !== null ? prom.toFixed(2) : "Sin datos"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                * Promedio ponderado por créditos. Incluye todos los ciclos del año (I, II y Verano si aplica). Notas en escala 0-10 (UCR).
              </p>
            </div>
          )
        }

        {/* Modal agregar/editar curso manual */}
        {
          modalCurso && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalCurso(false)}>
              <div className="modal-box" style={{ maxWidth: 500 }}>
                <div className="modal-header">
                  <h3>{editandoCurso ? "Editar curso" : "Agregar curso manualmente"}</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModalCurso(false)}>✕</button>
                </div>
                <form onSubmit={handleAgregarCurso}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
                    <div className="form-group">
                      <label className="form-label">Sigla</label>
                      <input className="form-input" placeholder="IF4101" value={formCurso.sigla} onChange={e => setF("sigla", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nombre del curso *</label>
                      <input className="form-input" placeholder="Ej. Cálculo Diferencial" value={formCurso.nombre} onChange={e => setF("nombre", e.target.value)} required />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                    <div className="form-group">
                      <label className="form-label">Créditos</label>
                      <input className="form-input" type="number" min="0" max="20" value={formCurso.creditos} onChange={e => setF("creditos", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Año</label>
                      <select className="form-select" value={formCurso.anio} onChange={e => setF("anio", e.target.value)}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(a => <option key={a} value={a}>Año {a}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Semestre</label>
                      <select className="form-select" value={formCurso.semestre} onChange={e => setF("semestre", e.target.value)}>
                        <option value="I">I Semestre</option>
                        <option value="II">II Semestre</option>
                        <option value="Verano">Verano</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div className="form-group">
                      <label className="form-label">Estado</label>
                      <select className="form-select" value={formCurso.estado} onChange={e => setF("estado", e.target.value)}>
                        <option value="pendiente">Pendiente</option>
                        <option value="matriculado">Matriculado</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="reprobado">Reprobado</option>
                        <option value="retirado">Retirado</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nota (si aprobado)</label>
                      <input className="form-input" type="number" min="0" max="10" step="0.5" placeholder="Ej. 8.5" value={formCurso.nota} onChange={e => setF("nota", e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {editandoCurso && <button type="button" className="btn btn-danger btn-sm" onClick={() => eliminarCursoPlan(editandoCurso.ciclo, editandoCurso.idx)}>Eliminar</button>}
                    <button type="button" className="btn btn-ghost" onClick={() => setModalCurso(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? "Guardando..." : editandoCurso ? "Actualizar" : "Agregar"}</button>
                  </div>
                </form>
              </div>
            </div>
          )
        }
      </main >
    </div >
  );
}
