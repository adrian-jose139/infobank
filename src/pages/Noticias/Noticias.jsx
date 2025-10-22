import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './Noticias.css';

// --- Iconos SVG ---
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
// --- Fin Iconos ---

export default function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');

  const categorias = ["Todas", "Corporativas", "Economía", "Eventos", "Educación Financiera", "Tecnología", "Comunicados Urgentes"];

  useEffect(() => {
    const q = query(collection(db, "noticias"), orderBy("fechaPublicacion", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNoticias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  const noticiasFiltradas = noticias
    .filter(noticia => categoriaActiva === 'Todas' || noticia.categoria === categoriaActiva)
    .filter(noticia => {
      const textoBusqueda = busqueda.toLowerCase();
      return (
        noticia.titulo?.toLowerCase().includes(textoBusqueda) ||
        noticia.descripcion?.toLowerCase().includes(textoBusqueda) ||
        noticia.autor?.toLowerCase().includes(textoBusqueda)
      );
    });

  return (
    <div className="pagina-noticias-pro">
      <header className="noticias-header-pro">
        <h2>Noticias Publicadas</h2>
        <Link to="/dashboard" className="btn-volver">← Volver</Link>
      </header>

      <div className="controles-noticias">
        <input
          type="text"
          className="search-bar"
          placeholder="🔍 Buscar por título, autor o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="category-filters">
          {categorias.map(cat => (
            <button
              key={cat}
              className={`category-btn ${categoriaActiva === cat ? 'active' : ''}`}
              onClick={() => setCategoriaActiva(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="feed-noticias">
        {cargando && <p>Cargando...</p>}
        {!cargando && noticiasFiltradas.map(noticia => (
          <article key={noticia.id} className="noticia-card-pro">
            <div className="card-content">
              <span className="card-category-tag">{noticia.categoria || 'General'}</span>
              <h3 className="card-title-pro">{noticia.titulo}</h3>
              <p className="card-description-pro">{noticia.descripcion}</p>
              <div className="card-meta-pro">
                <div className="meta-item">
                  <CalendarIcon />
                  <span>
                    {noticia.fechaPublicacion?.toDate?.().toLocaleDateString?.() || 'Sin fecha'}
                  </span>
                </div>
                <div className="meta-item">
                  <UserIcon />
                  <span>{noticia.autor || 'Administrador'}</span>
                </div>
              </div>
            </div>
            {noticia.imagen && (
              <div className="card-image">
                <img
                  src={noticia.imagen}
                  alt={noticia.titulo}
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/250x150?text=Sin+imagen')}
                />
              </div>
            )}
          </article>
        ))}
      </main>
    </div>
  );
}
