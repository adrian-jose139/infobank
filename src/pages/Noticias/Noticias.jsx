import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const NoticiasEmpleado = () => {
  const [noticias, setNoticias] = useState([]);

  useEffect(() => {
    const cargarNoticias = async () => {
      const snapshot = await getDocs(collection(db, "noticias"));
      setNoticias(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    cargarNoticias();
  }, []);

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold mb-4">📰 Noticias</h2>
      {noticias.map((n) => (
        <div key={n.id} className="border p-3 rounded mb-3">
          <h4 className="font-bold">{n.titulo}</h4>
          <p className="text-sm text-gray-600">{n.categoria} | {n.autor}</p>
          <p>{n.descripcion}</p>
        </div>
      ))}
    </div>
  );
};

export default NoticiasEmpleado;
