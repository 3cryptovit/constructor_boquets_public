import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      alert("✅ Регистрация успешна! Теперь войдите в аккаунт.");
      navigate("/login");
    } else {
      const error = await response.json();
      alert(`❌ Ошибка: ${error.error}`);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Регистрация</h1>
      <form onSubmit={handleRegister} style={styles.form}>
        <input
          type="text"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Зарегистрироваться</button>
      </form>
      <p>
        Уже есть аккаунт? <a href="/login" style={styles.link}>Войти</a>
      </p>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", padding: "40px" },
  form: { display: "flex", flexDirection: "column", maxWidth: "300px", margin: "auto" },
  input: { padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem" },
  button: { background: "#4CAF50", color: "white", padding: "10px", border: "none", borderRadius: "5px", fontSize: "1rem", cursor: "pointer" },
  link: { color: "#4CAF50", textDecoration: "none" },
};

export default Register;
