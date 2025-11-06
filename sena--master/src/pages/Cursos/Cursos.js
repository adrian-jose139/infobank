// src/pages/Cursos/Cursos.jsx
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
  updateDoc, // 👈 Asegúrate que 'updateDoc' esté aquí
  increment, // 👈 1. IMPORTAMOS 'increment'
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import "./Cursos.css";
import { useTheme } from "../../context/ThemeContext";

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [uid, setUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();
  
  // Arreglo para el crash de 'useTheme' (pantalla en blanco)
  const { isDarkMode } = useTheme() || {};

  // Detectar usuario actual y traer inscripciones
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUid(u?.uid || null);
      setUserEmail(u?.email || null);
      if (u) {
        const q = query(
          collection(db, "enrolments"),
          where("userId", "==", u.uid)
        );
        try {
          const snap = await getDocs(q);
          const enrols = snap.docs.map((d) => d.data().courseId);
          setInscripciones(enrols);
        } catch (error) {
          console.error("Error al obtener inscripciones:", error);
          setInscripciones([]);
        }
      } else {
        setInscripciones([]);
      }
    });
    return unsub;
  }, []);

  // Escuchar cursos en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "cursos"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCursos(data);
      },
      (error) => {
        console.error("Error al obtener cursos:", error);
      }
    );
    return unsub;
  }, []);

  // === INSCRIBIRSE ===
  const handleInscribirse = async (curso) => {
    if (!uid || !userEmail) {
      Swal.fire("Error", "Debes iniciar sesión para inscribirte.", "error");
      navigate("/");
      return;
    }

    const enrolId = `${uid}_${curso.id}`;
    const ref = doc(db, "enrolments", enrolId);

    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        // 1. Inscribimos al usuario (esto ya lo tenías)
        await setDoc(ref, {
          userId: uid,
          courseId: curso.id,
          courseName: curso.nombre,
          userEmail: userEmail,
          status: "en_progreso",
          progress: 0,
          enrolledAt: serverTimestamp(),
          completedAt: null,
        });

        // 🔽🔽🔽 2. ESTA ES LA PARTE NUEVA (SUMAR) 🔽🔽🔽
        const cursoDocRef = doc(db, "cursos", curso.id);
        try {
          await updateDoc(cursoDocRef, {
            inscritos: increment(1) // Suma 1 al contador
          });
        } catch (error) {
          console.error("Error al actualizar el contador de inscritos:", error);
        }
        // 🔼🔼🔼 FIN DE LA PARTE NUEVA 🔼🔼🔼

        setInscripciones((prev) => [...prev, curso.id]);
        Swal.fire(
          "¡Inscrito!",
          `Te has inscrito correctamente al curso "${curso.nombre}".`,
          "success"
        );

        // (Tu lógica de notificación está bien)
        try {
          await addDoc(collection(db, "notificaciones"), {
            titulo: "Nueva Inscripción a Curso",
            descripcion: `El usuario ${userEmail} se inscribió al curso "${curso.nombre}".`,
            tipo: "curso",
            leida: false,
            creadoEn: serverTimestamp(),
            cursoId: curso.id,
            usuarioId: uid,
          });
        } catch (notifError) {
          console.error("Error al crear la notificación:", notifError);
        }
      } else {
        Swal.fire(
          "Ya estás inscrito",
          `Ya te encuentras inscrito en el curso "${curso.nombre}".`,
          "info"
        );
      }
    } catch (error) {
      console.error("Error al inscribirse:", error);
      Swal.fire("Error", "Ocurrió un error durante la inscripción.", "error");
    }
  };

  // === CANCELAR INSCRIPCIÓN ===
  const handleCancelar = async (curso) => {
    if (!uid) return;

    const confirm = await Swal.fire({
      title: "¿Cancelar inscripción?",
      html: `<p>¿Estás seguro de que deseas cancelar tu inscripción al curso <strong>"${curso.nombre}"</strong>?</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, mantenerme inscrito",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      // 1. Borramos la inscripción (esto ya lo tenías)
      const enrolId = `${uid}_${curso.id}`;
      await deleteDoc(doc(db, "enrolments", enrolId));

      // 🔽🔽🔽 2. ESTA ES LA PARTE NUEVA (RESTAR) 🔽🔽🔽
      const cursoDocRef = doc(db, "cursos", curso.id);
      try {
        await updateDoc(cursoDocRef, {
          inscritos: increment(-1) // Resta 1 al contador
        });
      } catch (error) {
        console.error("Error al actualizar el contador de inscritos:", error);
      }
      // 🔼🔼🔼 FIN DE LA PARTE NUEVA 🔼🔼🔼


      setInscripciones((prev) => prev.filter((id) => id !== curso.id));
      Swal.fire({
        title: "Inscripción cancelada",
        text: `Has cancelado tu inscripción al curso "${curso.nombre}".`,
        icon: "success",
        confirmButtonColor: "#16a34a",
      });

      // (Tu lógica de notificación está bien)
      try {
        await addDoc(collection(db, "notificaciones"), {
          titulo: "Cancelación de Inscripción",
          descripcion: `El usuario ${
            userEmail || uid
          } canceló su inscripción al curso "${curso.nombre}".`,
          tipo: "cancelacion_curso",
          leida: false,
          creadoEn: serverTimestamp(),
          cursoId: curso.id,
          usuarioId: uid,
        });
      } catch (notifError) {
        console.error("Error al crear la notificación:", notifError);
      }
    } catch (error) {
      console.error("Error al cancelar inscripción:", error);
      Swal.fire("Error", "No se pudo cancelar la inscripción.", "error");
    }
  };

  return (
    <div className={`cursos-container ${isDarkMode ? "dark" : ""}`}>
      <header className="cursos-header">
        <Link to="/dashboard" className="volver">
          ← Volver al Inicio
        </Link>
        <h2>📘 Cursos Disponibles</h2>
      </header>

      <h3 className="cursos-title">Catálogo de Cursos</h3>
      <p className="cursos-subtitle">
        Explora e inscríbete en los cursos de formación disponibles
      </p>

      <div className="cursos-list">
        {cursos.length > 0 ? (
          cursos.map((curso) => {
            const estaInscrito = inscripciones.includes(curso.id);
            return (
              <div
                key={curso.id}
                className={`curso-card ${estaInscrito ? "inscrito" : ""}`}
              >
                <div className="curso-header">
                  <h4>{curso.nombre}</h4>
                  <div className="badges">
                    <span className="badge badge-activo">Activo</span>
                    {estaInscrito && (
                      <span className="badge badge-inscrito">🟢 Inscrito</span>
                    )}
                  </div>
                </div>
                <p className="curso-desc">{curso.descripcion}</p>
                <div className="curso-info">
                  {/*
                    ESTA LÍNEA AHORA SE ACTUALIZARÁ SOLA
                    gracias a 'onSnapshot' y 'increment'
                  */}
                  <p>
                    👥 <strong>{curso.inscritos ?? 0}/
                    {curso.cupos || "?"}</strong>{" "}
                    inscritos
                  </p>
                  <p>
                    📅 <strong>{curso.fechaLimite || "Sin definir"}</strong>{" "}
                    expira
                  </p>
                  <p>
                    ⏱️ <strong>{curso.duracion || "No especificada"}</strong>
                  </p>
                  <p>
                    📄 <strong>Material disponible</strong>
                  </p>
                </div>
                <div className="curso-footer">
                  <small>
                    Creado{" "}
                    {curso.createdAt?.toDate
                      ? `el ${curso.createdAt.toDate().toLocaleDateString()}`
                      : ""}
                  </small>
                  {estaInscrito ? (
                    <div className="botones-inscrito">
                      <button
                        className="btn-ver"
                        onClick={() => navigate(`/curso/${curso.id}`)}
                      >
                        {" "}
                        Ver Contenido{" "}
                      </button>
                      
                      <button
                        className="btn-cancelar"
                        onClick={() => handleCancelar(curso)}
                      >
                        {" "}
                        Cancelar{" "}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-inscribirse"
                      onClick={() => handleInscribirse(curso)}
                    >
                      {" "}
                      Inscribirse{" "}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-cursos">No hay cursos disponibles en este momento.</p>
        )}
      </div>
    </div>
  );
}