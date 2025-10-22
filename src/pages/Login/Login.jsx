import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig"; // Asegúrate de que la ruta sea correcta
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2"; // ✅ Para los cuadros emergentes
import infobankLogo from "../../assets/infobank-logo.png"; // Asegúrate de tener el logo en assets
import "../../App.css"; // Asegúrate de tener tu estilo global aquí

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Redirección automática si ya hay sesión activa
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const rolRef = doc(db, "roles", user.uid);
          const rolSnap = await getDoc(rolRef);

          if (rolSnap.exists() && rolSnap.data().rol === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } catch (err) {
          console.error("Error al obtener el rol:", err);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ✅ Inicio de sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const rolRef = doc(db, "roles", user.uid);
      const rolSnap = await getDoc(rolRef);

      if (rolSnap.exists() && rolSnap.data().rol === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

      setMensaje("✅ Inicio de sesión exitoso");
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Recuperar contraseña con SweetAlert2
  const handleOlvidarContrasena = async () => {
    const { value: correo } = await Swal.fire({
      title: "🔑 Recuperar contraseña",
      text: "Ingresa tu correo electrónico para recibir un enlace de recuperación:",
      input: "email",
      inputPlaceholder: "tu.email@infobank.com",
      confirmButtonText: "Enviar enlace",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#007bff",
      cancelButtonColor: "#6b7280",
      inputValidator: (value) => {
        if (!value) {
          return "Por favor ingresa un correo válido.";
        }
      },
    });

    if (correo) {
      try {
        await sendPasswordResetEmail(auth, correo);
        Swal.fire(
          "✅ Enlace enviado",
          `Se ha enviado un enlace de recuperación a ${correo}.`,
          "success"
        );
      } catch (error) {
        Swal.fire(
          "❌ Error",
          "No se pudo enviar el correo. Verifica que el correo esté registrado.",
          "error"
        );
      }
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <img src={infobankLogo} alt="Logo InfoBank" className="login-logo" />
        <h2>Iniciar Sesión</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo electrónico o usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* 🔗 Enlace de recuperación */}
          <p className="forgot-password" onClick={handleOlvidarContrasena}>
            ¿Olvidaste tu contraseña?
          </p>

          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {mensaje && <p>{mensaje}</p>}

        <p>
          ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}
