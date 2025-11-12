// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; // Asegúrate de que la ruta sea correcta
import "./Dashboard.css";

// DATOS ESTÁTICOS PARA EL PANEL
const staticNotifications = [
  {
    id: 1,
    title: "Recordatorios de Cursos",
    description: "Te recordaremos las fechas límite de tus cursos inscritos.",
    icon: "📚",
  },
  {
    id: 2,
    title: "Alertas de Noticias Urgentes",
    description: "Recibe notificaciones inmediatas sobre comunicados urgentes.",
    icon: "❗",
  },
  {
    id: 3,
    title: "Actualizaciones del Sistema",
    description: "Mantente informado sobre mantenimientos y nuevas funciones.",
    icon: "⚙️",
  },
];

// COMPONENTE DE ESTILOS
const NotificationStyles = () => (
  <style>{`
    /* --- 🔔 ESTILOS DE NOTIFICACIÓN --- */
    
    /* Contenedor de acciones en la barra superior */
    .dash__actions {
      position: relative; /* Necesario para el posicionamiento del dropdown */
      display: flex;
      align-items: center;
      gap: 12px; /* Espacio entre botones */
    }

    /* Área de la campana (para posicionar el panel) */
    .notification-area {
      position: relative;
      display: flex;
      align-items: center;
    }

    /* Botón de campana (reutiliza tus clases y añade una para el icono) */
    .btn--icon {
      padding: 8px 10px; /* Ajusta el padding para el icono */
      line-height: 0; /* Ayuda a centrar el SVG */
    }

    /* El panel desplegable */
    .notifications-dropdown {
      position: absolute;
      top: 130%; /* Justo debajo de la campana (ajusta si es necesario) */
      right: 0;
      width: 340px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid #eee;
      z-index: 1000;
      overflow: hidden; /* Para que los bordes redondeados se apliquen a los hijos */
    }

    /* Cabecera del panel */
    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      background-color: #fcfcfc;
    }

    .notifications-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    /* Botón 'x' para cerrar */
    .notifications-header button {
      background: none;
      border: none;
      font-size: 1.5rem;
      font-weight: 300;
      color: #888;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    /* Lista de notificaciones */
    .notifications-list {
      list-style: none;
      padding: 0;
      margin: 0;
      max-height: 400px;
      overflow-y: auto;
    }

    /* Cada ítem de notificación */
    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-item:hover {
      background-color: #f9f9f9;
    }

    /* El ícono (emoji) */
    .notification-icon {
      font-size: 1.5rem;
      margin-right: 12px;
      margin-top: 2px;
    }

    /* El texto */
    .notification-content {
      flex: 1;
    }

    .notification-content strong {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .notification-content p {
      font-size: 0.85rem;
      color: #666;
      margin: 0;
      line-height: 1.4;
    }

    /* --- 👣 ESTILOS DEL NUEVO FOOTER --- */

    .dash__footer {
      text-align: center;
      padding: 24px 20px;
      margin-top: 48px; /* Espacio para separarlo del contenido */
      border-top: 1px solid #f0f0f0; /* Una línea sutil de separación */
      color: #888; /* Color de texto grisáceo */
      font-size: 0.85rem;
    }

    .dash__footer nav {
      display: flex;
      justify-content: center;
      gap: 24px; /* Espacio entre enlaces */
      margin-bottom: 12px;
    }

    .dash__footer-link {
      color: #555; /* Un color de enlace un poco más oscuro */
      font-weight: 500;
      text-decoration: none;
    }

    .dash__footer-link:hover {
      text-decoration: underline;
    }

    .dash__footer p {
      margin: 0;
    }
  `}</style>
);

export default function Dashboard() {
  const navigate = useNavigate();
  // ESTADO PARA CONTROLAR EL PANEL
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // función de cierre de sesión correcta
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
      {/* INYECTAMOS LOS ESTILOS */}
      <NotificationStyles />

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

      {/* ELIMINAMOS LA SECCIÓN "QUICK" DE AQUÍ:
        <section className="quick">...</section>
      */}
      
      {/* --- 👣 NUEVO FOOTER --- */}
      <footer className="dash__footer">
        <nav>
          <Link to="/soporte" className="dash__footer-link">
            Soporte Técnico
          </Link>
          <Link to="/acerca-de" className="dash__footer-link">
            Acerca de InfoBank
          </Link>
        </nav>
        <p>
          © {new Date().getFullYear()} InfoBank. Todos los derechos reservados.
        </p>
      </footer>
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

// NUEVO ÍCONO DE CAMPANA
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V8c0-3.07-1.63-5.64-4.5-6.32V1.5a1.5 1.5 0 0 0-3 0v.18C7.63 2.36 6 4.93 6 8v8l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

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
      <path d="M19.14 12.94a7.52 7.52 0 0 0 .05-.94 7.52 7.52 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.55 7.55 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 12.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.57.23-1.11.54-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L.71 7.98a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94s.02.63.05.94L.83 13.66a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.52.4 1.06.71 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49.42l.36-2.54c.57-.23 1.11-.54 1.63.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM11 15a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
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