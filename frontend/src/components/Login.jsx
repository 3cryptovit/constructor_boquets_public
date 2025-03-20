import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/login", { // <-- исправленный путь
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);
      navigate("/");
    } else {
      setError(data.error || "❌ Неверный логин или пароль!");
    }
  };

  return (
    <div className="container">
      <h1>Вход</h1>
      <form onSubmit={handleLogin} className="form">
        <input
          type="text"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="input"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input"
        />
        <button type="submit" className="button">Войти</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        Нет аккаунта? <a href="/register" className="link">Регистрация</a>
      </p>
    </div>
  );
}

export default Login;
