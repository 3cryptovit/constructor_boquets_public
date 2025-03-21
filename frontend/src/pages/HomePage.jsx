import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function HomePage() {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser && storedUser !== "undefined") {
      setUsername(storedUser);
    }
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        {username ? `Добро пожаловать, ${username}!` : "Добро пожаловать в Boquet Shop!"}
      </h1>
      <p style={styles.subtitle}>Собери идеальный букет для любого случая.</p>

      <div style={styles.buttonContainer}>
        <Link to="/catalog" style={styles.button}>Перейти в каталог</Link>
        {!username && (
          <Link to="/login" style={{ ...styles.button, marginLeft: "15px", background: "#4CAF50" }}>Войти в аккаунт</Link>
        )}
      </div>

      <div style={styles.images}>
        <div style={{ ...styles.imageBox, backgroundImage: `url('/assets/example_1.jpg')` }}>🌹 Романтическая классика</div>
        <div style={{ ...styles.imageBox, backgroundImage: `url('/assets/example_2.jpg')` }}>🌷 Весенняя свежесть</div>
        <div style={{ ...styles.imageBox, backgroundImage: `url('/assets/example_3.jpg')` }}>🌻 Солнечный день</div>
      </div>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", padding: "40px" },
  title: { fontSize: "2.5rem", color: "#333" },
  subtitle: { fontSize: "1.5rem", color: "#666", marginBottom: "20px" },
  buttonContainer: { marginTop: "20px" },
  button: { padding: "10px 20px", background: "#ff4081", color: "white", textDecoration: "none", borderRadius: "5px", fontSize: "1.2rem" },
  images: { display: "flex", justifyContent: "center", gap: "20px", marginTop: "40px" },
  imageBox: { width: "200px", height: "250px", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", color: "white", fontWeight: "bold", borderRadius: "10px", textShadow: "2px 2px 4px rgba(0,0,0,0.7)" }
};

export default HomePage;
