import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

import {
  collection,
  addDoc,
  onSnapshot,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

// ===================== (BLOQUE DE DESCARGA ELIMINADO) =====================

export default function AdminDashboard() {
  const navigate = useNavigate();

  // ===== Tabs
  const [tab, setTab] = useState("cursos");

  // ===== Cursos
  const [cursos, setCursos] = useState([]);
  const [editandoCurso, setEditandoCurso] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracion, setDuracion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [imagen, setImagen] = useState("");
  const [preview, setPreview] = useState("");
  const [cupos, setCupos] = useState("");
  const [archivoEnlace, setArchivoEnlace] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // ===== Usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoApellido, setNuevoApellido] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoArea, setNuevoArea] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nuevoRol, setNuevoRol] = useState("usuario");
  const [registrando, setRegistrando] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordError, setPasswordError] = useState("");

  // ===== Mensajes / Notificaciones
  const [mensajes, setMensajes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [respuestas, setRespuestas] = useState("");
  const [respuestasAdmin, setRespuestasAdmin] = useState({});

  //===== Noticias
  const [tituloNoticia, setTituloNoticia] = useState("");
  const [contenidoNoticia, setContenidoNoticia] = useState("");
  const [noticias, setNoticias] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [autor, setAutor] = useState("");
  const [fechaPublicacion, setFechaPublicacion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [previewNoticia, setPreviewNoticia] = useState("");
  const [editarNoticiaId, setEditarNoticiaId] = useState(null);
  const [editando, setEditando] = useState(false);

  // Categorías predefinidas para el acordeón
  const categoriasBanco = [
    "Corporativas",
    "Productos y Servicios",
    "Educación Financiera",
    "Tecnología e Innovación",
    "Recursos Humanos",
    "Comunicados Urgentes",
    "Eventos y Promociones",
  ];

  const [mostrarAcordeon, setMostrarAcordeon] = useState(false);

  //===== Muro informativo
  const [tituloMuro, setTituloMuro] = useState("");
  const [contenidoMuro, setContenidoMuro] = useState("");
  const [muroInformativo, setMuroInformativo] = useState([]);
  const [editarMuroId, setEditarMuroId] = useState(null);
  const [editandoMuro, setEditandoMuro] = useState(false);
  const [visualMuro, setVisualMuro] = useState("lista");
  const [categoriaMuro, setCategoriaMuro] = useState("");
  const [mostrarAcordeonMuro, setMostrarAcordeonMuro] = useState(false);
  const [imagenurl, setImagenurl] = useState("");

  const categoriasMuro = [
    "Anuncios Generales",
    "Eventos Internos",
    "Actualizaciones Operativas",
    "Reconocimientos y Logros",
    "Salud y Bienestar",
    "Capacitaciones y Desarrollo",
  ];

  // ===== Listeners
  useEffect(() => {
    const unsubNoticias = onSnapshot(
      query(collection(db, "noticias"), orderBy("fechaPublicacion", "desc")),
      (snap) => {
        setNoticias(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubMuroInformativo = onSnapshot(collection(db, "muro"), (snap) => {
      setMuroInformativo(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubNoticias();
      unsubMuroInformativo();
    };
  }, []);

  useEffect(() => {
    const unsubCursos = onSnapshot(collection(db, "cursos"), (snap) => {
      setCursos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snap) => {
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const mensajesQuery = query(
      collection(db, "mensajes"),
      orderBy("creadoEn", "desc")
    );

    const unsubscribeMensajes = onSnapshot(mensajesQuery, (snapshot) => {
      const mensajesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMensajes(mensajesData);

      mensajesData.forEach((mensaje) => {
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
            setRespuestas((prev) => ({
              ...prev,
              [mensaje.id]: respuestasData,
            }));
          },
          (err) => {
            console.error(`Error al cargar respuestas para mensaje ${mensaje.id}:`, err);
          }
        );
      });
    });

    const unsubMensajes = onSnapshot(
      query(collection(db, "mensajes"), orderBy("creadoEn", "desc")),
      (snap) => setMensajes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubNotis = onSnapshot(
      query(collection(db, "notificaciones"), orderBy("creadoEn", "desc")),
      (snap) => setNotificaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubCursos();
      unsubUsuarios();
      unsubMensajes();
      unsubNotis();
    };
  }, []);

  // ===== Stats
  const usuariosActivos = usuarios.filter((u) => u.estado === "Activo").length;
  const mensajesPendientes = mensajes.filter((m) => m.estado === "pendiente").length;
  const notificacionesNuevas = notificaciones.filter((n) => !n.leida).length;
  const noticiasPublicadas = noticias.length;
  const muroInformativoPublicados = muroInformativo.length;

  // Publicar noticia
  const publicarNoticia = async () => {
    if (!tituloNoticia || !contenidoNoticia) {
      Swal.fire("Campos incompletos", "Ingresa título y contenido", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "noticias"), {
        titulo: tituloNoticia,
        descripcion: contenidoNoticia,
        imagen: imagenUrl || "",
        categoria: categoria || "General",
        autor: autor || "Administrador",
        fechaPublicacion: fechaPublicacion ? new Date(fechaPublicacion) : serverTimestamp(),
        creadaEn: serverTimestamp(),
      });

      Swal.fire("Publicado", "La noticia se publicó correctamente", "success");
      limpiarFormulario();
    } catch (error) {
      console.error("Error al publicar noticia:", error);
      Swal.fire("Error", "No se pudo publicar la noticia", "error");
    }
  };

  // Editar noticia
  const editarNoticia = (n) => {
    setEditando(true);
    setEditarNoticiaId(n.id);
    setTituloNoticia(n.titulo || "");
    setContenidoNoticia(n.descripcion || n.contenido || "");
    setImagenUrl(n.imagen || "");
    setPreviewNoticia(n.imagen || "");
    setCategoria(n.categoria || "");
    setAutor(n.autor || "Administrador");
    setFechaPublicacion(
      n.fechaPublicacion?.toDate
        ? n.fechaPublicacion.toDate().toISOString().split("T")[0]
        : ""
    );
  };

  // Actualizar noticia
  const actualizarNoticia = async () => {
    if (!editarNoticiaId) return;

    if (!tituloNoticia || !contenidoNoticia) {
      Swal.fire("Campos incompletos", "Ingresa título y contenido", "warning");
      return;
    }

    try {
      await updateDoc(doc(db, "noticias", editarNoticiaId), {
        titulo: tituloNoticia,
        descripcion: contenidoNoticia,
        imagen: imagenUrl || "",
        categoria: categoria || "General",
        autor: autor || "Administrador",
        fechaPublicacion: fechaPublicacion ? new Date(fechaPublicacion) : serverTimestamp(),
      });

      Swal.fire("Actualizada", "La noticia fue actualizada correctamente", "success");
      limpiarFormulario();
    } catch (error) {
      console.error("Error al actualizar noticia:", error);
      Swal.fire("Error", "No se pudo actualizar la noticia", "error");
    }
  };

  // Eliminar noticia
  const eliminarNoticia = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar noticia?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "noticias", id));
        Swal.fire("Eliminada", "La noticia fue eliminada", "success");
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire("Error", "No se pudo eliminar la noticia", "error");
      }
    }
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setTituloNoticia("");
    setContenidoNoticia("");
    setImagenUrl("");
    setPreviewNoticia("");
    setCategoria("");
    setAutor("");
    setFechaPublicacion("");
    setEditando(false);
    setEditarNoticiaId(null);
    setMostrarAcordeon(false);
  };

  const cancelarEdicion = () => limpiarFormulario();

  // Publicar mensaje en muro
  const publicarMuroInformativo = async () => {
    if (!tituloMuro || !contenidoMuro) {
      Swal.fire("Campos incompletos", "Ingresa título y contenido", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "muro"), {
        titulo: tituloMuro,
        descripcion: contenidoMuro,
        categoria: categoriaMuro || "Anuncios Generales",
        fecha: serverTimestamp(),
        autorNombre: auth.currentUser?.displayName || "Administrador",
        autorRol: "Administrador",
        imagenurl: imagenurl || "",
      });

      Swal.fire("Publicado", "El mensaje se publicó correctamente", "success");
      limpiarFormularioMuro();
    } catch (error) {
      console.error("Error al publicar mensaje:", error);
      Swal.fire("Error", "No se pudo publicar el mensaje", "error");
    }
  };

  // Editar mensaje
  const editarMuroInformativo = (m) => {
    setEditandoMuro(true);
    setEditarMuroId(m.id);
    setTituloMuro(m.titulo);
    setContenidoMuro(m.descripcion);
    setVisualMuro("formulario");
    setCategoriaMuro(m.categoria || "Anuncios Generales");
    setImagenurl(m.imagenurl || "");
  };

  // Actualizar mensaje
  const actualizarMuroInformativo = async () => {
    if (!editarMuroId) return;

    if (!tituloMuro || !contenidoMuro || !categoriaMuro) {
      Swal.fire("Campos incompletos", "Ingresa título, contenido y categoría", "warning");
      return;
    }

    try {
      await updateDoc(doc(db, "muro", editarMuroId), {
        titulo: tituloMuro,
        descripcion: contenidoMuro,
        categoria: categoriaMuro || "Anuncios Generales",
        fechaActualizada: serverTimestamp(),
        autorNombre: auth.currentUser?.displayName || "Administrador",
        autorRol: "Administrador",
        imagenurl: imagenurl || "",
      });

      Swal.fire("Actualizado", "El mensaje fue actualizado correctamente", "success");
      limpiarFormularioMuro();
    } catch (error) {
      console.error("Error al actualizar mensaje:", error);
      Swal.fire("Error", "No se pudo actualizar el mensaje", "error");
    }
  };

  // Eliminar mensaje
  const eliminarMuroInformativo = async (id) => {
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
        await deleteDoc(doc(db, "muro", id));
        Swal.fire("Eliminado", "El mensaje fue eliminado", "success");
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire("Error", "No se pudo eliminar el mensaje", "error");
      }
    }
  };

  // Limpiar formulario
  const limpiarFormularioMuro = () => {
    setTituloMuro("");
    setContenidoMuro("");
    setEditandoMuro(false);
    setEditarMuroId(null);
    setVisualMuro("lista");
    setCategoriaMuro("");
    setMostrarAcordeonMuro(false);
    setImagenurl("");
  };

  // ===== Cursos CRUD
  const handleGuardarCurso = async (e) => {
    e.preventDefault();
    if (!nombre || !descripcion || !duracion || !fechaLimite || !cupos) {
      return Swal.fire("Campos incompletos", "Completa todos los campos.", "warning");
    }

    try {
      const payload = {
        nombre,
        descripcion,
        duracion,
        fechaLimite,
        imagen,
        archivoEnlace: archivoEnlace ? archivoEnlace.trim() : "",
        videoUrl: videoUrl ? videoUrl.trim() : "",
        cupos: Number(cupos),
      };

      if (editandoCurso) {
        await updateDoc(doc(db, "cursos", editandoCurso.id), payload);
        Swal.fire("Actualizado", "Curso actualizado", "success");
      } else {
        await addDoc(collection(db, "cursos"), {
          ...payload,
          inscritos: 0,
          createdAt: serverTimestamp(),
        });
        Swal.fire("Agregado", "Curso creado", "success");
      }
      limpiarFormularioCurso();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo guardar el curso", "error");
    }
  };

  const handleEditarCurso = (c) => {
    setEditandoCurso(c);
    setNombre(c.nombre);
    setDescripcion(c.descripcion);
    setDuracion(c.duracion);
    setFechaLimite(c.fechaLimite);
    setImagen(c.imagen || "");
    setPreview(c.imagen || "");
    setCupos(c.cupos || "");
    setArchivoEnlace(c.archivoEnlace || "");
    setVideoUrl(c.videoUrl || "");
  };

  const handleEliminarCurso = async (id) => {
    const ok = await Swal.fire({ title: "¿Eliminar curso?", icon: "warning", showCancelButton: true });
    if (!ok.isConfirmed) return;
    await deleteDoc(doc(db, "cursos", id));
    Swal.fire("Eliminado", "", "success");
  };

  const limpiarFormularioCurso = () => {
    setEditandoCurso(null);
    setNombre("");
    setDescripcion("");
    setDuracion("");
    setFechaLimite("");
    setImagen("");
    setCupos("");
    setPreview("");
    setArchivoEnlace("");
    setVideoUrl("");
  };

  const handlePreview = (e) => {
    setImagen(e.target.value);
    setPreview(e.target.value);
  };

  // ===== Usuarios CRUD
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*_\-+=]/.test(password);

    if (!minLength) return "La contraseña debe tener al menos 8 caracteres";
    if (!hasUpperCase) return "La contraseña debe contener al menos una mayúscula";
    if (!hasLowerCase) return "La contraseña debe contener al menos una minúscula";
    if (!hasNumber) return "La contraseña debe contener al menos un número";
    if (!hasSpecialChar) return "La contraseña debe contener al menos un carácter especial (!@#$%^&*_-+=)";
    return "";
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNuevoPassword(password);
    const error = validatePassword(password);
    setPasswordError(error);
  };

  const handleRegistrarUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoApellido || !nuevoEmail || !nuevoArea || !nuevoPassword || !confirmPassword) {
      return Swal.fire("Campos incompletos", "Completa todos los campos", "warning");
    }

    const passwordValidation = validatePassword(nuevoPassword);
    if (passwordValidation) {
      return Swal.fire("Contraseña inválida", passwordValidation, "warning");
    }
    if (nuevoPassword !== confirmPassword) {
      return Swal.fire("No coinciden", "Las contraseñas no coinciden", "warning");
    }

    try {
      setRegistrando(true);
      const cred = await createUserWithEmailAndPassword(auth, nuevoEmail, nuevoPassword);
      const user = cred.user;
      await setDoc(doc(db, "usuarios", user.uid), {
        nombre: nuevoNombre,
        apellido: nuevoApellido,
        email: nuevoEmail,
        areaTrabajo: nuevoArea,
        rol: nuevoRol,
        estado: "Activo",
        cursosInscritos: 0,
        ultimoAcceso: null,
        createdAt: serverTimestamp(),
      });
      try {
        await sendEmailVerification(user);
      } catch { }
      Swal.fire("Usuario creado", "", "success");
      setNuevoNombre("");
      setNuevoApellido("");
      setNuevoEmail("");
      setNuevoArea("");
      setNuevoPassword("");
      setConfirmPassword("");
      setNuevoRol("usuario");
      setPasswordError("");
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo registrar", "error");
    } finally {
      setRegistrando(false);
    }
  };

  const handleToggleBloqueo = async (u) => {
    const nuevo = u.estado === "Bloqueado" ? "Activo" : "Bloqueado";
    await updateDoc(doc(db, "usuarios", u.id), { estado: nuevo });
  };

  const handleEliminarUsuario = async (u) => {
    const ok = await Swal.fire({ title: `¿Eliminar a ${u.nombre}?`, icon: "warning", showCancelButton: true });
    if (!ok.isConfirmed) return;
    await deleteDoc(doc(db, "usuarios", u.id));
    Swal.fire("Eliminado", "", "success");
  };

  const startEditUser = (u) => setEditingUser({ ...u });
  const handleEditChange = (e) => setEditingUser({ [e.target.name]: e.target.value });

  const saveEditUser = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "usuarios", editingUser.id), {
      nombre: editingUser.nombre,
      apellido: editingUser.apellido || "",
      email: editingUser.email,
      areaTrabajo: editingUser.areaTrabajo || "",
      rol: editingUser.rol,
      estado: editingUser.estado,
    });
    setEditingUser(null);
    Swal.fire("Actualizado", "", "success");
  };

  // Responder mensaje
  const responderMensaje = async (mensajeId, texto) => {
    if (!texto) {
      Swal.fire("Campo vacío", "Por favor escribe una respuesta", "warning");
      return;
    }

    try {
      const adminEmail = auth.currentUser?.email || "admin";
      await addDoc(collection(db, "mensajes_respuestas"), {
        mensajeId,
        respuesta: texto,
        remitente: adminEmail,
        respondidoPor: adminEmail,
        respondidoEn: serverTimestamp(),
      });

      await updateDoc(doc(db, "mensajes", mensajeId), {
        estado: "respondido",
        respondidoPor: adminEmail,
        respondidoEn: serverTimestamp(),
      });
      setRespuestasAdmin((prev) => ({ ...prev, [mensajeId]: "" }));
      Swal.fire({
        icon: "success",
        title: "Respuesta enviada",
        showConfirmButtonColor: "#16a34a",
        timer: 1500,
      });
    } catch (error) {
      console.error("Error al enviar respuesta:", error);
      Swal.fire("Error", "No se pudo enviar la respuesta", "error");
    }
  };

  const handleRespuestaChangeAdmin = (mensajeId, value) => {
    setRespuestasAdmin((prev) => ({ ...prev, [mensajeId]: value }));
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
      Swal.fire("Error", "No se pudo marcar como leído", "error");
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
        Swal.fire("Error", "No se pudo eliminar el mensaje", "error");
      }
    }
  };

  // Notificaciones
  const marcarNotiLeida = async (n) => {
    await updateDoc(doc(db, "notificaciones", n.id), { leida: true });
  };

  const crearNotiDemo = async () => {
    await addDoc(collection(db, "notificaciones"), {
      titulo: "Nueva inscripción",
      descripcion: "Un usuario se inscribió a un curso.",
      tipo: "curso",
      leida: false,
      creadoEn: serverTimestamp(),
    });
    Swal.fire("Notificación creada (demo)", "", "success");
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="admin">
      {/* HEADER */}
      <header className="admin__header" style={{ borderBottom: "3px solid #ef4444", paddingBottom: 8 }}>
        <h1>Panel de Administración</h1>
        <button className="btn btn--logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      {/* STATS */}
<section className="stats">
  {/* Usuarios */}
  <div className="stat stat--blue">
    <div className="stat__icon">
      👥
    </div>
    <div>
      <h3>Total Usuarios</h3>
      <p className="stat__value">{usuarios.length}</p>
      <span>{usuariosActivos} activos</span>
    </div>
  </div>

  {/* Cursos */}
  <div className="stat stat--green">
    <div className="stat__icon">
      📘
    </div>
    <div>
      <h3>Total Cursos</h3>
      <p className="stat__value">{cursos.length}</p>
      <span>Registrados en el sistema</span>
    </div>
  </div>

  {/* Mensajes */}
  <div className="stat stat--purple">
    <div className="stat__icon">
      📨
    </div>
    <div>
      <h3>Mensajes</h3>
      <p className="stat__value">{mensajes.length}</p>
      <span>Pendientes: {mensajesPendientes}</span>
    </div>
  </div>

  {/* Notificaciones */}
  <div className="stat stat--orange">
    <div className="stat__icon">
      🔔
    </div>
    <div>
      <h3>Notificaciones</h3>
      <p className="stat__value">{notificaciones.length}</p>
      <span>Nuevas: {notificacionesNuevas}</span>
    </div>
  </div>

  {/* Noticias */}
  <div className="stat stat--red">
    <div className="stat__icon">
      📰
    </div>
    <div>
      <h3>Noticias</h3>
      <p className="stat__value">{noticias.length}</p>
      <span>Publicadas</span>
    </div>
  </div>

  {/* Muro Informativo */}
  <div className="stat stat--teal">
    <div className="stat__icon">
      📋
    </div>
    <div>
      <h3>Muro Informativo</h3>
      <p className="stat__value">{muroInformativo.length}</p>
      <span>Mensajes publicados</span>
    </div>
  </div>
</section>

      {/* TABS */}
      <div className="tab-bar">
        <button className={`tab-btn ${tab === "cursos" ? "active" : ""}`} onClick={() => setTab("cursos")}>
          Gestión de Cursos
        </button>
        <button className={`tab-btn ${tab === "usuarios" ? "active" : ""}`} onClick={() => setTab("usuarios")}>
          Gestión de Usuarios
        </button>
        <button className={`tab-btn ${tab === "mensajes" ? "active" : ""}`} onClick={() => setTab("mensajes")}>
          Mensajería {mensajesPendientes > 0 && <span className="badge--count">{mensajesPendientes}</span>}
        </button>
        <button className={`tab-btn ${tab === "notis" ? "active" : ""}`} onClick={() => setTab("notis")}>
          Notificaciones {notificacionesNuevas > 0 && <span className="badge--count">{notificacionesNuevas}</span>}
        </button>
        <button className={`tab-btn ${tab === "noticias" ? "active" : ""}`} onClick={() => setTab("noticias")}>
          Noticias
        </button>
        <button className={`tab-btn ${tab === "muro" ? "active" : ""}`} onClick={() => setTab("muro")}>
          Muro Informativo
        </button>
      </div>

      {/* CONTENT */}
      <div className="tab-content">
        {/* ===== CURSOS ===== */}
        {tab === "cursos" && (
          <section className="courses">
            <div className="courses__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Cursos</h2>
              <button
                className="btn btn--add"
                onClick={() => document.getElementById("form-curso").scrollIntoView({ behavior: "smooth" })}
              >
                Agregar Curso
              </button>
            </div>

            <div className="course-list">
              {cursos.map((c) => (
                <div key={c.id} className="course-card">
                  <div>
                    <h3>{c.nombre}</h3>
                    <p>{c.descripcion}</p>
                    <small>Duración: {c.duracion}</small><br />
                    <small>Fecha Límite: {c.fechaLimite}</small><br />
                    <small>Cupos: {c.cupos}</small><br />
                  </div>
                  <div className="course-actions">
                    <button onClick={() => handleEditarCurso(c)}>Editar</button>
                    <button onClick={() => handleEliminarCurso(c.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>

            <section className="add-course" id="form-curso">
              <h2>{editandoCurso ? "Editar curso" : "Agregar nuevo curso"}</h2>
              <form onSubmit={handleGuardarCurso} className="form">
                <input type="text" placeholder="Nombre del curso" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                <textarea placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                <input type="text" placeholder="Duración" value={duracion} onChange={(e) => setDuracion(e.target.value)} />
                <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
                <input type="text" placeholder="URL de imagen" value={imagen} onChange={handlePreview} />
                {preview && <img src={preview} alt="Vista previa" style={{ width: 200, borderRadius: 8, marginTop: 10 }} />}
                <input type="text" placeholder="Enlace del archivo (opcional)" value={archivoEnlace} onChange={(e) => setArchivoEnlace(e.target.value)} />
                <input type="text" placeholder="URL del video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required />
                <input type="number" placeholder="Cupos disponibles" value={cupos} onChange={(e) => setCupos(e.target.value)} min="1" />
                <div className="form-actions">
                  <button type="submit" className="btn btn--save">
                    {editandoCurso ? "Actualizar curso" : "Guardar curso"}
                  </button>
                  {editandoCurso && (
                    <button type="button" className="btn btn--cancel" onClick={limpiarFormularioCurso}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </section>
          </section>
        )}

        {/* ===== USUARIOS ===== */}
        {tab === "usuarios" && (
          <section className="users">
            <h2>Gestión de Usuarios</h2>

            <form onSubmit={handleRegistrarUsuario} className="register-card">
              <div className="register-head">
                <h3>Registro de Empleado</h3>
                <p className="reg-subtitle">Completa tu información para crear tu cuenta</p>
              </div>
              <div className="form-row two">
                <div className="field">
                  <label>Nombre</label>
                  <div className="input-with-icon">
                    <span className="icon">👤</span>
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Apellido</label>
                  <div className="input-with-icon">
                    <span className="icon">👤</span>
                    <input
                      type="text"
                      placeholder="Tu apellido"
                      value={nuevoApellido}
                      onChange={(e) => setNuevoApellido(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="field">
                <label>Correo Electrónico</label>
                <div className="input-with-icon">
                  <span className="icon">✉️</span>
                  <input
                    type="email"
                    placeholder="tu.email@infobank.com"
                    value={nuevoEmail}
                    onChange={(e) => setNuevoEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label>Área de Trabajo</label>
                <div className="input-with-icon">
                  <span className="icon">🏢</span>
                  <select
                    value={nuevoArea}
                    onChange={(e) => setNuevoArea(e.target.value)}
                    required
                  >
                    <option value="">Selecciona tu área</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Atención al Cliente">Atención al Cliente</option>
                    <option value="Finanzas">Finanzas</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Rol</label>
                <div className="input-with-icon">
                  <span className="icon">🔑</span>
                  <select
                    value={nuevoRol}
                    onChange={(e) => setNuevoRol(e.target.value)}
                    required
                  >
                    <option value="usuario">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Contraseña</label>
                <div className="input-with-icon">
                  <span className="icon">🔒</span>
                  <input
                    type="password"
                    placeholder="Mínimo 8 caracteres, Mayús, núm, especial"
                    value={nuevoPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label>Confirmar Contraseña</label>
                <div className="input-with-icon">
                  <span className="icon">🔒</span>
                  <input
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="helper">
                Contraseña: 8+ caracteres, mayúscula, minúscula, número, especial (!@#$%^&*_-+=).
              </p>
              {passwordError && <p className="error" style={{ color: 'red', marginTop: '5px' }}>{passwordError}</p>}
              <button
                type="submit"
                className="btn btn--primary"
                disabled={registrando || passwordError}
              >
                {registrando ? "Creando…" : "Crear Cuenta"}
              </button>
            </form>

            {editingUser && (
              <div className="modal-backdrop">
                <form onSubmit={saveEditUser} className="user-form modal-content">
                  <h3>✏ Editar usuario</h3>
                  <label>Nombre</label>
                  <input
                    name="nombre"
                    type="text"
                    value={editingUser.nombre || ""}
                    onChange={handleEditChange}
                    required
                  />
                  <label>Apellido</label>
                  <input
                    name="apellido"
                    type="text"
                    value={editingUser.apellido || ""}
                    onChange={handleEditChange}
                    required
                  />
                  <label>Email</label>
                  <input
                    name="email"
                    type="email"
                    value={editingUser.email || ""}
                    onChange={handleEditChange}
                    required
                  />
                  <label>Área de Trabajo</label>
                  <input
                    name="areaTrabajo"
                    type="text"
                    value={editingUser.areaTrabajo || ""}
                    onChange={handleEditChange}
                    required
                  />
                  <label>Rol</label>
                  <select
                    name="rol"
                    value={editingUser.rol || "usuario"}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="usuario">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <label>Estado</label>
                  <select
                    name="estado"
                    value={editingUser.estado || "Activo"}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="Activo">Activo</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                  <div className="form-actions">
                    <button type="submit" className="btn btn--save">Guardar cambios</button>
                    <button
                      type="button"
                      className="btn btn--cancel"
                      onClick={() => setEditingUser(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="user-list">
              {usuarios.map((u) => (
                <div key={u.id} className="user-card">
                  <div>
                    <h3>{u.nombre} {u.apellido}</h3>
                    <p>{u.email}</p>
                    {u.areaTrabajo && <p>Área: {u.areaTrabajo}</p>}
                    <span className="badge">{u.estado || "Activo"}</span>
                    <p>Rol: {u.rol}</p>
                  </div>
                  <div className="user-actions">
                    <button className="btn btn--edit" onClick={() => startEditUser(u)}>✏️ Editar</button>
                    <button className="btn btn--block" onClick={() => handleToggleBloqueo(u)}>
                      {u.estado === "Bloqueado" ? "🔓 Desbloquear" : "🚫 Bloquear"}
                    </button>
                    <button className="btn btn--delete" onClick={() => handleEliminarUsuario(u)}>🗑️ Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== MENSAJERÍA ===== */}
        {tab === "mensajes" && (
          <section className="users">
            <div className="courses__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Mensajería</h2>
            </div>

            {mensajes.length === 0 && <p>No hay mensajes.</p>}

            {mensajes.map((m) => (
              <div key={m.id} className="chat-thread">
                <div className="chat-header">
                  <h4>{m.asunto}</h4>
                  <small>Remitente: {m.remitente}</small>
                  <br />
                  <small>Estado: {m.estado}</small>
                </div>
                <div className="chat-messages">
                  <div className="message received">
                    <p><strong>{m.remitente}:</strong> {m.contenido}</p>
                    <small>
                      {m.creadoEn?.toDate?.().toLocaleString() || "Fecha no disponible"}
                    </small>
                  </div>
                  {(respuestas[m.id] || []).map((resp, index) => {
                    const adminEmail = auth.currentUser?.email;
                    // ← LOGS DE DEPURACIÓN
                    console.log("Respuesta en admin → respondidoPor:", resp.respondidoPor);
                    console.log("Comparando con admin actual:", adminEmail);
                    console.log("¿Es enviado por el admin? →", resp.respondidoPor === adminEmail);
                    console.log("Clase asignada →", resp.respondidoPor === adminEmail ? "sent" : "received");
                    // ← FIN LOGS

                    return (
                      <div key={index} className={`message ${resp.respondidoPor === adminEmail ? "sent" : "received"}`}>
                        <p><strong>{resp.respondidoPor}</strong>: {resp.respuesta}</p>
                        <small>
                          {resp.respondidoEn?.toDate?.().toLocaleString() || "Fecha no disponible"}
                        </small>
                      </div>
                    );
                  })}
                </div>
                <div className="chat-input">
                  <textarea
                    value={respuestasAdmin[m.id] || ""}
                    onChange={(e) => handleRespuestaChangeAdmin(m.id, e.target.value)}
                    placeholder="Escribe tu respuesta..."
                  ></textarea>
                  <button
                    onClick={() => responderMensaje(m.id, respuestasAdmin[m.id])}
                    className="btn-enviar"
                  >
                    Enviar
                  </button>
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
          </section>
        )}

        {/* ===== NOTICIAS ===== */}
        {tab === "noticias" && (
          <section className="users">
            <div
              className="courses__header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>Gestión de Noticias</h2>
            </div>

            {/* FORMULARIO DE PUBLICACIÓN / EDICIÓN */}
            <div className="add-course">
              <h2>{editarNoticiaId ? "✏️ Editar noticia" : "➕ Publicar nueva noticia"}</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editarNoticiaId) {
                    actualizarNoticia();
                  } else {
                    publicarNoticia();
                  }
                }}
                className="form"
              >
                <input
                  type="text"
                  placeholder="Título de la noticia"
                  value={tituloNoticia}
                  onChange={(e) => setTituloNoticia(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Contenido de la noticia"
                  value={contenidoNoticia}
                  onChange={(e) => setContenidoNoticia(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="URL de imagen (opcional)"
                  value={imagenUrl}
                  onChange={(e) => {
                    setImagenUrl(e.target.value);
                    setPreviewNoticia(e.target.value);
                  }}
                />

                {previewNoticia && (
                  <img
                    src={previewNoticia}
                    alt="Vista previa"
                    style={{
                      width: 250,
                      borderRadius: 8,
                      marginTop: 10,
                      border: "1px solid #ccc",
                    }}
                    onError={(e) =>
                    (e.target.src =
                      "https://via.placeholder.com/250x150?text=No+disponible")
                    }
                  />
                )}

                {/* 🔽 Selector de Categoría con Acordeón */}
                <div className="categoria-selector" style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Seleccionar categoría"
                    value={categoria}
                    readOnly
                    onClick={() => setMostrarAcordeon(!mostrarAcordeon)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                      padding: "8px",
                      borderRadius: "6px",
                      width: "100%",
                    }}
                  />

                  {mostrarAcordeon && (
                    <div
                      className="acordeon-categorias"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "#f9f9f9",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        maxHeight: "200px",
                        overflowY: "auto",
                        marginTop: "4px",
                      }}
                    >
                      {categoriasBanco.map((cat, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setCategoria(cat);
                            setMostrarAcordeon(false);
                          }}
                          style={{
                            padding: "10px",
                            cursor: "pointer",
                            borderBottom: "1px solid #eee",
                            backgroundColor: categoria === cat ? "#e0f7fa" : "transparent",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f0f0f0")
                          }
                          onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            categoria === cat ? "#e0f7fa" : "transparent")
                          }
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Autor"
                  value={autor || "Administrador"}
                  readOnly
                  style={{
                    backgroundColor: "#f3f3f3",
                    border: "1px solid #ccc",
                    padding: "8px",
                    borderRadius: "6px",
                    width: "100%",
                    color: "#555",
                  }}
                />
                <input
                  type="date"
                  value={fechaPublicacion}
                  onChange={(e) => setFechaPublicacion(e.target.value)}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" className="btn btn--save">
                    {editarNoticiaId ? "Actualizar Noticia" : "Publicar Noticia"}
                  </button>

                  {editarNoticiaId && (
                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      className="btn btn--cancel"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* LISTADO DE NOTICIAS */}
            <div className="news-list">
              {noticias.length === 0 ? (
                <p className="text-center text-gray-500 mt-4">
                  No hay noticias publicadas.
                </p>
              ) : (
                noticias.map((n) => {
                  const imagenSrc =
                    n.imagen && n.imagen.startsWith("http")
                      ? n.imagen
                      : "https://via.placeholder.com/300x200?text=Sin+imagen";

                  return (
                    <div key={n.id} className="course-card">
                      <div className="news-image-container">
                        <img
                          src={imagenSrc}
                          alt={n.titulo}
                          className="news-image"
                          onError={(e) =>
                          (e.target.src =
                            "https://via.placeholder.com/300x200?text=No+disponible")
                          }
                        />
                      </div>

                      <div className="news-info">
                        <h3 className="news-title">{n.titulo}</h3>
                        <span className="news-tag">{n.categoria || "General"}</span>
                        <p className="news-description">{n.descripcion}</p>

                        <div className="news-meta">
                          <span className="news-date">
                            📅{" "}
                            {n.fechaPublicacion?.toDate?.().toLocaleDateString?.(
                              "es-ES",
                              { year: "numeric", month: "2-digit", day: "2-digit" }
                            ) || "—"}
                          </span>
                          <span className="news-author">
                            👤 {n.autor || "Administrador"}
                          </span>
                        </div>

                        <div className="news-actions">
                          <button
                            className="btn btn--edit"
                            onClick={() => editarNoticia(n)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn btn--delete"
                            onClick={() => eliminarNoticia(n.id)}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ===== MURO INFORMATIVO ===== */}
        {tab === "muro" && (
          <section className="users" aria-labelledby="muro-heading">
            <div
              className="courses__header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 0",
              }}
            >
              <h2 id="muro-heading">Gestión del Muro Informativo</h2>
              <button
                className="btn btn--add"
                onClick={() => {
                  limpiarFormularioMuro();
                  setVisualMuro("formulario");
                }}
              >
                ➕ Nuevo Mensaje
              </button>
            </div>

            {/* ===== Formulario para crear/editar mensajes ===== */}
            {visualMuro === "formulario" && (
              <div className="add-course">
                <h3>{editandoMuro ? "✏️ Editar mensaje" : "➕ Publicar nuevo mensaje"}</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (editandoMuro) {
                      await actualizarMuroInformativo();
                    } else {
                      await publicarMuroInformativo();
                    }
                  }}
                  className="form"
                >
                  <div className="form-group">
                    <label htmlFor="titulo-muro">Título del mensaje</label>
                    <input
                      id="titulo-muro"
                      type="text"
                      placeholder="Título del mensaje"
                      value={tituloMuro}
                      onChange={(e) => setTituloMuro(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contenido-muro">Contenido del mensaje</label>
                    <textarea
                      id="contenido-muro"
                      placeholder="Contenido del mensaje"
                      value={contenidoMuro}
                      onChange={(e) => setContenidoMuro(e.target.value)}
                      rows="5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="categoria-muro">Categoría</label>
                    <div className="categoria-selector" style={{ position: "relative" }}>
                      <input
                        id="categoria-muro"
                        type="text"
                        placeholder="Seleccionar categoría"
                        value={categoriaMuro}
                        readOnly
                        onClick={() => setMostrarAcordeonMuro(!mostrarAcordeonMuro)}
                        style={{
                          cursor: "pointer",
                          backgroundColor: "#fff",
                          border: "1px solid #ccc",
                          padding: "8px",
                          borderRadius: "6px",
                          width: "100%",
                        }}
                      />
                      {mostrarAcordeonMuro && (
                        <div
                          className="acordeon-categorias"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "#f9f9f9",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                            zIndex: 1000,
                            maxHeight: "200px",
                            overflowY: "auto",
                            marginTop: "4px",
                          }}
                        >
                          {categoriasMuro.map((cat, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setCategoriaMuro(cat);
                                setMostrarAcordeonMuro(false);
                              }}
                              style={{
                                padding: "10px",
                                cursor: "pointer",
                                borderBottom: "1px solid #eee",
                                backgroundColor: categoriaMuro === cat ? "#e0f7fa" : "transparent",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                              onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                categoriaMuro === cat ? "#e0f7fa" : "transparent")
                              }
                            >
                              {cat}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="imagen-muro">URL del Ícono (ingresar URL)</label>
                    <input
                      id="imagen-muro"
                      type="text"
                      placeholder="Pega aquí la URL de la imagen (ej. https://example.com/imagen.jpg)"
                      value={imagenurl || ""}
                      onChange={(e) => setImagenurl(e.target.value)}
                    />
                    {imagenurl && (
                      <img
                        src={imagenurl}
                        alt="Vista previa del ícono"
                        style={{ width: "50px", height: "50px", marginTop: "10px", borderRadius: "50%" }}
                        onError={(e) => console.log("Error al cargar la URL de la imagen:", e)}
                      />
                    )}
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn--save">
                      {editandoMuro ? "Actualizar Mensaje" : "Publicar Mensaje"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--cancel"
                      onClick={limpiarFormularioMuro}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ===== Lista de mensajes publicados ===== */}
            {visualMuro === "lista" && (
              <div className="course-list">
                {muroInformativo.length === 0 ? (
                  <p className="text-center text-gray-500 mt-4">
                    No hay mensajes publicados.
                  </p>
                ) : (
                  muroInformativo.map((m) => (
                    <div key={m.id} className="course-card">
                      <div className="news-info">
                        <h3>{m.titulo}</h3>
                        <span className="news-tag">{m.categoria || "General"}</span>
                        <p>{m.descripcion}</p>
                        <small>
                          Publicado el:{" "}
                          {m.fecha?.toDate?.().toLocaleDateString?.("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) || "Fecha no disponible"}

                          {m.fechaActualizada && (
                            <>
                              <br />
                              {" · Actualizado el: "}
                              {m.fechaActualizada?.toDate?.().toLocaleDateString?.("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }) || "—"}
                            </>
                          )}
                        </small>
                      </div>
                      <div className="news-actions">
                        <button
                          className="btn btn--edit"
                          onClick={() => editarMuroInformativo(m)}
                          aria-label={`Editar mensaje ${m.titulo}`}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn--delete"
                          onClick={() => eliminarMuroInformativo(m.id)}
                          aria-label={`Eliminar mensaje ${m.titulo}`}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}