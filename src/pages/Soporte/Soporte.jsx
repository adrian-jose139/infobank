import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import "./Soporte.css";

export default function Soporte() {
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [respuestasEmpleado, setRespuestasEmpleado] = useState({});
  const [mensajesPendientes, setMensajesPendientes] = useState(0);
  const [mensajesRespondidos, setMensajesRespondidos] = useState(0);
  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [uid, setUid] = useState(null);
  const [usuario, setUsuario] = useState(null); // Correo del empleado autenticado
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Empleado autenticado => usuario:", { uid: user.uid, email: user.email });
        setUid(user.uid);
        setUsuario(user.email);
      } else {
        console.log("No hay empleado autenticado");
        setUid(null);
        setUsuario(null);
        setError("Por favor inicia sesión para ver tus mensajes.");
      }
    }, (err) => {
      console.error("Error en onAuthStateChanged:", err);
      setError("Error al verificar autenticación: " + err.message);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) {
      console.log("No hay UID, no se cargan mensajes");
      return;
    }

    console.log("Cargando mensajes para UID:", uid);
    const mensajesQuery = query(
      collection(db, "mensajes"),
      where("userId", "==", uid),
      orderBy("creadoEn", "desc")
    );

    const unsubscribeMensajes = onSnapshot(
      mensajesQuery,
      (snapshot) => {
        const mensajes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Mensajes cargados:", mensajes);
        setMensajesPendientes(mensajes.filter((m) => m.estado === "pendiente").length);
        setMensajesRespondidos(mensajes.filter((m) => m.estado === "respondido").length);
        setPendientes(mensajes.filter((m) => m.estado === "pendiente"));
        setHistorial(mensajes.filter((m) => m.estado === "respondido"));
        setError(null);

        mensajes.forEach((mensaje) => {
          const respuestasQuery = query(
            collection(db, "mensajes_respuestas"),
            where("mensajeId", "==", mensaje.id),
            orderBy("respondidoEn", "asc")
          );
          onSnapshot(
            respuestasQuery,
            (resSnapshot) => {
              const respuestasData = resSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              console.log(`Respuestas para mensaje ${mensaje.id}:`, respuestasData);
              setRespuestas((prev) => ({
                ...prev,
                [mensaje.id]: respuestasData,
              }));
            },
            (err) => {
              console.error(`Error al cargar respuestas para mensaje ${mensaje.id}:`, err);
              setError("Error al cargar respuestas: " + err.message);
            }
          );
        });
      },
      (err) => {
        console.error("Error al cargar mensajes:", err);
        setError("No se pudieron cargar los mensajes: " + err.message);
        Swal.fire("Error", "No se pudieron cargar los mensajes: " + err.message, "error");
      }
    );

    return () => unsubscribeMensajes();
  }, [uid]);

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!asunto || !mensaje) {
      Swal.fire("Campos vacíos", "Por favor completa el asunto y mensaje", "warning");
      return;
    }
    try {
      console.log("Enviando mensaje:", { asunto, mensaje, userId: uid, remitente: usuario, nombre: usuario.split('@')[0] }); // Usamos el nombre como fallback
      await addDoc(collection(db, "mensajes"), {
        asunto,
        contenido: mensaje,
        userId: uid,
        remitente: usuario, // Correo
        nombre: usuario.split('@')[0], // Nombre como fallback (puedes ajustarlo)
        estado: "pendiente",
        creadoEn: serverTimestamp(),
      });
      Swal.fire({
        icon: "success",
        title: "Mensaje enviado correctamente 🎉",
        text: "Nuestro equipo de soporte técnico te responderá pronto.",
        confirmButtonColor: "#16a34a",
      });
      setAsunto("");
      setMensaje("");
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      Swal.fire("Error", "No se pudo enviar el mensaje: " + error.message, "error");
    }
  };

  const handleEnviarRespuesta = async (mensajeId) => {
    const respuestaText = respuestasEmpleado[mensajeId] || "";
    if (!respuestaText) {
      Swal.fire("Campo vacío", "Por favor escribe una respuesta", "warning");
      return;
    }
    try {
      console.log("Enviando respuesta para mensajeId:", mensajeId, { respuestaText, remitente: usuario });
      await addDoc(collection(db, "mensajes_respuestas"), {
        mensajeId,
        respuesta: respuestaText,
        remitente: usuario,
        respondidoPor: usuario,
        respondidoEn: serverTimestamp(),
      });
      await updateDoc(doc(db, "mensajes", mensajeId), {
        estado: "pendiente",
        respondidoPor: usuario,
        respondidoEn: serverTimestamp(),
      });
      Swal.fire({
        icon: "success",
        title: "Respuesta enviada correctamente 🎉",
        confirmButtonColor: "#16a34a",
      });
      setRespuestasEmpleado((prev) => ({ ...prev, [mensajeId]: "" }));
    } catch (error) {
      console.error("Error al enviar respuesta:", error);
      Swal.fire("Error", "No se pudo enviar la respuesta: " + error.message, "error");
    }
  };

  const handleRespuestaChange = (mensajeId, value) => {
    setRespuestasEmpleado((prev) => ({ ...prev, [mensajeId]: value }));
  };

  const marcarLeido = async (mensajeId) => {
    try {
      await updateDoc(doc(db, "mensajes", mensajeId), {
        estado: "respondido",
      });
      Swal.fire({
        icon: "success",
        title: "Mensaje marcado como leído",
        confirmButtonColor: "#16a34a",
      });
    } catch (error) {
      console.error("Error al marcar como leído:", error);
      Swal.fire("Error", "No se pudo marcar como leído: " + error.message, "error");
    }
  };

  const eliminarMensaje = async (mensajeId) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar mensaje?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "mensajes", mensajeId));
        Swal.fire("Eliminado", "El mensaje fue eliminado", "success");
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire("Error", "No se pudo eliminar el mensaje: " + error.message, "error");
      }
    }
  };

  return (
    <div className="soporte-container">
      {error && (
        <div className="error-message" style={{ color: "red", marginBottom: "20px" }}>
          {error}
        </div>
      )}
      <div className="volver-inicio">
        <Link to="/dashboard" className="btn-volver">
          ← Volver al Inicio
        </Link>
      </div>
      <h2>Centro de Soporte</h2>
      <p>Envía tus consultas y chatea con el equipo de soporte técnico</p>
      <div className="soporte-stats">
        <div className="stat-pendiente">
          <h4>Mensajes Pendientes</h4>
          <p>{mensajesPendientes}</p>
        </div>
        <div className="stat-respondido">
          <h4>Mensajes Respondidos</h4>
          <p>{mensajesRespondidos}</p>
        </div>
      </div>
      <form onSubmit={handleEnviarMensaje} className="form-soporte">
        <label>Asunto</label>
        <input
          type="text"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Describe brevemente tu consulta"
        />
        <label>Mensaje</label>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe los detalles de tu consulta o problema..."
        ></textarea>
        <button type="submit" className="btn-enviar">
          Enviar Mensaje
        </button>
      </form>
      <h3>Conversaciones</h3>
      {(pendientes.length > 0 || historial.length > 0) ? (
        <div className="chat-container">
          {[...pendientes, ...historial].map((m) => (
            <div key={m.id} className="chat-thread">
              <div className="chat-header">
                <h4>{m.asunto}</h4>
                <small>Remitente: {m.nombre || m.remitente.split('@')[0]}</small>
                <small>Estado: {m.estado}</small>
              </div>
              <div className="chat-messages">
                <div className="message received"> {/* Mensaje original siempre recibido */}
                  <p><strong>{m.remitente}</strong>: {m.contenido}</p>
                  <small>
                    {m.creadoEn?.toDate?.().toLocaleString() || "Fecha no disponible"}
                  </small>
                </div>
                {(respuestas[m.id] || []).map((resp, index) => (
                  <div key={index} className={`message ${resp.respondidoPor === usuario ? "sent" : "received"}`}>
                    <p><strong>{resp.respondidoPor}</strong>: {resp.respuesta}</p>
                    <small>
                      {resp.respondidoEn?.toDate?.().toLocaleString() || "Fecha no disponible"}
                    </small>
                  </div>
                ))}{(respuestas[m.id] || []).map((resp, index) => {
                  // ← LOGS DE DEPURACIÓN
                  console.log("Respuesta en empleado → respondidoPor:", resp.respondidoPor);
                  console.log("Comparando con usuario actual:", usuario);
                  console.log("¿Es enviado por el empleado? →", resp.respondidoPor === usuario);
                  console.log("Clase asignada →", resp.respondidoPor === usuario ? "sent" : "received");
                  // ← FIN LOGS

                  return (
                    <div key={index} className={`message ${resp.respondidoPor === usuario ? "sent" : "received"}`}>
                      <p><strong>{resp.respondidoPor}</strong>: {resp.respuesta}</p>
                      <small>
                        {resp.respondidoEn?.toDate?.().toLocaleString() || "Fecha no disponible"}
                      </small>
                    </div>
                  );
                })}
              </div>
              <div className="chat-input">
                {respuestas[m.id]?.some(r => r.respondidoPor !== usuario) ? (
                  <p style={{ color: 'gray', fontStyle: 'italic' }}>
                    El administrador ha respondido. No puedes responder nuevamente.
                  </p>
                ) : (
                  <>
                    <textarea
                      value={respuestasEmpleado[m.id] || ""}
                      onChange={(e) => handleRespuestaChange(m.id, e.target.value)}
                      placeholder="Escribe tu respuesta..."
                    ></textarea>
                    <button
                      onClick={() => handleEnviarRespuesta(m.id)}
                      className="btn-enviar"
                    >
                      Enviar
                    </button>
                  </>
                )}
                  </div>
                
                <div className="chat-actions">
                  <button onClick={() => marcarLeido(m.id)} className="btn-leido">
                    Leído
                  </button>
                  <button onClick={() => eliminarMensaje(m.id)} className="btn-eliminar">
                    Eliminar
                  </button>
                </div>
              </div>
          ))}
            </div>
          ) : (
          <p>No tienes conversaciones activas.</p>
          )

      }
        </div>
      );
}