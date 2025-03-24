import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../index.css';

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверка авторизации при загрузке компонента
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    console.log("Проверка авторизации:", { token, username });

    if (token && username) {
      setUser(username);
    } else {
      // Если нет токена или имени, очищаем состояние пользователя
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    setUser(null);
    navigate('/');
  };

  // Проверка состояния пользователя при рендеринге
  console.log("Текущее состояние пользователя:", user);

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
        </nav>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          {user ? (
            <div style={{
              color: 'var(--text-color)',
              fontWeight: '500',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              Добро пожаловать, {user}!
              <button
                onClick={handleLogout}
                className="nav-button"
                style={{
                  padding: '5px 10px',
                  fontSize: '14px'
                }}
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
