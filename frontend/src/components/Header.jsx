import React from "react";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header style={styles.header}>
      <div>
        <Link to="/" style={styles.logo}>🌸 Boquet Shop</Link>
      </div>
      <nav>
        <Link to="/catalog" style={styles.link}>Каталог</Link>
        <Link to="/constructor" style={styles.link}>Конструктор</Link>
        <Link to="/cart" style={styles.link}>Корзина</Link>
        <Link to="/contacts" style={styles.link}>Контакты</Link>
        <Link to="/about" style={styles.link}>О нас</Link>
        <Link to="/login" style={styles.link}>Войти</Link>
        <Link to="/register" style={styles.link}>Регистрация</Link>
      </nav>
    </header>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", padding: "10px 20px", background: "#ff4081", color: "#fff" },
  logo: { textDecoration: "none", fontSize: "1.5rem", color: "#fff" },
  link: { textDecoration: "none", marginLeft: "15px", color: "#fff", fontSize: "1.2rem" },
};

export default Header;
