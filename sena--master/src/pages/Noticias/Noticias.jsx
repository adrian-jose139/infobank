import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './Noticias.css';
import { useTheme } from '../../context/ThemeContext';

// --- Iconos SVG (Sin cambios) ---
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
  const { isDarkMode } = useTheme();

  // Estado para saber qué tarjeta está expandida
  const [idExpandido, setIdExpandido] = useState(null); // null = ninguna

  const categorias = ["Todas", "Corporativas", "Economía", "Eventos", "Educación Financiera", "Tecnología", "Comunicados Urgentes"];

  // Función para manejar el clic en la tarjeta
  const handleCardClick = (id) => {
    setIdExpandido(idActual => (idActual === id ? null : id));
  };

  useEffect(() => {
    const q = query(collection(db, "noticias"), orderBy("fechaPublicacion", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNoticias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCargando(false);
    }, (error) => {
      console.error("Error fetching noticias:", error);
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
    <div className={`pagina-noticias-pro ${isDarkMode ? "dark" : ""}`}>
      <header className="noticias-header-pro">
        <h2>Noticias Publicadas</h2>
        <Link to="/dashboard" className="btn-volver">Volver al inicio</Link>
      </header>

      <div className="controles-noticias">
        <input
          type="text"
          className="search-bar"
          placeholder="Buscar por título, autor o descripción..."
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
        
        {!cargando && noticiasFiltradas.length === 0 && (
          <p className="no-noticias">No hay noticias que coincidan con los filtros actuales.</p>
        )}

        {!cargando && noticiasFiltradas.map(noticia => {
          const estaExpandida = noticia.id === idExpandido;

          return (
            <article
              key={noticia.id}
              className="noticia-card-pro clickable"
              onClick={() => handleCardClick(noticia.id)}
            >
              <div className="card-content">
                <span className="card-category-tag">{noticia.categoria || 'General'}</span>
                <h3 className="card-title-pro">{noticia.titulo}</h3>

                {/* Descripción que se expande al hacer clic */}
                <p className={`card-description-pro ${estaExpandida ? 'expanded' : ''}`}>
                  {noticia.descripcion}
                </p>

                <div className="card-meta-pro">
                  <div className="meta-item">
                    <CalendarIcon />
                    <span>
                      {noticia.fechaPublicacion?.toDate 
                        ? noticia.fechaPublicacion.toDate().toLocaleDateString("es-ES") 
                        : 'Sin fecha'}
                    </span>
                  </div>
                  <div className="meta-item">
                    <UserIcon />
                    <span>{noticia.autor || 'Administrador'}</span>
                  </div>
                </div>
              </div>

              {/* Imagen (visible siempre) */}
              {noticia.imagen && (
                <div className="card-image">
                  <img
                    src={noticia.imagen}
                    alt={noticia.titulo || 'Imagen de noticia'}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/250x150/cccccc/ffffff?text=Imagen+no+disponible';
                      e.target.alt = 'Imagen no disponible';
                    }}
                  />
                </div>
              )}
            </article>
          );
        })}
      </main>
    </div>
  );
}