// src/pages/AcercaDe.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// 1. COMPONENTE DE ESTILOS (igual que en tu Dashboard)
const AcercaDeStyles = () => (
  <style>{`
    /* Contenedor principal de la página */
    .acerca-de-page {
      max-width: 800px;
      margin: 40px auto; /* Centrado y con espacio */
      padding: 32px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      color: #333;
      line-height: 1.6;
    }

    .acerca-de-page h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #222;
      margin-top: 0;
      margin-bottom: 24px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 16px;
    }

    .acerca-de-page h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111;
      margin-top: 32px;
      margin-bottom: 12px;
    }

    .acerca-de-page p,
    .acerca-de-page li {
      font-size: 1rem;
      color: #555;
    }

    .acerca-de-page ul {
      list-style-type: disc;
      padding-left: 24px;
      margin-top: 0;
    }
    
    .acerca-de-page li {
      margin-bottom: 8px;
    }

    /* Sección de contacto */
    .acerca-de-page .contact-info {
      background-color: #f9f9f9;
      border: 1px solid #eee;
      padding: 20px;
      border-radius: 8px;
      margin-top: 16px;
    }
    
    .acerca-de-page .contact-info p {
      margin: 0;
    }

    /* Sección de versión */
    .acerca-de-page .version-info {
      margin-top: 32px;
      text-align: center;
      font-size: 0.85rem;
      color: #aaa;
    }

    /* Botón de volver (reutiliza clases si las tienes, si no, usa estas) */
    .btn--back {
      display: inline-block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #555;
      background-color: #f0f0f0;
      border: none;
      padding: 10px 16px;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.2s;
      margin-bottom: 24px;
    }

    .btn--back:hover {
      background-color: #e5e5e5;
    }
  `}</style>
);

// 2. COMPONENTE PRINCIPAL DE LA PÁGINA
export default function AcercaDe() {
  const navigate = useNavigate();

  return (
    <>
      {/* Inyectamos los estilos */}
      <AcercaDeStyles />

      {/* Contenido de la página */}
      <main className="acerca-de-page">
        
        {/* Botón para volver al Dashboard */}
        <button onClick={() => navigate("/dashboard")} className="btn--back">
          &larr; Volver al Inicio
        </button>

        <h1>Acerca de InfoBank</h1>

        <h3>¿Qué es InfoBank?</h3>
        <p>
          InfoBank es la plataforma centralizada de <strong>[Nombre de tu Empresa]</strong> diseñada 
          para la gestión del conocimiento y la comunicación interna.
        </p>
        <p>
          Nuestro objetivo es proporcionarte un acceso unificado y sencillo a todos
          los recursos corporativos, materiales de formación, noticias relevantes
          y anuncios importantes. Esta plataforma busca centralizar la
          información para ayudarte en tu desarrollo profesional y mantenerte al
          día con todo lo que sucede en la compañía.
        </p>

        <h3>Características Principales</h3>
        <ul>
          <li>
            <strong>Cursos:</strong> Accede a todos los módulos de capacitación,
            materiales de estudio y evaluaciones.
          </li>
          <li>
            <strong>Noticias:</strong> Mantente informado sobre las últimas
            novedades y comunicados de la empresa.
          </li>
          <li>
            <strong>Muro Informativo:</strong> Ver anuncios importantes,
            publicaciones y actualizaciones del día a día.
          </li>
          <li>
            <strong>Configuración:</strong> Administra las preferencias de tu
            perfil y cuenta.
          </li>
        </ul>

        <h3>Equipo Responsable</h3>
        <p>
          Esta plataforma es administrada y mantenida por 
          <strong> [Luis Villalba y Adrian Ovallos]</strong>.
        </p>
        
        <div className="contact-info">
          <p>
            Si tienes alguna sugerencia sobre el contenido, nuevas ideas para
            cursos o quieres publicar un anuncio, por favor contacta a:
            <br />
            <strong>Email:</strong> <a href="mailto:[email.responsable@tuempresa.com]">[email.responsable@tuempresa.com]</a>
            <br />
            <strong>Canal Interno:</strong> [Ej: #canal-de-infobank en Slack/Teams]
          </p>
        </div>

        <div className="version-info">
          <p>InfoBank v1.0.0</p>
          <p>© {new Date().getFullYear()} [Nombre de tu Empresa]</p>
        </div>

      </main>
    </>
  );
}