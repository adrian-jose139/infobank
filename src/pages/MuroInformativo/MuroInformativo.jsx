// src/MuroInformativo.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import infobankLogo from "../../assets/infobank-logo.png"; // ajusta ruta si tu archivo está en /pages/
import "./Muro.css";

export default function MuroInformativo() {
  const [posts, setPosts] = useState([]);
  const [categoria, setCategoria] = useState("Todas");
  const [buscar, setBuscar] = useState("");

  useEffect(() => {
    const q = query(collection(db, "muro"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(data);
    });
    return unsub;
  }, []);

  const categorias = [
    "Todas",
    "Seguridad",
    "Capacitación",
    "Tecnología",
    "Compliance",
    "Servicio al Cliente",
  ];

  const filtrados = posts.filter((p) => {
    const coincideCat = categoria === "Todas" || p.categoria === categoria;
    const q = buscar.trim().toLowerCase();
    const coincideTexto =
      q === "" ||
      (p.titulo || "").toLowerCase().includes(q) ||
      (p.contenido || "").toLowerCase().includes(q);
    return coincideCat && coincideTexto;
  });

  return (
    <main className="muro">
      {/* Topbar */}
      <header className="muro__topbar">
        <Link to="/dashboard" className="muro__back">← Volver al Inicio</Link>
        <div className="muro__title">
          <MuroIconTop />
          <h1>Muro Informativo</h1>
        </div>
        <img className="muro__brand" src={infobankLogo} alt="InfoBank" />
      </header>

      {/* Línea de color */}
      <div className="muro__bar" />

      <section className="muro__container">
        {/* Sidebar izquierda */}
        <aside className="muro__sidebar">
          <h3>Categorías</h3>
          <ul className="muro__cats">
            {categorias.map((cat) => (
              <li key={cat}>
                <button
                  className={`muro__cat ${categoria === cat ? "active" : ""}`}
                  onClick={() => setCategoria(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>

          <div className="muro__stats">
            <h3>📊 Estadísticas</h3>
            <p>Total de publicaciones</p>
            <div className="muro__stats-value">{posts.length}</div>
          </div>
        </aside>

        {/* Feed a la derecha */}
        <section className="muro__feed">
          <div className="muro__search">
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="🔎  Buscar publicaciones..."
            />
          </div>

          {filtrados.length === 0 ? (
            <div className="muro__empty">No hay publicaciones.</div>
          ) : (
            filtrados.map((p) => (
              <article key={p.id} className="muro__card">
                <div className="muro__card-meta">
                  <div className="muro__avatar">{(p.autorNombre || "A")[0]}</div>
                  <div className="muro__meta-txt">
                    <div className="muro__author">
                      {p.autorNombre || "Administrador del Sistema"}{" "}
                      <span className="muro__role">{p.autorRol || "Admin"}</span>
                    </div>
                    <div className="muro__date">
                      {p.createdAt?.toDate
                        ? p.createdAt.toDate().toLocaleDateString()
                        : ""}
                    </div>
                  </div>

                  {p.etiqueta && <span className="muro__tag">{p.etiqueta}</span>}
                </div>

                <h2 className="muro__card-title">{p.titulo}</h2>
                <p className="muro__card-body">{p.contenido}</p>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}

function MuroIconTop() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#7c3aed" aria-hidden="true">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  );
}
