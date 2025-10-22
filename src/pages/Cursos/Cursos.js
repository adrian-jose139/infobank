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
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import "./Cursos.css";

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [uid, setUid] = useState(null);
  const navigate = useNavigate();

  // Detectar usuario actual y traer inscripciones
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUid(u?.uid || null);
      if (u) {
        const q = query(collection(db, "enrolments"), where("userId", "==", u.uid));
        const snap = await getDocs(q);
        const enrols = snap.docs.map((d) => d.data().courseId);
        setInscripciones(enrols);
      } else {
        setInscripciones([]);
      }
    });
    return unsub;
  }, []);

  // Escuchar cursos en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "cursos"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCursos(data);
    });
    return unsub;
  }, []);

  // === INSCRIBIRSE ===
  const handleInscribirse = async (curso) => {
    if (!uid) {
      alert("Primero inicia sesión");
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
        status: "en_progreso",
        progress: 0,
        enrolledAt: serverTimestamp(),
        completedAt: null,
      });
      setInscripciones((prev) => [...prev, curso.id]);
    }
  };

 // === CANCELAR INSCRIPCIÓN ===
const handleCancelar = async (curso) => {
  const confirm = await Swal.fire({
    title: "¿Cancelar inscripción?",
    html: `<p>¿Estás seguro de que deseas cancelar tu inscripción al curso <strong>"${curso.nombre}"</strong>?</p>`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, cancelar",
    cancelButtonText: "No, mantenerme inscrito",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    background: "#fff",
  });

  if (!confirm.isConfirmed) return;

  try {
    const enrolId = `${uid}_${curso.id}`;
    await deleteDoc(doc(db, "enrolments", enrolId));
    setInscripciones((prev) => prev.filter((id) => id !== curso.id));

    Swal.fire({
      title: "Inscripción cancelada",
      text: `Has cancelado tu inscripción al curso "${curso.nombre}".`,
      icon: "success",
      confirmButtonColor: "#16a34a",
    });
  } catch (error) {
    console.error("Error al cancelar inscripción:", error);
    Swal.fire("Error", "No se pudo cancelar la inscripción.", "error");
  }
};

  return (
    <div className="cursos-container">
      <header className="cursos-header">
        <Link to="/dashboard" className="volver">← Volver al Inicio</Link>
        <h2>📘 Cursos Disponibles</h2>
      </header>

      <h3 className="cursos-title">Catálogo de Cursos</h3>
      <p className="cursos-subtitle">Explora e inscríbete en los cursos de formación disponibles</p>

      <div className="cursos-list">
        {cursos.length > 0 ? (
          cursos.map((curso) => {
            const estaInscrito = inscripciones.includes(curso.id);

            return (
              <div key={curso.id} className={`curso-card ${estaInscrito ? "inscrito" : ""}`}>
                <div className="curso-header">
                  <h4>{curso.nombre}</h4>
                  <div className="badges">
                    <span className="badge badge-activo">Activo</span>
                    {estaInscrito && <span className="badge badge-inscrito">🟢 Inscrito</span>}
                  </div>
                </div>

                <p className="curso-desc">{curso.descripcion}</p>

                <div className="curso-info">
                  <p>👥 <strong>{curso.inscritos || 45}/{curso.cupos || "?"}</strong> inscritos</p>
                  <p>📅 <strong>{curso.fechaLimite || "Sin definir"}</strong> expira</p>
                  <p>⏱️ <strong>{curso.duracion || "No especificada"}</strong></p>
                  <p>📄 <strong>Video + Docs</strong></p>
                </div>

                <div className="curso-footer">
                  <small>
                    Creado por Admin InfoBank <br />
                    Fecha de creación: {curso.fechaCreacion || "No disponible"}
                  </small>

                  {estaInscrito ? (
                    <div className="botones-inscrito">
                      <button
                        className="btn-ver"
                        onClick={() => navigate(`/curso/${curso.id}`)}
                      >
                        Ver Contenido
                      </button>
                      <button className="btn-evaluacion" disabled>
                        Presentar Evaluación
                      </button>
                      <button
                        className="btn-cancelar"
                        onClick={() => handleCancelar(curso)}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-inscribirse"
                      onClick={() => handleInscribirse(curso)}
                    >
                      Inscribirse
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
