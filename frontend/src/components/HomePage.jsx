import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="main-content">
      <section className="hero">
        <div className="container">
          <h1>Boquet Shop</h1>
          <p>Создавайте букеты своей мечты или выбирайте из нашей коллекции</p>
          <div style={{
            marginTop: '40px',
            display: 'flex',
            gap: '20px',
            justifyContent: 'center'
          }}>
            <Link to="/catalog" className="btn">
              Смотреть каталог
            </Link>
            <Link to="/constructor" className="btn btn-outline">
              Создать букет
            </Link>
          </div>
        </div>
      </section>

      <section style={{
        padding: '80px 0',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            <div className="card fade-in" style={{
              textAlign: 'center',
              padding: '30px'
            }}>
              <div style={{
                fontSize: '40px',
                marginBottom: '20px'
              }}>🎨</div>
              <h3 style={{
                fontSize: '20px',
                marginBottom: '15px',
                color: '#ff5e7e'
              }}>AI Конструктор</h3>
              <p style={{ color: '#666' }}>
                Создавайте уникальные букеты с помощью искусственного интеллекта
              </p>
            </div>

            <div className="card fade-in" style={{
              textAlign: 'center',
              padding: '30px'
            }}>
              <div style={{
                fontSize: '40px',
                marginBottom: '20px'
              }}>🚚</div>
              <h3 style={{
                fontSize: '20px',
                marginBottom: '15px',
                color: '#ff5e7e'
              }}>Быстрая доставка</h3>
              <p style={{ color: '#666' }}>
                Доставляем букеты в день заказа по всему городу
              </p>
            </div>

            <div className="card fade-in" style={{
              textAlign: 'center',
              padding: '30px'
            }}>
              <div style={{
                fontSize: '40px',
                marginBottom: '20px'
              }}>💐</div>
              <h3 style={{
                fontSize: '20px',
                marginBottom: '15px',
                color: '#ff5e7e'
              }}>Свежие цветы</h3>
              <p style={{ color: '#666' }}>
                Работаем только со свежими цветами от проверенных поставщиков
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 