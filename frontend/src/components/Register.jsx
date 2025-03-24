import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при регистрации');
      }

      // Успешная регистрация
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="main-content">
      <div className="container">
        <div className="auth-container">
          <div className="auth-card" style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '100%',
            margin: '40px auto',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            ':hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
            }
          }}>
            <h2 style={{
              fontFamily: 'var(--heading-font)',
              fontSize: '32px',
              color: 'var(--text-color)',
              marginBottom: '30px',
              textAlign: 'center',
              fontWeight: '700'
            }}>
              Регистрация
            </h2>

            {error && (
              <div style={{
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                color: '#d32f2f',
                padding: '15px',
                borderRadius: '12px',
                marginBottom: '25px',
                fontSize: '14px',
                border: '1px solid rgba(211, 47, 47, 0.2)'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: 'var(--text-color)',
                  fontSize: '15px',
                  fontWeight: '500'
                }}>
                  Имя пользователя
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    color: 'var(--text-color)',
                    fontFamily: 'var(--main-font)',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    ':focus': {
                      outline: 'none',
                      borderColor: 'var(--accent-color)',
                      boxShadow: '0 0 0 3px rgba(255, 94, 126, 0.1)'
                    }
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: 'var(--text-color)',
                  fontSize: '15px',
                  fontWeight: '500'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    color: 'var(--text-color)',
                    fontFamily: 'var(--main-font)',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    ':focus': {
                      outline: 'none',
                      borderColor: 'var(--accent-color)',
                      boxShadow: '0 0 0 3px rgba(255, 94, 126, 0.1)'
                    }
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: 'var(--text-color)',
                  fontSize: '15px',
                  fontWeight: '500'
                }}>
                  Пароль
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    color: 'var(--text-color)',
                    fontFamily: 'var(--main-font)',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    ':focus': {
                      outline: 'none',
                      borderColor: 'var(--accent-color)',
                      boxShadow: '0 0 0 3px rgba(255, 94, 126, 0.1)'
                    }
                  }}
                />
              </div>

              <div style={{ marginBottom: '35px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: 'var(--text-color)',
                  fontSize: '15px',
                  fontWeight: '500'
                }}>
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    color: 'var(--text-color)',
                    fontFamily: 'var(--main-font)',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    ':focus': {
                      outline: 'none',
                      borderColor: 'var(--accent-color)',
                      boxShadow: '0 0 0 3px rgba(255, 94, 126, 0.1)'
                    }
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  marginBottom: '25px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  background: 'var(--accent-color)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  ':hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 94, 126, 0.3)'
                  }
                }}
              >
                Зарегистрироваться
              </button>

              <div style={{
                textAlign: 'center',
                color: 'var(--text-color)',
                fontSize: '15px',
                padding: '15px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '12px'
              }}>
                Уже есть аккаунт?{' '}
                <a
                  href="/login"
                  style={{
                    color: 'var(--accent-color)',
                    textDecoration: 'none',
                    fontWeight: '600',
                    transition: 'color 0.2s ease',
                    ':hover': {
                      color: 'var(--primary-color)'
                    }
                  }}
                >
                  Войти
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
