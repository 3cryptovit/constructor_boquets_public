import React, { useState, useEffect } from "react";
import useCartStore from "../store/useCartStore";




function Catalog() {
  const { addToCart } = useCartStore();
  const [bouquets, setBouquets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/bouquets")
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ошибка сети');
        }
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('Неверный формат данных');
        }
        setBouquets(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Ошибка загрузки букетов:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Каталог букетов</h1>
      <div style={styles.grid}>
        {bouquets.map((bouquet) => (
          <div key={bouquet.id} style={styles.card}>
            <h2>{bouquet.name}</h2>
            <p>{bouquet.description}</p>
            <p style={styles.price}>{bouquet.price} ₽</p>
            <button style={styles.button} onClick={() => addToCart(bouquet)}>
              Добавить в корзину
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px", textAlign: "center" },
  title: { fontSize: "2.5rem", marginBottom: "20px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px", justifyItems: "center" },
  card: { background: "#fff", padding: "15px", borderRadius: "10px", boxShadow: "0px 4px 6px rgba(0,0,0,0.1)", width: "250px" },
  price: { fontSize: "1.2rem", fontWeight: "bold" },
  button: { background: "#ff4081", color: "#fff", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "1rem" }
};

export default Catalog;
