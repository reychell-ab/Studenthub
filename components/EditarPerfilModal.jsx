"use client";
import { useState, useEffect } from "react";
import { updateProfile, updateEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../lib/authContext";
import { guardarPerfil, obtenerPerfil } from "../lib/db";


export default function EditarPerfilModal({ open, onClose }) {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ nombre: "", correo: "", carrera: "", universidad: "", creditosTotales: "" });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!open || !user) return;
    setMsg(null);
    setCargando(true);
    obtenerPerfil(user.uid)
      .then((perfil) => {
        setForm({
          nombre: user.displayName || "",
          correo: user.email || "",
          carrera: perfil?.carrera || "",
          universidad: perfil?.universidad || "",
          creditosTotales: perfil?.creditosTotales || "",
        });
      })
      .catch(() => {
        setForm((f) => ({ ...f, nombre: user.displayName || "", correo: user.email || "" }));
      })
      .finally(() => setCargando(false));
  }, [open, user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setMsg({ tipo: "error", texto: "El nombre no puede estar vacío." });
      return;
    }
    setGuardando(true);
    setMsg(null);

    try {
      // 1) Nombre (Firebase Auth)
      if (form.nombre.trim() !== (user.displayName || "")) {
        await updateProfile(auth.currentUser, { displayName: form.nombre.trim() });
      }

      // 2) Correo (Firebase Auth) — puede requerir reautenticación reciente
      if (form.correo.trim() && form.correo.trim() !== (user.email || "")) {
        try {
          await updateEmail(auth.currentUser, form.correo.trim());
        } catch (err) {
          if (err.code === "auth/requires-recent-login") {
            setMsg({
              tipo: "error",
              texto: "Por seguridad, para cambiar el correo necesitás haber iniciado sesión recientemente. Cerrá sesión y volvé a entrar, luego intentá de nuevo.",
            });
            setGuardando(false);
            return;
          }
          throw err;
        }
      }

      // 3) Perfil académico (Firestore)
      await guardarPerfil(user.uid, {
        carrera: form.carrera.trim(),
        universidad: form.universidad.trim(),
        creditosTotales: Number(form.creditosTotales) || 0,
      });

      // 4) Refrescar datos del usuario en toda la app
      await refreshUser();

      setMsg({ tipo: "success", texto: "Perfil actualizado correctamente." });
      setTimeout(() => {
        setMsg(null);
        onClose();
      }, 1100);
    } catch (err) {
      console.error(err);
      const mensajes = {
        "auth/invalid-email": "El correo no es válido.",
        "auth/email-already-in-use": "Ese correo ya está en uso por otra cuenta.",
        "auth/network-request-failed": "Error de conexión. Verificá tu internet.",
      };
      setMsg({ tipo: "error", texto: mensajes[err.code] || "No se pudo guardar el perfil. Intentá de nuevo." });
    }
    setGuardando(false);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3>✏️ Editar perfil</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {msg && <div className={`alert alert-${msg.tipo === "success" ? "success" : "error"}`}>{msg.texto}</div>}

        {cargando ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Cargando datos del perfil…
          </div>
        ) : (
          <form onSubmit={handleGuardar}>
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input
                className="form-input"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                className="form-input"
                type="email"
                value={form.correo}
                onChange={(e) => set("correo", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Carrera</label>
              <input
                className="form-input"
                placeholder="Ej. Bachillerato en Informática Empresarial"
                value={form.carrera}
                onChange={(e) => set("carrera", e.target.value)}
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Universidad</label>
                <input
                  className="form-input"
                  placeholder="Ej. UCR"
                  value={form.universidad}
                  onChange={(e) => set("universidad", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Créditos totales</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="Ej. 140"
                  value={form.creditosTotales}
                  onChange={(e) => set("creditosTotales", e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
