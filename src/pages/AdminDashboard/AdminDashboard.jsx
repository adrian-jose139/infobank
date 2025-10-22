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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ===================== Helpers =====================

// URL válida http/https
const isValidUrl = (str) => {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

// Dominios permitidos (ajusta a tus necesidades)
const allowedDomains = [
  "drive.google.com",
  "docs.google.com",
  "onedrive.live.com",
  "1drv.ms",
  "dropbox.com",
  "www.dropbox.com",
];
const isAllowedDomain = (str) => {
  try {
    const { hostname } = new URL(str);
    return allowedDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

/**
 * Genera URL de vista y de descarga según proveedor (Drive, Dropbox, OneDrive).
 * Para otros dominios, devuelve la misma URL como fallback.
 */
const getViewAndDownload = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname;

    // ===== Google Drive =====
    // /file/d/ID/view  o  ?id=ID
    if (host.includes("drive.google.com")) {
      let fileId = null;

      if (u.pathname.includes("/file/d/")) {
        fileId = u.pathname.split("/file/d/")[1]?.split("/")[0] || null;
      } else if (u.searchParams.get("id")) {
        fileId = u.searchParams.get("id");
      }

      const viewUrl = fileId
        ? `https://drive.google.com/file/d/${fileId}/view`
        : url;

      const downloadUrl = fileId
        ? `https://drive.google.com/uc?export=download&id=${fileId}`
        : url;

      return { viewUrl, downloadUrl };
    }

    // ===== Dropbox =====
    // ?dl=0 (vista), ?dl=1 (descarga)
    if (host.includes("dropbox.com")) {
      const v = new URL(url);
      v.searchParams.set("dl", "0");
      const d = new URL(url);
      d.searchParams.set("dl", "1");
      return { viewUrl: v.toString(), downloadUrl: d.toString() };
    }

    // ===== OneDrive =====
    // ?download=1 suele forzar descarga
    if (host.includes("1drv.ms") || host.includes("onedrive.live.com")) {
      const viewUrl = url;
      const d = new URL(url);
      if (!d.searchParams.has("download")) d.searchParams.set("download", "1");
      return { viewUrl, downloadUrl: d.toString() };
    }

    // ===== Default =====
    return { viewUrl: url, downloadUrl: url };
  } catch {
    return { viewUrl: url, downloadUrl: url };
  }
};

/**
 * Refina URL de descarga para evitar visor (p.ej. usar dl.dropboxusercontent.com)
 * y asegurar "attachment" cuando sea posible.
 */
const resolveDownloadUrl = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname;

    // Dropbox -> usar host raw
    if (host.includes("dropbox.com")) {
      const parts = u.pathname.split("/").filter(Boolean); // ["s","XXXX","archivo.pdf"]
      if (parts.length >= 2 && parts[0] === "s") {
        // preserva hasta 3 segmentos si existe nombre de archivo
        const rawPath = parts.slice(0, 3).join("/");
        return `https://dl.dropboxusercontent.com/${rawPath}`;
      }
      const d = new URL(url);
      d.searchParams.set("dl", "1");
      return d.toString();
    }

    // Google Drive (descarga directa)
    if (host.includes("drive.google.com")) {
      let fileId = null;
      if (u.pathname.includes("/file/d/")) {
        fileId = u.pathname.split("/file/d/")[1]?.split("/")[0] || null;
      } else if (u.searchParams.get("id")) {
        fileId = u.searchParams.get("id");
      }
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      return url;
    }

    // OneDrive
    if (host.includes("1drv.ms") || host.includes("onedrive.live.com")) {
      const d = new URL(url);
      d.searchParams.set("download", "1");
      return d.toString();
    }

    return url;
  } catch {
    return url;
  }
};

// Abrir en nueva pestaña de forma segura (para "Ver")
const openInNewTab = (url) => {
  if (!url) return;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) win.opener = null;
};

/**
 * Forzar descarga sin abrir visor:
 *  1) fetch -> blob -> a[download]
 *  2) fallback iframe oculto (si CORS bloquea fetch/blob)
 */
const forceDownload = async (rawUrl, suggestedName = "archivo") => {
  const url = resolveDownloadUrl(rawUrl);

  // 1) Intento con fetch -> blob -> descarga
  try {
    const resp = await fetch(url, { mode: "cors", credentials: "omit" });
    const blob = await resp.blob(); // puede fallar si CORS estricto
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = suggestedName; // nombre sugerido
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    return;
  } catch (e) {
    // continúa al fallback
  }

  // 2) Fallback con iframe (no abre pestaña)
  try {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => iframe.remove(), 60_000);
  } catch {
    // como último recurso podrías usar window.location = url;
  }
};

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

  // ===== Mensajes / Notificaciones
  const [mensajes, setMensajes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [respuesta, setRespuesta] = useState("");

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
  const [idEditando, setIdEditando] = useState(null);

  // 🔹 Categorías predefinidas para el acordeón
const categoriasBanco = [
  "Corporativas",
  "Productos y Servicios",
  "Educación Financiera",
  "Tecnología e Innovación",
  "Recursos Humanos",
  "Comunicados Urgentes",
  "Eventos y Promociones",
];

// 🔹 Estado del acordeón de categorías
const [mostrarAcordeon, setMostrarAcordeon] = useState(false);


  

  //===== Muro informativo
  const [tituloMuro, setTituloMuro] = useState("");
  const [contenidoMuro, setContenidoMuro] = useState("");
  const [muroInformativo, setMuroInformativo] = useState([]);

  // ===== Listeners
  useEffect(() => {
    const unsubNoticias = onSnapshot(collection(db, "noticias"), (snap) => {
      setNoticias(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubMuroInformativo = onSnapshot(collection(db, "muro informativo"), (snap) => {
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

  

  // 📌 Crear noticia
const publicarNoticia = async () => {
  if (!tituloNoticia || !contenidoNoticia) {
    Swal.fire("Campos incompletos", "Ingresa título y contenido", "warning");
    return;
  }

  try {
    await addDoc(collection(db, "noticias"), {
      titulo: tituloNoticia,
      descripcion: contenidoNoticia,
      imagen,
      categoria,
      autor,
      fechaPublicacion: fechaPublicacion
        ? new Date(fechaPublicacion)
        : serverTimestamp(),
      creadaEn: serverTimestamp(),
    });

    Swal.fire("Publicado", "La noticia se publicó correctamente", "success");
    limpiarFormulario();
  } catch (error) {
    console.error("Error al publicar noticia:", error);
    Swal.fire("Error", "No se pudo publicar la noticia", "error");
  }
};

// 📌 Leer noticias (en tiempo real)
useEffect(() => {
  const q = query(collection(db, "noticias"), orderBy("fechaPublicacion", "desc"));
  const unsub = onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setNoticias(data);
  });
  return () => unsub();
}, []);

// 📌 Editar noticia
const editarNoticia = (n) => {
  setEditando(n);
  setIdEditando(n.id);
  setTituloNoticia(n.titulo);
  setContenidoNoticia(n.descripcion || n.contenido);
  setImagen(n.imagen);
  setPreview(n.imagen);
  setCategoria(n.categoria);
  setAutor(n.autor);
  setFechaPublicacion(
    n.fechaPublicacion?.toDate
      ? n.fechaPublicacion.toDate().toISOString().split("T")[0]
      : ""
  );
};

// 📌 Actualizar noticia
const actualizarNoticia = async () => {
  if (!editarNoticiaId) return;

  try {
    await updateDoc(doc(db, "noticias", editarNoticiaId), {
      titulo: tituloNoticia,
      descripcion: contenidoNoticia,
      imagen: imagen,
      categoria: categoria,
      autor: autor,
      fechaPublicacion: fechaPublicacion
        ? new Date(fechaPublicacion)
        : serverTimestamp(),
    });

    Swal.fire("Actualizada", "La noticia fue actualizada correctamente", "success");
    limpiarFormulario();
  } catch (error) {
    console.error("Error al actualizar noticia:", error);
    Swal.fire("Error", "No se pudo actualizar la noticia", "error");
  }
};

// 📌 Eliminar noticia
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

// 📌 Cancelar edición / limpiar formulario
const limpiarFormulario = () => {
  setTituloNoticia("");
  setContenidoNoticia("");
  setImagen("");
  setPreview("");
  setCategoria("");
  setAutor("");
  setFechaPublicacion("");
  setEditando(false);
  setIdEditando(null);
};

const cancelarEdicion = () => limpiarFormulario();

  // ===== publicar mensaje muro informativo
  const publicarMuroInformativo = async () => {
    if (!tituloMuro || !contenidoMuro) {
      return Swal.fire("Campos incompletos", "Completa todos los campos.", "warning");
    }
    try {
      await addDoc(collection(db, "muro informativo"), {
        titulo: tituloMuro,
        descripcion: contenidoMuro,
        fecha: serverTimestamp(),
        mensaje: `${tituloMuro}\n\n${contenidoMuro}`,
        prioridad: "",


      });
      Swal.fire("✅ Mensaje publicado", "", "success");
      setTituloMuro("");
      setContenidoMuro("");
    } catch (err) {
      Swal.fire("❌ Error", "No se pudo publicar el mensaje", "error");
    }
  };


  // ===== Cursos CRUD
  const handleGuardarCurso = async (e) => {
    e.preventDefault();
    if (!nombre || !descripcion || !duracion || !fechaLimite || !cupos) {
      return Swal.fire("Campos incompletos", "Completa todos los campos.", "warning");
    }
    if (archivoEnlace) {
      if (!isValidUrl(archivoEnlace)) {
        return Swal.fire("Enlace no válido", "El enlace debe comenzar con http(s)://", "warning");
      }
      if (!isAllowedDomain(archivoEnlace)) {
        return Swal.fire(
          "Dominio no permitido",
          "Usa un enlace de Drive, OneDrive o Dropbox (o agrega el dominio a la lista permitida).",
          "warning"
        );
      }
    }

    try {
      const payload = {
        nombre,
        descripcion,
        duracion,
        fechaLimite,
        imagen,
        archivoEnlace: archivoEnlace ? archivoEnlace.trim() : "",
        cupos: Number(cupos),
      };

      if (editandoCurso) {
        await updateDoc(doc(db, "cursos", editandoCurso.id), payload);
        Swal.fire("✅ Actualizado", "Curso actualizado", "success");
      } else {
        await addDoc(collection(db, "cursos"), {
          ...payload,
          inscritos: 0,
          createdAt: serverTimestamp(),
        });
        Swal.fire("✅ Agregado", "Curso creado", "success");
      }
      limpiarFormularioCurso();
    } catch (err) {
      console.error(err);
      Swal.fire("❌ Error", "No se pudo guardar el curso", "error");
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
  };

  const handleEliminarCurso = async (id) => {
    const ok = await Swal.fire({ title: "¿Eliminar curso?", icon: "warning", showCancelButton: true });
    if (!ok.isConfirmed) return;
    await deleteDoc(doc(db, "cursos", id));
    Swal.fire("🗑️ Eliminado", "", "success");
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
  };

  const handlePreview = (e) => {
    setImagen(e.target.value);
    setPreview(e.target.value);
  };

  // ===== Usuarios CRUD
  const handleRegistrarUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoApellido || !nuevoEmail || !nuevoArea || !nuevoPassword || !confirmPassword) {
      return Swal.fire("Campos incompletos", "Completa todos los campos", "warning");
    }
    if (nuevoPassword.length < 8) return Swal.fire("Contraseña débil", "Mínimo 8 caracteres", "warning");
    if (nuevoPassword !== confirmPassword) return Swal.fire("No coinciden", "Revisa las contraseñas", "warning");

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
      Swal.fire("✅ Usuario creado", "", "success");
      setNuevoNombre("");
      setNuevoApellido("");
      setNuevoEmail("");
      setNuevoArea("");
      setNuevoPassword("");
      setConfirmPassword("");
      setNuevoRol("usuario");
    } catch (err) {
      Swal.fire("❌ Error", err.message || "No se pudo registrar", "error");
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
    Swal.fire("🗑️ Eliminado", "", "success");
  };

  const startEditUser = (u) => setEditingUser({ ...u });
  const handleEditChange = (e) => setEditingUser({ ...editingUser, [e.target.name]: e.target.value });

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
    Swal.fire("✅ Actualizado", "", "success");
  };

  // ===== Mensajes (Admin)
  const marcarLeido = async (m) => {
    await updateDoc(doc(db, "mensajes", m.id), { estado: "leído" });
  };
  const eliminarMensaje = async (m) => {
    const ok = await Swal.fire({ title: "¿Eliminar mensaje?", icon: "warning", showCancelButton: true });
    if (!ok.isConfirmed) return;
    await deleteDoc(doc(db, "mensajes", m.id));
  };
  const responderMensaje = async (m) => {
    const { value: texto } = await Swal.fire({
      title: `Responder: ${m.asunto}`,
      input: "textarea",
      inputPlaceholder: "Escribe tu respuesta…",
      showCancelButton: true,
      confirmButtonText: "Enviar respuesta",
    });
    if (!texto) return;
    await addDoc(collection(db, "mensajes_respuestas"), {
      mensajeId: m.id,
      respuesta: texto,
      respondidoPor: auth.currentUser?.email || "admin",
      respondidoEn: serverTimestamp(),
    });
    await updateDoc(doc(db, "mensajes", m.id), { estado: "leído" });
    Swal.fire("✅ Respuesta enviada", "", "success");
  };

  // ===== Notificaciones (Admin)
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
    Swal.fire("🔔 Notificación creada (demo)", "", "success");
  };

  // ===== Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="admin">
      {/* HEADER */}
      <header className="admin__header" style={{ borderBottom: "3px solid #ef4444", paddingBottom: 8 }}>
        <h1>⚙️ Panel de Administración</h1>
        <button className="btn btn--logout" onClick={handleLogout}>
          🔒 Cerrar sesión
        </button>
      </header>

      {/* STATS */}
      <section className="stats">
        <div className="stat stat--blue">
          <div className="stat__icon">👥</div>
          <div>
            <h3>Total Usuarios</h3>
            <p className="stat__value">{usuarios.length}</p>
            <span>{usuariosActivos} activos</span>
          </div>
        </div>
        <div className="stat stat--green">
          <div className="stat__icon">📘</div>
          <div>
            <h3>Total Cursos</h3>
            <p className="stat__value">{cursos.length}</p>
            <span>Registrados en el sistema</span>
          </div>
        </div>
        <div className="stat stat--purple">
          <div className="stat__icon">📨</div>
          <div>
            <h3>Mensajes</h3>
            <p className="stat__value">{mensajes.length}</p>
            <span>Pendientes: {mensajesPendientes}</span>
          </div>
        </div>
        <div className="stat stat--orange">
          <div className="stat__icon">🔔</div>
          <div>
            <h3>Notificaciones</h3>
            <p className="stat__value">{notificaciones.length}</p>
            <span>Nuevas: {notificacionesNuevas}</span>
          </div>
        </div>
        <div className="stat stat--red">
          <div className="stat__icon">📰</div>
          <div>
            <h3>Noticias</h3>
            <p className="stat__value">{noticias.length}</p>
            <span>Publicadas</span>
          </div>
        </div>
        <div className="stat stat--teal">
          <div className="stat__icon">📋</div>
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
              <h2>📘Cursos</h2>
              <button
                className="btn btn--add"
                onClick={() => document.getElementById("form-curso").scrollIntoView({ behavior: "smooth" })}
              >
                ➕ Agregar Curso
              </button>
            </div>

            <div className="course-list">
              {cursos.map((c) => {
                const { viewUrl, downloadUrl } = getViewAndDownload(c.archivoEnlace || "");
                return (
                  <div key={c.id} className="course-card">
                    <div>
                      <h3>{c.nombre}</h3>
                      <p>{c.descripcion}</p>
                      <small>Duración: {c.duracion}</small><br />
                      <small>Fecha Límite: {c.fechaLimite}</small><br />
                      <small>Cupos: {c.cupos}</small><br />
                      {c.archivoEnlace && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                          <button
                            type="button"
                            className="btn btn--view"
                            title="Abrir archivo en el visor"
                            aria-label="Ver archivo"
                            onClick={() => openInNewTab(viewUrl)}
                          >
                            👁️ Ver
                          </button>
                          <button
                            type="button"
                            className="btn btn--download"
                            title="Descargar archivo"
                            aria-label="Descargar archivo"
                            onClick={() => {
                              const ext = c.archivoEnlace.split("?")[0].match(/\.\w+$/)?.[0] || "";
                              const nombreSugerido = (c.nombre || "archivo").replace(/[^\w\-]+/g, "_") + ext;
                              forceDownload(downloadUrl, nombreSugerido);
                            }}
                          >
                            ⬇️ Descargar
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="course-actions">
                      <button onClick={() => handleEditarCurso(c)}>✏️ Editar</button>
                      <button onClick={() => handleEliminarCurso(c.id)}>🗑️ Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <section className="add-course" id="form-curso">
              <h2>{editandoCurso ? "✏️ Editar curso" : "➕ Agregar nuevo curso"}</h2>
              <form onSubmit={handleGuardarCurso} className="form">
                <input
                  type="text"
                  placeholder="Nombre del curso"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                <textarea
                  placeholder="Descripción"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Duración"
                  value={duracion}
                  onChange={(e) => setDuracion(e.target.value)}
                />
                <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />

                <input
                  type="text"
                  placeholder="URL de imagen"
                  value={imagen}
                  onChange={(e) => { setImagen(e.target.value); setPreview(e.target.value); }}
                />
                {preview && (
                  <img src={preview} alt="Vista previa" style={{ width: 200, borderRadius: 8, marginTop: 10 }} />
                )}

                <input
                  type="text"
                  placeholder="Enlace del archivo (Drive, OneDrive, Dropbox)"
                  value={archivoEnlace}
                  onChange={(e) => setArchivoEnlace(e.target.value)}
                />
                <small style={{ opacity: 0.8 }}>
                  Asegúrate de que el archivo esté compartido como “Cualquiera con el enlace”.
                </small>

                <input
                  type="number"
                  placeholder="Cupos disponibles"
                  value={cupos}
                  onChange={(e) => setCupos(e.target.value)}
                  min="1"
                />
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
                    <input type="text" placeholder="Tu nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Apellido</label>
                  <div className="input-with-icon">
                    <span className="icon">👤</span>
                    <input type="text" placeholder="Tu apellido" value={nuevoApellido} onChange={(e) => setNuevoApellido(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="field">
                <label>Correo Electrónico</label>
                <div className="input-with-icon">
                  <span className="icon">✉️</span>
                  <input type="email" placeholder="tu.email@infobank.com" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Área de Trabajo</label>
                <div className="input-with-icon">
                  <span className="icon">🏢</span>
                  <select value={nuevoArea} onChange={(e) => setNuevoArea(e.target.value)}>
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
                <label>Contraseña</label>
                <div className="input-with-icon">
                  <span className="icon">🔒</span>
                  <input type="password" placeholder="Mínimo 8 caracteres" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Confirmar Contraseña</label>
                <div className="input-with-icon">
                  <span className="icon">🔒</span>
                  <input type="password" placeholder="Repite tu contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <p className="helper">Tu contraseña debe contener al menos 8 caracteres.</p>
              <button type="submit" className="btn btn--primary" disabled={registrando}>
                {registrando ? "Creando…" : "Crear Cuenta"}
              </button>
            </form>

            {editingUser && (
              <form onSubmit={saveEditUser} className="user-form">
                <h3>Editar usuario</h3>
                <input name="nombre" type="text" value={editingUser.nombre || ""} onChange={handleEditChange} />
                <input name="apellido" type="text" value={editingUser.apellido || ""} onChange={handleEditChange} />
                <input name="email" type="email" value={editingUser.email || ""} onChange={handleEditChange} />
                <input name="areaTrabajo" type="text" value={editingUser.areaTrabajo || ""} onChange={handleEditChange} />
                <select name="rol" value={editingUser.rol || "usuario"} onChange={handleEditChange}>
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
                <select name="estado" value={editingUser.estado || "Activo"} onChange={handleEditChange}>
                  <option value="Activo">Activo</option>
                  <option value="Bloqueado">Bloqueado</option>
                </select>
                <div className="form-actions">
                  <button type="submit" className="btn btn--save">Guardar cambios</button>
                  <button type="button" className="btn btn--cancel" onClick={() => setEditingUser(null)}>Cancelar</button>
                </div>
              </form>
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
              <div key={m.id} className="msg-card">
                <div className="msg-main">
                  <div className="msg-top">
                    <strong>{m.asunto}</strong>
                    {m.estado === "pendiente" ? (
                      <span className="badge badge--warn">Pendiente</span>
                    ) : (
                      <span className="badge">Leído</span>
                    )}
                  </div>
                  <p className="msg-content">{m.contenido}</p>
                  <small>De: {m.remitente} · {m.creadoEn?.toDate?.().toLocaleString?.() || "—"}</small>
                </div>
                <div className="msg-actions">
                  {m.estado === "pendiente" && (
                    <button className="btn btn--save" onClick={() => marcarLeido(m)}>Marcar leído</button>
                  )}
                  <button className="btn btn--edit" onClick={() => responderMensaje(m)}>Responder</button>
                  <button className="btn btn--delete" onClick={() => eliminarMensaje(m)}>Eliminar</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ===== NOTIFICACIONES ===== */}
        {tab === "notis" && (
          <section className="users">
            <div className="courses__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Notificaciones</h2>
              <button className="btn btn--add" onClick={crearNotiDemo}>+ Crear demo</button>
            </div>

            {notificaciones.length === 0 && <p>No hay notificaciones.</p>}

            {notificaciones.map((n) => (
              <div key={n.id} className="msg-card">
                <div className="msg-main">
                  <div className="msg-top">
                    <strong>{n.titulo}</strong>
                    {!n.leida && <span className="badge badge--warn">Nueva</span>}
                  </div>
                  <p className="msg-content">{n.descripcion}</p>
                  <small>Tipo: {n.tipo} · {n.creadoEn?.toDate?.().toLocaleString?.() || "—"}</small>
                </div>
                <div className="msg-actions">
                  {!n.leida && (
                    <button className="btn btn--save" onClick={() => marcarNotiLeida(n)}>Marcar leída</button>
                  )}
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
           }else{
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
          value={imagen}
          onChange={(e) => {
            setImagen(e.target.value);
            setPreview(e.target.value);
          }}
        />

        {preview && (
          <img
            src={preview}
            alt="Vista previa"
            style={{
              width: 250,
              borderRadius: 8,
              marginTop: 10,
              border: "1px solid #ccc",
            }}
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
            setMostrarAcordeon(false); // 🔹 cierra el acordeón al seleccionar
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
      value="Administrador"
      readOnly
      style={{
        backgroundColor: "#f3f3f3",
        border: "1px solid #ccc",
        padding: "8px",
        borderRadius: "6px",
        width: "100%",
        color: "#555",
        cursor: "not-allowed",
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



            




         

        {/* ===== MURO INFORMÁTIVO ===== */}
        {tab === "muro" && (
          <section className="users">
            <div className="courses__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Gestion de Muro Informativo</h2>
            </div>
            <div className="add-course">
              <h2>➕ Publicar nuevo mensaje</h2>
              <form onSubmit={(e) => { e.preventDefault(); publicarMuroInformativo(); }} className="form">
                <input
                  type="text"
                  placeholder="Título del mensaje"
                  value={tituloMuro}
                  onChange={(e) => setTituloMuro(e.target.value)}
                />
                <textarea
                  placeholder="Contenido del mensaje"
                  value={contenidoMuro}
                  onChange={(e) => setContenidoMuro(e.target.value)}
                />
                <button type="submit" className="btn btn--save">
                  Publicar Mensaje
                </button>
              </form>
            </div>

            <div className="course-list">
              {muroInformativo.map((m) => (
                <div key={m.id} className="course-card">
                  <div>
                    <h3>{m.titulo}</h3>
                    <p>{m.descripcion}</p>
                    <small>Publicado el: {m.fecha?.toDate?.().toLocaleDateString?.() || "—"}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
