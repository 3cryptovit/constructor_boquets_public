import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../index.css';

const Header = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const userRole = localStorage.getItem("userRole");

    if (token && username) {
      setUser(username);
      setIsAdmin(userRole === 'admin');
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // Добавляем слушатель события storage для синхронизации между вкладками
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    setUser(null);
    setIsAdmin(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Проверка состояния пользователя при рендеринге
  console.log("Текущее состояние пользователя:", user, "Администратор:", isAdmin);

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Boquet Shop
        </Link>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/catalog">Каталог</Link>
          <Link to="/constructor">Конструктор</Link>
          <Link to="/favorites">Избранное</Link>
          <Link to="/cart">Корзина</Link>
          <Link to="/contacts">Контакты</Link>
          <Link to="/about">О нас</Link>
        </div>

        <div className="burger-menu" onClick={toggleMenu}>
          ☰
        </div>

        <div className="user-controls">
          {user ? (
            <div className="user-controls">
              <span className="welcome">Добро пожаловать, {user}!</span>
              {isAdmin && (
                <>
                  <span className="admin-badge" style={{
                    background: '#ff4081',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginLeft: '8px'
                  }}>
                    Администратор
                  </span>
                  <Link to="/admin">
                    <button className="nav-button admin-button">
                      Админ-панель
                    </button>
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="logout-btn"
              >
                Выйти
              </button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <button className="nav-button">Войти</button>
              </Link>
              <Link to="/register">
                <button className="nav-button">Регистрация</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
