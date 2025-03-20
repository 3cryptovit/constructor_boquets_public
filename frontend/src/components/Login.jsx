import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      navigate("/");
    } else {
      alert("❌ Неверный логин или пароль!");
    }
  };

  return (
    <div style={styles.container}>
      <h1>Вход</h1>
      <form onSubmit={handleLogin} style={styles.form}>
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
        <button type="submit" style={styles.button}>Войти</button>
      </form>
      <p>
        Нет аккаунта? <a href="/register" style={styles.link}>Регистрация</a>
      </p>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", padding: "40px" },
  form: { display: "flex", flexDirection: "column", maxWidth: "300px", margin: "auto" },
  input: { padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem" },
  button: { background: "#ff4081", color: "white", padding: "10px", border: "none", borderRadius: "5px", fontSize: "1rem", cursor: "pointer" },
  link: { color: "#ff4081", textDecoration: "none" },
};

export default Login;
