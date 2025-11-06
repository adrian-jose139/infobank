import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
//importar paginas
import Login from "./pages/Login/Login";
import Register from "./pages/Registro/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import { ThemeProvider } from "./context/ThemeContext";
import CursoDetalle from "./pages/CursoDetalle/CursoDetalle";
import Cursos from "./pages/Cursos/Cursos";
import Noticias from "./pages/Noticias/Noticias"; // ✅ nuevo
import Configuracion from "./pages/Configuracion/Configuracion";
import Soporte from "./pages/Soporte/Soporte";
import MuroInformativo from "./pages/MuroInformativo/MuroInformativo";
import PerfilUsuario from "./pages/PerfilUsuario/PerfilUsuario";
import Evaluacion from "./pages/Evaluacion/Evaluacion";
import AcercaDe from "./pages/AcercaDe";
import PostDetalle from "./pages/MuroInformativo/PostDetalle"

function App() {
  return (
    <Router>
      {/* ✅ ThemeProvider DEBE envolver a <Routes> */}
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/curso/:id" element={<CursoDetalle />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/noticias" element={<Noticias />} /> {/* ✅ nueva ruta */}
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/soporte" element={<Soporte />} />
           <Route path="/muro" element={<MuroInformativo />} />
          <Route path="/perfil" element={<PerfilUsuario />} />
           <Route path="/Evaluacion" element={<Evaluacion/>} />
           <Route path="/acerca-de" element={<AcercaDe />} />
           <Route path="/muro/:postId" element={<PostDetalle />} />

        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;

