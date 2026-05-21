"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/authContext";

const NAV = [
  { href: "/dashboard",  icon: "🏠", label: "Inicio" },
  { href: "/gastos",     icon: "💰", label: "Gastos" },
  { href: "/agenda",     icon: "📅", label: "Agenda" },
  { href: "/horario",    icon: "🗓️", label: "Horario" },
  { href: "/progreso",   icon: "📈", label: "Progreso" }
];

export default function Sidebar() {
  const path = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>StudentHub</h1>
        <p>Vida universitaria organizada</p>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}
            className={`nav-item ${path === n.href ? "active" : ""}`}>
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize:"0.8125rem", color:"#94a3b8", marginBottom:"0.75rem" }}>
          <div style={{ fontWeight:600, color:"#cbd5e1" }}>{user?.displayName || "Estudiante"}</div>
          <div style={{ fontSize:"0.75rem", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email}</div>
        </div>
        <button onClick={logout} className="btn btn-ghost btn-sm" style={{ width:"100%", justifyContent:"center", color:"#94a3b8", borderColor:"rgba(255,255,255,0.1)" }}>
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
