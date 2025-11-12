// src/pages/Dashboard.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; // Asegúrate de que la ruta sea correcta
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  // ✅ función de cierre de sesión correcta
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Ocurrió un error al cerrar sesión.");
    }
  };

  return (
    <main className="dash">
      <header className="dash__topbar">
        <div className="dash__brand">
          <h1 className="dash__title">Bienvenido a InfoBank</h1>
          <p className="dash__subtitle">
            Accede a todos los recursos y servicios disponibles
          </p>
        </div>

        {/* 🔹 Botones de acción */}
        <div className="dash__actions">
          <Link className="btn btn--profile" to="/perfil">
            <UserIcon /> Mi Perfil
          </Link>

          <button className="btn btn--ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Tarjetas principales */}
      <section className="dash__grid" aria-label="Accesos principales">
        <Card
          color="blue"
          title="Cursos"
          desc="Accede a todos los cursos y materiales de formación disponibles"
          cta="Ver Cursos"
          to="/cursos"
          icon={<BookIcon />}
        />
        <Card
          color="green"
          title="Noticias"
          desc="Mantente al día con las últimas noticias y actualizaciones"
          cta="Ver Noticias"
          to="/noticias"
          icon={<NewsIcon />}
        />
        <Card
          color="purple"
          title="Muro Informativo"
          desc="Publicaciones, anuncios y actualizaciones importantes"
          cta="Ver Muro"
          to="/muro"
          icon={<MuroIcon />}

        />

        <Card
          color="orange"
          title="Configuración"
          desc="Administra tu perfil y configuraciones de cuenta"
          cta="Configurar"
          to="/configuracion"
          icon={<CogIcon />}
        />
      </section>

      {/* Acceso rápido */}
      <section className="quick">
        <h2 className="quick__title">Acceso Rápido</h2>
        <div className="quick__row">

          <Link className="quick__btn" to="/soporte">
            Soporte Técnico
          </Link>
        </div>
      </section>
    </main>
  );
}

function Card({ icon, title, desc, cta, to, color = "blue" }) {
  return (
    <article className={`card card--${color}`}>
      <div className="card__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="card__title">{title}</h3>
      <p className="card__desc">{desc}</p>
      <Link className="btn btn--cta" to={to} aria-label={`${cta} - ${title}`}>
        {cta}
      </Link>
    </article>
  );
}

/* ===== Iconos SVG ===== */
function BookIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h9a3 3 0 0 1 3 3v10.5a.5.5 0 0 1-.79.41L15 16.5l-2.21 1.41a.5.5 0 0 1-.58 0L10 16.5 7.79 17.9a.5.5 0 0 1-.79-.41V7a3 3 0 0 1 3-3z" />
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 5h12a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5zm3 3v2h8V8H7zm0 4v2h8v-2H7z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94a7.52 7.52 0 0 0 .05-.94 7.52 7.52 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.55 7.55 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 12.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.57.23-1.11.54-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L.71 7.98a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94s.02.63.05.94L.83 13.66a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.52.4 1.06.71 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49-.42l.36-2.54c.57-.23 1.11-.54 1.63-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM11 15a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
    </svg>
  );
}
// 🔹 Ícono para el Muro Informativo
function MuroIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-1.86 1.28-3.41 3.2-4A13.86 13.86 0 0 0 8 13Zm8 0a9.59 9.59 0 0 0-2.54.34 6 6 0 0 1 2.54 4.66V19h8v-2c0-2.66-5.33-4-8-4Z" />
    </svg>
  );
}
