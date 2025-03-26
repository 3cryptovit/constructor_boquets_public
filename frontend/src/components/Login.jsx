import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    setLoading(true);
    setError("");

    fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Неверное имя пользователя или пароль");
        }
        return response.json();
      })
      .then(data => {
        // Сохраняем данные в localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("userRole", data.user.role || "user"); // Сохраняем роль пользователя
        localStorage.setItem("user", JSON.stringify(data.user)); // Сохраняем весь объект пользователя

        // Перенаправляем на главную страницу
        navigate("/");
      })
      .catch(error => {
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Вход в аккаунт</h1>

      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="username"
          placeholder="Имя пользователя"
          value={formData.username}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <button
          type="submit"
          style={styles.button}
          disabled={loading}
        >
          {loading ? "Загрузка..." : "Войти"}
        </button>
      </form>

      <p style={styles.signupPrompt}>
        Нет аккаунта? <Link to="/register" style={styles.link}>Зарегистрироваться</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "40px auto",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)"
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#333"
  },
  form: {
    display: "flex",
    flexDirection: "column"
  },
  input: {
    padding: "12px",
    marginBottom: "15px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "16px"
  },
  button: {
    padding: "12px",
    backgroundColor: "#ff4081",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "10px"
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: "20px"
  },
  signupPrompt: {
    textAlign: "center",
    marginTop: "20px"
  },
  link: {
    color: "#ff4081",
    textDecoration: "none"
  }
};

export default Login;
