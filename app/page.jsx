"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/authContext";
import Link from "next/link";
import GalaxyBtn from "../components/GalaxyBtn";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Si ya está logueado, redirigir al dashboard
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  return (
    <>
      <style>{`
        .landing-hero {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .landing-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky; top:0; z-index:50;
          background: rgba(15,23,42,0.85);
          backdrop-filter: blur(12px);
        }
        .landing-nav-logo { font-size:1.35rem; font-weight:800; color:#60a5fa; }
        .hero-section {
          max-width: 900px; margin: 0 auto;
          padding: 5rem 2rem 3rem;
          text-align: center;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; border-radius: 999px;
          background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.3);
          color: #93c5fd; font-size: 0.8125rem; font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .hero-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800; line-height: 1.15;
          background: linear-gradient(135deg, #f1f5f9 0%, #93c5fd 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 1.25rem;
        }
        .hero-subtitle {
          font-size: 1.125rem; color: #94a3b8; max-width: 620px;
          margin: 0 auto 2.5rem; line-height: 1.7;
        }
        .hero-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn-outline-white {
          padding: 0.75rem 2rem; border-radius: 0.75em;
          border: 1.5px solid rgba(255,255,255,0.2);
          background: transparent; color: white;
          font-weight: 600; cursor: pointer;
          transition: all 0.2s; font-size: 0.9rem;
          text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-outline-white:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.4); }

        /* Features */
        .features-section { padding: 4rem 2rem; max-width: 1000px; margin: 0 auto; }
        .features-title { text-align:center; font-size: 1.75rem; font-weight:700; color:#f1f5f9; margin-bottom: 0.5rem; }
        .features-sub  { text-align:center; color:#64748b; margin-bottom: 2.5rem; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 1.25rem; }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 1.5rem;
          transition: all 0.2s;
        }
        .feature-card:hover { background: rgba(96,165,250,0.06); border-color: rgba(96,165,250,0.2); transform: translateY(-2px); }
        .feature-icon { font-size: 2rem; margin-bottom: 0.75rem; }
        .feature-name { font-weight: 700; color: #f1f5f9; margin-bottom: 0.375rem; }
        .feature-desc { font-size: 0.875rem; color: #64748b; line-height: 1.5; }

        /* Specs section */
        .specs-section { padding: 3rem 2rem; max-width: 900px; margin: 0 auto; }
        .specs-card {
          background: rgba(96,165,250,0.05);
          border: 1px solid rgba(96,165,250,0.15);
          border-radius: 16px; padding: 2rem;
        }
        .specs-title { font-size: 1.25rem; font-weight: 700; color: #93c5fd; margin-bottom: 1.25rem; }
        .specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .spec-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 0.625rem 0.75rem;
          background: rgba(255,255,255,0.03); border-radius: 8px;
        }
        .spec-check { color: #34d399; font-size: 0.9rem; margin-top: 1px; flex-shrink:0; }
        .spec-text { font-size: 0.8125rem; color: #cbd5e1; line-height: 1.4; }

        /* CTA */
        .cta-section {
          text-align: center; padding: 4rem 2rem 5rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .cta-title { font-size: 1.75rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.75rem; }
        .cta-sub   { color: #64748b; margin-bottom: 2rem; }

        /* Tech badges */
        .tech-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem; margin-top: 0.5rem; }
        .tech-badge {
          padding: 4px 12px; border-radius: 999px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          font-size: 0.75rem; color: #94a3b8; font-weight: 500;
        }
        .footer-text { text-align:center; padding: 1.5rem; color: #334155; font-size: 0.8125rem; border-top: 1px solid rgba(255,255,255,0.04); }
      `}</style>

      <div className="landing-hero">
        {/* Navbar */}
        <nav className="landing-nav">
          <span className="landing-nav-logo">🎓 StudentHub</span>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <Link href="/login" className="btn-outline-white" style={{ padding:"0.5rem 1.25rem", fontSize:"0.875rem" }}>
              Iniciar sesión
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero-section">
          <h1 className="hero-title">
            Tu vida universitaria,<br />organizada en un solo lugar
          </h1>
          <p className="hero-subtitle">
            StudentHub combina gestión académica y control financiero para que los estudiantes
            universitarios administren mejor su tiempo, responsabilidades y recursos económicos.
          </p>
          <div className="hero-btns">
            <GalaxyBtn onClick={() => router.push("/login")}>
              Comenzar gratis →
            </GalaxyBtn>
            <a href="#modulos" className="btn-outline-white">Ver módulos</a>
          </div>

          <div className="tech-row" style={{ marginTop:"2.5rem" }}>
            {["Next.js 14","React 18","Firebase","Tailwind CSS","Firestore"].map(t => (
              <span key={t} className="tech-badge">{t}</span>
            ))}
          </div>
        </section>

        {/* Módulos */}
        <section className="features-section" id="modulos">
          <h2 className="features-title">Módulos principales</h2>
          <p className="features-sub">Todo lo que necesitás para organizar tu carrera universitaria</p>
          <div className="features-grid">
            {[
              { icon:"💰", name:"Control de Gastos", desc:"Registrá ingresos y egresos, visualizá por categoría y calculá tu ahorro mensual disponible." },
              { icon:"📅", name:"Agenda Académica", desc:"Gestioná tareas, exámenes y proyectos en tablero Kanban con estados: Pendiente, En curso y Realizado." },
              { icon:"🗓️", name:"Horario Semanal", desc:"Creá tu horario de clases semanal con vista de calendario. Exportable como PNG o PDF." },
              { icon:"📈", name:"Progreso de Carrera", desc:"Visualizá tu avance en la carrera por ciclos y calculá tu promedio anual ponderado." },
            ].map(f => (
              <div key={f.name} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-name">{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2 className="cta-title">¿Listo para organizar tu carrera?</h2>
          <p className="cta-sub">Creá tu cuenta gratis y empezá a usar todos los módulos hoy.</p>
          <GalaxyBtn onClick={() => router.push("/login")}>
            Crear cuenta gratis →
          </GalaxyBtn>
        </section>

        <p className="footer-text">
          StudentHub · Proyecto Final · Lenguajes de Programación · UCR Sede del Sur
        </p>
      </div>
    </>
  );
}
