// src/pages/Cursos/Cursos.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  addDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import "./Cursos.css";
import { useTheme } from "../../context/ThemeContext";

const formatDate = (timestamp) => {
  if (!timestamp) return "Sin fecha";
  try {
    if (typeof timestamp === "string") {
      return new Date(timestamp).toLocaleDateString("es-CO");
    }
    return timestamp.toDate().toLocaleDateString("es-co");
  } catch {
    return "Inválido";
  }
};

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [uid, setUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme() || {};

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUid(u?.uid || null);
      setUserEmail(u?.email || null);
      if (u) {
        const q = query(collection(db, "enrolments"), where("userId", "==", u.uid));
        const snap = await getDocs(q);
        const enrols = snap.docs.map((d) => d.data().courseId);
        setInscripciones(enrols);
      } else {
        setInscripciones([]);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Solo comparar fecha, no hora

    const unsubCursos = onSnapshot(collection(db, "cursos"), (snapshot) => {
      const ahora = new Date();
      ahora.setHours(0, 0, 0, 0);

      const cursosFiltrados = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((curso) => {
          // Ocultar cursos archivados
          if (curso.estado === "archivado") return false;

          // Si NO tiene fecha límite → siempre visible
          if (!curso.fechaLimite) return true;

          // Convertir fechaLimite (string "YYYY-MM-DD") a Date
          const fechaLimite = new Date(curso.fechaLimite);
          fechaLimite.setHours(0, 0, 0, 0);

          // Solo mostrar si la fecha límite es hoy o en el futuro
          return fechaLimite >= ahora;
        });

      setCursos(cursosFiltrados);
    });

    return () => unsubCursos();
  }, []);

  const handleInscribirse = async (curso) => {
    if (!uid) {
      Swal.fire("Error", "Debes iniciar sesión.", "error");
      navigate("/");
      return;
    }

    const enrolId = `${uid}_${curso.id}`;
    const ref = doc(db, "enrolments", enrolId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        userId: uid,
        courseId: curso.id,
        courseName: curso.nombre,
        userEmail,
        status: "en_progreso",
        progress: 0,
        enrolledAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "cursos", curso.id), { inscritos: increment(1) });
      setInscripciones((prev) => [...prev, curso.id]);

      Swal.fire("¡Inscrito!", `Te inscribiste en "${curso.nombre}"`, "success");

      await addDoc(collection(db, "notificaciones"), {
        titulo: "Nueva inscripción",
        descripcion: `${userEmail} se inscribió en "${curso.nombre}"`,
        tipo: "curso",
        leida: false,
        creadoEn: serverTimestamp(),
        cursoId: curso.id,
        usuarioId: uid,
      });
    } else {
      Swal.fire("Ya inscrito", "Ya estás en este curso.", "info");
    }
  };

  const handleCancelar = async (curso) => {
    const confirm = await Swal.fire({
      title: "¿Cancelar inscripción?",
      html: `<p>¿Seguro que quieres cancelar <strong>"${curso.nombre}"</strong>?</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (!confirm.isConfirmed) return;

    const enrolId = `${uid}_${curso.id}`;
    await deleteDoc(doc(db, "enrolments", enrolId));
    await updateDoc(doc(db, "cursos", curso.id), { inscritos: increment(-1) });
    setInscripciones((prev) => prev.filter((id) => id !== curso.id));

    Swal.fire("Cancelado", `Inscripción cancelada en "${curso.nombre}"`, "success");
  };

  return (
    <div className={`cursos-container ${isDarkMode ? "dark" : ""}`}>
      <header className="cursos-header">
        <Link to="/dashboard" className="volver">Volver al Inicio</Link>
        <h2>Cursos Disponibles</h2>
      </header>

      <h3 className="cursos-title">Catálogo de Cursos</h3>
      <p className="cursos-subtitle">
        {cursos.length === 0
          ? "No hay cursos disponibles en este momento. ¡Vuelve pronto!"
          : "Explora e inscríbete en los cursos activos"}
      </p>

      <div className="cursos-list">
        {cursos.length === 0 ? (
          <div className="empty-state">
            <p>¡Estás al día con todos tus cursos!</p>
            <span role="img" aria-label="celebración">¡Felicidades!</span>
          </div>
        ) : (
          cursos.map((curso) => {
            const estaInscrito = inscripciones.includes(curso.id);
            const diasRestantes = curso.fechaLimite
              ? Math.ceil((new Date(curso.fechaLimite) - new Date()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={curso.id}
                className={`curso-card ${estaInscrito ? "inscrito" : ""} ${
                  diasRestantes !== null && diasRestantes <= 3 ? "urgente" : ""
                }`}
              >
                <div className="curso-header">
                  <h4>{curso.nombre}</h4>
                  <div className="badges">
                    <span className="badge badge-activo">Activo</span>
                    {estaInscrito && <span className="badge badge-inscrito">Inscrito</span>}
                    {diasRestantes !== null && diasRestantes <= 3 && (
                      <span className="badge badge-urgente">
                        {diasRestantes === 0 ? "¡Hoy!" : `Quedan ${diasRestantes} días`}
                      </span>
                    )}
                  </div>
                </div>

                <p className="curso-desc">{curso.descripcion}</p>

                <div className="curso-info">
                  <p>
                    <strong>{curso.inscritos ?? 0}/{curso.cupos || "?"}</strong> inscritos
                  </p>
                  <p>
                    <strong>
                      {curso.fechaLimite ? formatDate(curso.fechaLimite) : "Sin límite"}
                    </strong>{" "}
                    expira
                  </p>
                  <p>
                    <strong>{curso.duracion || "No definida"}</strong>
                  </p>
                </div>

                <div className="curso-footer">
                  <small>Creado el {formatDate(curso.createdAt)}</small>

                  {estaInscrito ? (
                    <div className="botones-inscrito">
                      <button className="btn-ver" onClick={() => navigate(`/curso/${curso.id}`)}>
                        Ver Contenido
                      </button>
                      <button className="btn-cancelar" onClick={() => handleCancelar(curso)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-inscribirse"
                      onClick={() => handleInscribirse(curso)}
                      disabled={curso.cupos && curso.inscritos >= curso.cupos}
                    >
                      {curso.cupos && curso.inscritos >= curso.cupos
                        ? "Cupos agotados"
                        : "Inscribirse"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}