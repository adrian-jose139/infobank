import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import "./CursoDetalle.css";

export default function CursoDetalle() {
  const { id } = useParams();                // courseId
  const [curso, setCurso] = useState(null);
  const [uid, setUid] = useState(null);
  const [enrol, setEnrol] = useState(null);  // inscripción del usuario

  // Usuario actual
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid || null));
    return unsub;
  }, []);

  // Cargar curso
  useEffect(() => {
    const fetchCurso = async () => {
      const ref = doc(db, "cursos", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setCurso({ id: snap.id, ...snap.data() });
    };
    fetchCurso();
  }, [id]);

  // Escuchar inscripción del usuario (si hay uid)
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "enrolments", `${uid}_${id}`);
    const unsub = onSnapshot(ref, (snap) => {
      setEnrol(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return unsub;
  }, [uid, id]);

  const handleInscribirme = async () => {
    if (!uid) { alert("Inicia sesión para inscribirte"); return; }
    const ref = doc(db, "enrolments", `${uid}_${id}`);
    await setDoc(ref, {
      userId: uid,
      courseId: id,
      status: "en_progreso",
      progress: 0,
      enrolledAt: serverTimestamp(),
      completedAt: null,
    });
  };

  const handleCompletar = async () => {
    if (!uid) return;
    const ref = doc(db, "enrolments", `${uid}_${id}`);
    await updateDoc(ref, {
      progress: 100,
      status: "completado",
      completedAt: serverTimestamp(),
    });
  };

  if (!curso) return <p className="loading">Cargando curso...</p>;

  const progress = enrol?.progress ?? 0;
  const isEnrolled = !!enrol;

  return (
    <div className="curso-page">
      <header className="curso-header">
        <Link to="/cursos" className="volver">← Volver al Catálogo</Link>
      </header>

      <div className="curso-card-detalle">
        <div className="curso-top">
          <div className="curso-title-section">
            <h2 className="curso-titulo">{curso.nombre}</h2>
            <div className="curso-badges">
              <span className="badge badge--black">Activo</span>
              {isEnrolled ? (
                <span className="badge badge--green">Inscrito</span>
              ) : (
                <span className="badge badge--gray">No inscrito</span>
              )}
            </div>
          </div>

          {curso.imagen && <img src={curso.imagen} alt={curso.nombre} className="curso-img" />}
        </div>

        <p className="curso-descripcion">{curso.descripcion}</p>

        <div className="curso-datos">
          <div className="dato-item"><span className="icon">👥</span><strong>{`45 / ${curso.cupos || "?"}`}</strong><p>Inscritos</p></div>
          <div className="dato-item"><span className="icon">📅</span><strong>{curso.fechaLimite || "Sin definir"}</strong><p>Vencimiento</p></div>
          <div className="dato-item"><span className="icon">⏱️</span><strong>{curso.duracion || "No especificada"}</strong><p>Duración</p></div>
          <div className="dato-item"><span className="icon">📄</span><strong>Video + Documentos</strong><p>Contenido</p></div>
        </div>

        {/* Progreso */}
        {isEnrolled && (
          <div className="progreso">
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-label">Progreso: {progress}%</span>
          </div>
        )}

        <div className="curso-footer">
          <small>
            Creado por <b>Admin InfoBank</b><br />
            Fecha de creación: {curso.fechaCreacion || "No disponible"}
          </small>

          <div className="botones">
            {isEnrolled ? (
              <>
                <button className="btn-ver">Ver contenido</button>
                <button className="btn-eval" disabled={progress < 100}>Presentar evaluación</button>
                {progress < 100 && (
                  <button className="btn-outline" onClick={handleCompletar}>
                    Marcar como completado (demo)
                  </button>
                )}
              </>
            ) : (
              <button className="btn-ver" onClick={handleInscribirme}>
                Inscribirme
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
