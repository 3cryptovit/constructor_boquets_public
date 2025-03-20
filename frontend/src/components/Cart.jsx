import React, { useState, useEffect } from "react";

function Cart() {
  const [cart, setCart] = useState([]);
  const userId = 1; // TODO: заменить на реального пользователя

  useEffect(() => {
    fetch(`http://localhost:5000/cart/${userId}`)
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((error) => console.error("Ошибка загрузки корзины:", error));
  }, []);

  const removeFromCart = (id) => {
    fetch(`http://localhost:5000/cart/${id}`, { method: "DELETE" })
      .then(() => setCart(cart.filter((item) => item.id !== id)))
      .catch((error) => console.error("Ошибка удаления:", error));
  };

  const placeOrder = () => {
    fetch("http://localhost:5000/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then((res) => res.json())
      .then(() => setCart([]))
      .catch((error) => console.error("Ошибка оформления заказа:", error));
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🛒 Корзина</h1>
      {cart.length === 0 ? (
        <p style={styles.empty}>Корзина пуста</p>
      ) : (
        <div>
          {cart.map((item) => (
            <div key={item.id} style={styles.item}>
              <h2>{item.name}</h2>
              <p style={styles.price}>{item.price} ₽</p>
              <p>Кол-во: {item.quantity}</p>
              <button style={styles.button} onClick={() => removeFromCart(item.id)}>
                ❌ Удалить
              </button>
            </div>
          ))}
          <h2 style={styles.total}>
            Итого: {cart.reduce((acc, item) => acc + item.price * item.quantity, 0)} ₽
          </h2>
          <button style={styles.checkout} onClick={placeOrder}>
            ✅ Оформить заказ
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "40px", textAlign: "center" },
  title: { fontSize: "2.5rem", marginBottom: "20px" },
  empty: { fontSize: "1.5rem", color: "#666" },
  item: { display: "flex", alignItems: "center", gap: "20px", padding: "15px", borderBottom: "1px solid #ddd" },
  price: { fontSize: "1.2rem", fontWeight: "bold" },
  button: { background: "#ff4081", color: "#fff", padding: "8px", border: "none", borderRadius: "5px", cursor: "pointer" },
  total: { fontSize: "1.5rem", marginTop: "20px" },
  checkout: { background: "#4CAF50", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "1.2rem", marginTop: "20px" },
};

export default Cart;
