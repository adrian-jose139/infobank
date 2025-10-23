import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

const MuroEmpleado = () => {
  const [mensajes, setMensajes] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const snap = await getDocs(collection(db, "muro"));
      setMensajes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    cargar();
  }, []);

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold mb-4">📢 Muro Informativo</h2>
      {mensajes.map((m) => (
        <div key={m.id} className="border p-3 rounded mb-2">
          <p>{m.mensaje}</p>
          <small className="text-gray-500">
            {m.autor} - Prioridad: {m.prioridad}
          </small>
        </div>
      ))}
    </div>
  );
};

export default MuroEmpleado;
