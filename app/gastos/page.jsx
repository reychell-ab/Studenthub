"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { agregarGasto, obtenerGastos, eliminarGasto } from "../../lib/db";
import GalaxyBtn from "../../components/GalaxyBtn";
import PageLoader from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";

const CATEGORIAS_EGRESO = ["Alimentación","Transporte","Alquiler","Servicios","Educación","Salud","Entretenimiento","Ropa","Tecnología","Ahorro","Otro"];
const CATEGORIAS_INGRESO = ["Beca","Trabajo","Mesada","Préstamo","Otro"];

function calcularTotales(gastos) {
  return gastos.reduce((acc, g) => {
    if (g.tipo === "ingreso") acc.ingresos += Number(g.monto);
    else acc.egresos += Number(g.monto);
    return acc;
  }, { ingresos: 0, egresos: 0 });
}

function agruparPorCategoria(gastos) {
  const egresos = gastos.filter(g => g.tipo === "egreso");
  const mapa = {};
  egresos.forEach(g => {
    mapa[g.categoria] = (mapa[g.categoria] || 0) + Number(g.monto);
  });
  return Object.entries(mapa).sort((a,b) => b[1]-a[1]);
}

export default function GastosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [form, setForm] = useState({ tipo:"egreso", descripcion:"", monto:"", categoria:"Alimentación", nota:"" });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    obtenerGastos(user.uid).then(g => { setGastos(g); setCargando(false); });
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!form.descripcion.trim() || !form.monto || Number(form.monto) <= 0) {
      setMsg({ tipo:"error", texto:"Completa todos los campos correctamente." });
      return;
    }
    setGuardando(true);
    const nuevo = {
      tipo: form.tipo,
      descripcion: form.descripcion.trim(),
      monto: Number(form.monto),
      categoria: form.categoria,
      nota: form.nota
    };
    const ref = await agregarGasto(user.uid, nuevo);
    setGastos(prev => [{ id: ref.id, ...nuevo, fecha: { toDate: () => new Date() } }, ...prev]);
    setForm({ tipo:"egreso", descripcion:"", monto:"", categoria:"Alimentación", nota:"" });
    setModal(false);
    setMsg({ tipo:"success", texto:"Movimiento registrado correctamente." });
    setGuardando(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await eliminarGasto(user.uid, id);
    setGastos(prev => prev.filter(g => g.id !== id));
  };

  const gastosFiltrados = filtro === "todos" ? gastos : gastos.filter(g => g.tipo === filtro);
  const { ingresos, egresos } = calcularTotales(gastos);
  const disponible = ingresos - egresos;
  const categoriasTop = agruparPorCategoria(gastos);

  if (loading || cargando) return <PageLoader />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="flex-between page-header">
          <div>
            <h2>💰 Control de Gastos</h2>
            <p>Gestiona tus ingresos y gastos mensuales</p>
          </div>
          <GalaxyBtn onClick={() => setModal(true)}>+ Agregar</GalaxyBtn>
        </div>

        {msg && <div className={`alert alert-${msg.tipo === "success" ? "success" : "error"}`}>{msg.texto}</div>}

        {/* Resumen */}
        <div className="stat-grid">
          <div className="stat-card" style={{ borderLeft:"4px solid #16a34a" }}>
            <div className="stat-label">📥 Total ingresos</div>
            <div className="stat-value" style={{ color:"#16a34a" }}>₡{ingresos.toLocaleString()}</div>
          </div>
          <div className="stat-card" style={{ borderLeft:"4px solid #dc2626" }}>
            <div className="stat-label">📤 Total gastos</div>
            <div className="stat-value" style={{ color:"#dc2626" }}>₡{egresos.toLocaleString()}</div>
          </div>
          <div className="stat-card" style={{ borderLeft:"4px solid #2563eb" }}>
            <div className="stat-label">💳 Disponible</div>
            <div className="stat-value" style={{ color: disponible >= 0 ? "#16a34a" : "#dc2626" }}>₡{disponible.toLocaleString()}</div>
            <div className="stat-sub">{disponible >= 0 ? "Tienes saldo positivo" : "⚠️ Gastos superan ingresos"}</div>
          </div>
          <div className="stat-card" style={{ borderLeft:"4px solid #7c3aed" }}>
            <div className="stat-label">🎯 Ahorro sugerido</div>
            <div className="stat-value" style={{ color:"#7c3aed" }}>₡{Math.max(0, Math.round(ingresos * 0.2)).toLocaleString()}</div>
            <div className="stat-sub">20% de tus ingresos</div>
          </div>
        </div>

        {/* Categorías top + tabla */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"1rem" }}>
          <div className="card">
            <span className="card-title">📊 Gastos por categoría</span>
            {categoriasTop.length === 0 ? (
              <p className="text-muted" style={{ marginTop:"0.5rem" }}>Sin datos aún</p>
            ) : categoriasTop.map(([cat, total]) => {
              const pct = egresos > 0 ? Math.round((total/egresos)*100) : 0;
              return (
                <div key={cat} style={{ marginBottom:"0.75rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8125rem", marginBottom:4 }}>
                    <span style={{ color:"#374151", fontWeight:500 }}>{cat}</span>
                    <span style={{ color:"#64748b" }}>{pct}% · ₡{total.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${pct}%`, background:"#2563eb" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="flex-between mb-4">
              <span className="card-title">📋 Movimientos</span>
              <div style={{ display:"flex", gap:6 }}>
                {["todos","ingreso","egreso"].map(f => (
                  <button key={f} onClick={() => setFiltro(f)}
                    className={`btn btn-sm ${filtro===f ? "btn-primary" : "btn-ghost"}`}
                    style={{ textTransform:"capitalize" }}>{f}</button>
                ))}
              </div>
            </div>
            {gastosFiltrados.length === 0 ? (
              <p className="text-muted text-center" style={{ padding:"2rem 0" }}>No hay movimientos registrados.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {gastosFiltrados.map(g => (
                    <tr key={g.id}>
                      <td style={{ fontWeight:500 }}>{g.descripcion}</td>
                      <td><span className="badge badge-gray">{g.categoria}</span></td>
                      <td><span className={`badge ${g.tipo==="ingreso"?"badge-green":"badge-red"}`}>{g.tipo}</span></td>
                      <td style={{ fontWeight:700, color: g.tipo==="ingreso"?"#16a34a":"#dc2626" }}>
                        {g.tipo==="ingreso"?"+":"-"}₡{Number(g.monto).toLocaleString()}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" style={{ color:"#dc2626" }}
                          onClick={() => handleEliminar(g.id)}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal agregar */}
        {modal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
            <div className="modal-box">
              <div className="modal-header">
                <h3>Agregar movimiento</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
              </div>
              <form onSubmit={handleAgregar}>
                <div className="form-group">
                  <label className="form-label">Tipo de movimiento</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {["egreso","ingreso"].map(t => (
                      <button key={t} type="button"
                        onClick={() => { set("tipo",t); set("categoria", t==="egreso"?"Alimentación":"Beca"); }}
                        className={`btn ${form.tipo===t ? t==="ingreso"?"btn-success":"btn-danger" : "btn-ghost"}`}
                        style={{ flex:1, justifyContent:"center", textTransform:"capitalize" }}>
                        {t==="ingreso"?"📥 Ingreso":"📤 Gasto"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción *</label>
                  <input className="form-input" placeholder="Ej. Almuerzo en soda"
                    value={form.descripcion} onChange={e => set("descripcion", e.target.value)} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Monto (₡) *</label>
                    <input className="form-input" type="number" min="1" placeholder="0"
                      value={form.monto} onChange={e => set("monto", e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select className="form-select" value={form.categoria} onChange={e => set("categoria", e.target.value)}>
                      {(form.tipo==="egreso" ? CATEGORIAS_EGRESO : CATEGORIAS_INGRESO).map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nota (opcional)</label>
                  <input className="form-input" placeholder="Nota adicional..."
                    value={form.nota} onChange={e => set("nota", e.target.value)} />
                </div>
                <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar movimiento"}
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
