import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useFavoritesStore from "../store/useFavoritesStore";

function Header() {
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites } = useFavoritesStore();

  // Функция для проверки авторизации
  const checkAuth = () => {
    const storedUser = localStorage.getItem("username");
    const token = localStorage.getItem("token");
    if (storedUser && storedUser !== "undefined" && token) {
      setUsername(storedUser);
    } else {
      setUsername(null);
    }
  };

  // Проверяем авторизацию при монтировании и изменении пути
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  // Добавляем слушатель storage для синхронизации состояния между вкладками
  useEffect(() => {
    window.addEventListener('storage', checkAuth);

    // Проверяем авторизацию каждый раз, когда компонент становится видимым
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    });

    return () => {
      window.removeEventListener('storage', checkAuth);
      document.removeEventListener('visibilitychange', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setUsername(null);
    navigate('/'); // Перенаправляем на главную страницу вместо перезагрузки
  };

  return (
    <header style={styles.header}>
      <div>
        <Link to="/" style={styles.logo}>🌸 Boquet Shop</Link>
      </div>
      <nav style={styles.nav}>
        <div style={styles.navLinks}>
          <Link to="/catalog" style={styles.link}>Каталог</Link>
          <Link to="/constructor" style={styles.link}>Конструктор</Link>
          <Link to="/favorites" style={styles.link}>
            Избранное {favorites.length > 0 && <span style={styles.badge}>{favorites.length}</span>}
          </Link>
          <Link to="/cart" style={styles.link}>Корзина</Link>
          <Link to="/contacts" style={styles.link}>Контакты</Link>
          <Link to="/about" style={styles.link}>О нас</Link>
        </div>

        <div style={styles.authSection}>
          {username ? (
            <>
              <span style={styles.welcome}>Добро пожаловать, {username}!</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>Войти</Link>
              <Link to="/register" style={styles.link}>Регистрация</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#ff4081",
    color: "#fff"
  },
  logo: {
    textDecoration: "none",
    fontSize: "1.5rem",
    color: "#fff"
  },
  nav: {
    display: "flex",
    alignItems: "center"
  },
  navLinks: {
    display: "flex",
    marginRight: "20px"
  },
  authSection: {
    display: "flex",
    alignItems: "center",
    borderLeft: "1px solid rgba(255,255,255,0.3)",
    paddingLeft: "15px"
  },
  link: {
    textDecoration: "none",
    marginLeft: "15px",
    color: "#fff",
    fontSize: "1.2rem"
  },
  welcome: {
    marginLeft: "15px",
    color: "#fff",
    fontSize: "1.2rem"
  },
  logoutBtn: {
    marginLeft: "15px",
    background: "transparent",
    border: "1px solid white",
    borderRadius: "4px",
    padding: "5px 10px",
    color: "#fff",
    fontSize: "1.2rem",
    cursor: "pointer"
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ff4081",
    color: "#fff",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    fontSize: "0.7rem",
    position: "relative",
    top: "-8px",
    marginLeft: "3px"
  }
};

export default Header;
