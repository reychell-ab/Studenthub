"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/authContext";
import { obtenerPerfil } from "../lib/db";
import EditarPerfilModal from "./EditarPerfilModal";

const NAV = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/gastos", label: "Finanzas" },
  { href: "/agenda", label: "Agenda" },
  { href: "/horario", label: "Horario" },
  { href: "/progreso", label: "Progreso" }
];

export default function Sidebar({ onEditarPerfil }) {
  const path = usePathname();
  const { user, logout } = useAuth();
  const [menuPerfil, setMenuPerfil] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [modalGlobal, setModalGlobal] = useState(false);

  const cargarPerfil = async () => {
    if (!user?.uid) return;
    const datos = await obtenerPerfil(user.uid);
    setPerfil(datos);
  };

 useEffect(() => {
  cargarPerfil();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]);

  // Si la página actual (ej. Progreso) pasa su propio manejador de edición,
  // lo respetamos. Si no, abrimos el modal funcional genérico de aquí mismo,
  // así "Editar perfil" funciona en TODAS las páginas sin necesitar que cada
  // una lo implemente por separado.
  const handleEditarPerfil = () => {
    setMenuPerfil(false);
    if (onEditarPerfil) onEditarPerfil();
    else setModalGlobal(true);
  };

  
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>StudentHub</h1>
        <p>Vida universitaria organizada</p>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <Link
  key={n.href}
  href={n.href}
  className={`nav-item ${path === n.href ? "active" : ""}`}
>
  {n.label}
</Link>
        ))}
      </nav>

     <div className="sidebar-footer">

  <div
    onClick={() => setMenuPerfil(!menuPerfil)}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.75rem",
      borderRadius: "12px",
      cursor: "pointer",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)"
    }}
  >
   <div
  style={{
    width: 40,
    height: 40,
    borderRadius: "50%",
    overflow: "hidden",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 700
  }}
>
  {user?.photoURL ? (
    <img
      src={user.photoURL}
      alt="Perfil"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover"
      }}
    />
  ) : (
    user?.displayName?.charAt(0) || "E"
  )}
</div>

    <div style={{ flex: 1 }}>
      <div
        style={{
          color: "#e2e8f0",
          fontWeight: 600,
          fontSize: "0.85rem"
        }}
      >
        {user?.displayName || "Estudiante"}
      </div>

      <div
        style={{
          color: "#94a3b8",
          fontSize: "0.75rem"
        }}
      >
        Ver perfil
      </div>
    </div>

    <span style={{ color: "#94a3b8" }}>
      ▼
    </span>
  </div>

  {menuPerfil && (
    <div
      style={{
        marginTop: "0.75rem",
        padding: "0.75rem",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      <div
        style={{
          color: "#cbd5e1",
          fontSize: "0.75rem",
          marginBottom: "0.5rem"
        }}
      >
        {user?.email}
      </div>

      <div
        style={{
          color: "#818cf8",
          fontWeight: 600,
          marginBottom: "0.5rem"
        }}
      >
        🎓 {perfil?.carrera || "Sin carrera registrada"}
      </div>

     {perfil && (
  <div
    style={{
      color: "#94a3b8",
      fontSize: "0.8rem",
      marginBottom: "0.75rem"
    }}

    
  >
    Plan académico cargado
  </div>

)}

<button
  onClick={handleEditarPerfil}
  className="btn btn-primary btn-sm"
  style={{
    width: "100%",
    justifyContent: "center",
    marginBottom: "0.5rem"
  }}
>
  ✏️ Editar perfil
</button>

      <button
        onClick={logout}
        className="btn btn-ghost btn-sm"
        style={{
          width: "100%",
          justifyContent: "center"
        }}
      >
        Cerrar sesión
      </button>
    </div>
  )}

</div>

      <EditarPerfilModal
        open={modalGlobal}
        onClose={() => { setModalGlobal(false); cargarPerfil(); }}
      />
    </aside>
  );
}
