import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import infobankLogo from "../../assets/infobank-logo.png"; // Ajusta la ruta si es necesario
import "./Muro.css";

export default function MuroInformativo() {
  const [posts, setPosts] = useState([]);
  const [categoria, setCategoria] = useState("Todas");
  const [buscar, setBuscar] = useState("");

  useEffect(() => {
    const q = query(collection(db, "muro"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Datos recibidos:", data); // Depuración
      setPosts(data);
    }, (error) => {
      console.error("Error al obtener datos:", error); // Manejo de errores
    });
    return () => unsub();
  }, []);

  const categorias = [
    "Todas",
    "Anuncios Generales",
    "Eventos internos",
    "Actualizaciones Operativas",
    "Reconocimientos y Logros",
    "Salud y Bienestar",
    "Capacitaciones y Desarrollo",
  ];

  const filtrados = posts.filter((p) => {
    const coincideCat = categoria === "Todas" || p.categoria === categoria;
    const q = buscar.trim().toLowerCase();
    const coincideTexto =
      q === "" ||
      (p.titulo || "").toLowerCase().includes(q) ||
      (p.descripcion || "").toLowerCase().includes(q);
    return coincideCat && coincideTexto;
  });

  return (
    <main className="muro">
      <header className="muro__topbar">
        <Link to="/dashboard" className="muro__back">← Volver al Inicio</Link>
        <div className="muro__title">
          <MuroIconTop />
          <h1>Muro Informativo</h1>
        </div>
        <img className="muro__brand" src={infobankLogo} alt="InfoBank" />
      </header>

      <div className="muro__bar" />

      <section className="muro__container">
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

        <section className="muro__feed">
          <div className="muro__search">
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="🔎 Buscar publicaciones..."
            />
          </div>

          {filtrados.length === 0 ? (
            <div className="muro__empty">No hay publicaciones.</div>
          ) : (
            filtrados.map((p) => (
              <article key={p.id} className="muro__card">
                <div className="muro__card-meta">
                  {p.imagenurl ? (
                    <img
                      src={p.imagenurl}
                      alt={`Ícono de ${p.titulo}`}
                      className="muro__avatar"
                      style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                      onError={(e) => console.log("Error al cargar imagen:", e)}
                    />
                  ) : (
                    <div className="muro__avatar" style={{ backgroundColor: "#7c3aed" }}>A</div>
                  )}
                  <div className="muro__meta-txt">
                    <div className="muro__author"></div>
                    <div className="muro__date">
                      {p.fecha?.toDate?.().toLocaleDateString?.("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) || "Fecha no disponible"}
                      {p.fechaActualizada && (
                        <>
                          {" · Actualizado: "}
                          {p.fechaActualizada?.toDate?.().toLocaleDateString?.("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) || "—"}
                        </>
                      )}
                    </div>
                  </div>
                  <span className="muro__tag">{p.categoria || "General"}</span>
                </div>

                <h2 className="muro__card-title">{p.titulo}</h2>
                <p className="muro__card-body">{p.descripcion}</p>
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
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}