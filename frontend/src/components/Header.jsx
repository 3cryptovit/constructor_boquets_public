import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../index.css';

const Header = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
    navigate('/');
  };

  // Проверка состояния пользователя при рендеринге
  console.log("Текущее состояние пользователя:", user, "Администратор:", isAdmin);

  return (
    <header className="site-header">
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link to="/" className="logo-container" style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none'
        }}>
          <img src="/assets/logo.svg" alt="Boquet Shop" className="logo" style={{ height: '40px' }} />
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '24px',
            fontWeight: '700',
            color: '#333',
            marginLeft: '10px',
            whiteSpace: 'nowrap'
          }}>
            Boquet Shop
          </span>
        </Link>

        <nav style={{
          display: 'flex',
          gap: '15px'
        }}>
          <Link to="/">
            <button className="nav-button">Главная</button>
          </Link>
          <Link to="/catalog">
            <button className="nav-button">Каталог</button>
          </Link>
          <Link to="/constructor">
            <button className="nav-button">Конструктор</button>
          </Link>
          <Link to="/cart">
            <button className="nav-button">Корзина</button>
          </Link>
          <Link to="/about">
            <button className="nav-button">О нас</button>
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <button className="nav-button admin-button">Админ-панель</button>
            </Link>
          )}
        </nav>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          {user ? (
            <div className="user-controls">
              <span className="welcome">Добро пожаловать, {user}!</span>
              {isAdmin && (
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
