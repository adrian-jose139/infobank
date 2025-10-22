import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig"; // ✅ Ruta corregida
import "./Configuracion.css";
import  ThemeContext  from "../../context/ThemeContext"; // ✅ Ruta corregida


export default function Configuracion() {
  const [tab, setTab] = useState("perfil");
  const [usuario, setUsuario] = useState(null);
  const [modoOscuro, setModoOscuro] = useState(
    localStorage.getItem("modoOscuro") === "true"
  );
  const [notificaciones, setNotificaciones] = useState({
    email: true,
    recordatorios: true,
    alertas: false,
    actualizaciones: true,
  });

  // 🔹 Cargar datos del usuario
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const ref = doc(db, "usuarios", user.uid);
      getDoc(ref).then((snap) => {
        if (snap.exists()) {
          setUsuario(snap.data());
        } else {
          setUsuario({
            nombre: "",
            apellido: "",
            email: user.email,
            areaTrabajo: "",
            cargo: "",
            telefono: "",
          });
        }
      });
    }
  }, []);

  // 🔹 Guardar modo oscuro en localStorage
  useEffect(() => {
    document.body.classList.toggle("dark-mode", modoOscuro);
    localStorage.setItem("modoOscuro", modoOscuro);
  }, [modoOscuro]);

  // 🔹 Guardar cambios del perfil
  const handleGuardarCambios = async () => {
    if (!usuario) return;
    const user = auth.currentUser;
    try {
      await updateDoc(doc(db, "usuarios", user.uid), usuario);
      alert("✅ Cambios guardados correctamente.");
    } catch (error) {
      alert("❌ Error al guardar cambios: " + error.message);
    }
  };

  // 🔹 Guardar preferencias
  const handleGuardarPreferencias = () => {
    alert("✅ Preferencias actualizadas correctamente.");
  };

  return (
    <div className={`configuracion ${modoOscuro ? "dark" : ""}`}>
      <header className="config-header">
        <Link to="/dashboard" className="volver">
          ← Volver al Inicio
        </Link>
        <h2>⚙️ Configuración</h2>
      </header>

      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === "perfil" ? "active" : ""}`}
          onClick={() => setTab("perfil")}
        >
          🧍 Perfil
        </button>
        <button
          className={`tab-btn ${tab === "notificaciones" ? "active" : ""}`}
          onClick={() => setTab("notificaciones")}
        >
          🔔 Notificaciones
        </button>
        <button
          className={`tab-btn ${tab === "apariencia" ? "active" : ""}`}
          onClick={() => setTab("apariencia")}
        >
          💡 Apariencia
        </button>
      </div>

      {/* ===== PERFIL ===== */}
      {tab === "perfil" && usuario && (
        <section className="perfil">
          <h3>Información Personal</h3>
          <div className="perfil-form">
            <label>
              Nombre
              <input
                type="text"
                value={usuario.nombre}
                onChange={(e) =>
                  setUsuario({ ...usuario, nombre: e.target.value })
                }
              />
            </label>
            <label>
              Apellido
              <input
                type="text"
                value={usuario.apellido}
                onChange={(e) =>
                  setUsuario({ ...usuario, apellido: e.target.value })
                }
              />
            </label>
            <label>
              Correo Electrónico
              <input type="email" value={usuario.email} disabled />
            </label>
            <label>
              Teléfono
              <input
                type="text"
                value={usuario.telefono || ""}
                onChange={(e) =>
                  setUsuario({ ...usuario, telefono: e.target.value })
                }
              />
            </label>
            <label>
              Área
              <input
                type="text"
                value={usuario.areaTrabajo}
                onChange={(e) =>
                  setUsuario({ ...usuario, areaTrabajo: e.target.value })
                }
              />
            </label>
            <label>
              Cargo
              <input
                type="text"
                value={usuario.cargo}
                onChange={(e) =>
                  setUsuario({ ...usuario, cargo: e.target.value })
                }
              />
            </label>
          </div>
          <button onClick={handleGuardarCambios} className="btn-guardar">
            💾 Guardar Cambios
          </button>
        </section>
      )}

      {/* ===== NOTIFICACIONES ===== */}
      {tab === "notificaciones" && (
        <section className="notificaciones">
          <h3>Preferencias de Notificaciones</h3>
          {Object.entries(notificaciones).map(([key, value]) => (
            <div key={key} className="notif-item">
              <div>
                <strong>
                  {key === "email"
                    ? "Notificaciones por Email"
                    : key === "recordatorios"
                    ? "Recordatorios de Cursos"
                    : key === "alertas"
                    ? "Alertas de Noticias"
                    : "Actualizaciones del Sistema"}
                </strong>
                <p>
                  {key === "email"
                    ? "Recibe notificaciones importantes por correo electrónico"
                    : key === "recordatorios"
                    ? "Recibe recordatorios sobre cursos próximos a vencer"
                    : key === "alertas"
                    ? "Notificaciones cuando se publiquen noticias nuevas"
                    : "Recibe notificaciones sobre mantenimientos y actualizaciones"}
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() =>
                    setNotificaciones({
                      ...notificaciones,
                      [key]: !value,
                    })
                  }
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
          <button onClick={handleGuardarPreferencias} className="btn-guardar">
            ✅ Guardar Preferencias
          </button>
        </section>
      )}

      {/* ===== APARIENCIA ===== */}
      {tab === "apariencia" && (
        <section className="apariencia">
          <h3>Preferencias de Apariencia</h3>
          <div className="notif-item">
            <div>
              <strong>Modo Oscuro</strong>
              <p>
                Cambia la apariencia de la interfaz a un tema oscuro. Ideal
                para entornos con poca luz.
              </p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={modoOscuro}
                onChange={() => setModoOscuro(!modoOscuro)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <p className="info">
            🌙 El modo oscuro reduce la fatiga visual y ahorra batería en
            pantallas OLED.
          </p>
        </section>
      )}
    </div>
  );
}
