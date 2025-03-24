import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCartStore from "../store/useCartStore";
import useFavoritesStore from "../store/useFavoritesStore";

function Catalog() {
  const { addToCart } = useCartStore();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore();
  const [bouquets, setBouquets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    setToken(storedToken);
    setUserId(storedUserId);

    fetch("http://localhost:5000/api/bouquets")
      .then((response) => {
        if (!response.ok) {
          console.error("Ошибка запроса:", response.status, response.statusText);
          // При ошибке загрузки показываем демо-букеты и не выбрасываем ошибку
          setLoading(false);
          return { bouquets: [] }; // Возвращаем пустой массив
        }
        return response.json();
      })
      .then((data) => {
        if (data && Array.isArray(data)) {
          console.log("Загружено букетов с сервера:", data.length);
          setBouquets(data);
        } else {
          console.log("Получены некорректные данные с сервера:", data);
          // При некорректных данных оставляем пустой массив
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Ошибка загрузки букетов:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const handleAddToCart = (bouquet) => {
    // Получаем актуальные значения из localStorage при каждом вызове функции
    const currentToken = localStorage.getItem("token");
    const currentUserId = localStorage.getItem("userId");

    if (!currentToken || !currentUserId) {
      alert("Для добавления в корзину необходимо войти в аккаунт");
      navigate('/login');
      return;
    }

    console.log("Добавляем букет в корзину:", bouquet.id);
    console.log("Токен аутентификации:", currentToken);
    console.log("ID пользователя:", currentUserId);

    // Проверяем, есть ли букет из демо-данных
    const isDemoBouquet = !bouquet.id || bouquet.id > 100;

    // Если это демо-букет, сначала создаем его в базе
    if (isDemoBouquet) {
      alert("Букет доступен только для просмотра. Выберите букет из каталога.");
      return;
    }

    fetch("http://localhost:5000/api/cart", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        userId: currentUserId,
        bouquetId: bouquet.id,
        quantity: 1
      })
    })
      .then(response => {
        if (!response.ok) {
          console.error("Ошибка ответа:", response.status, response.statusText);
          if (response.status === 404) {
            throw new Error('Букет не найден в базе данных');
          }
          throw new Error('Ошибка добавления в корзину');
        }
        return response.json();
      })
      .then(data => {
        addToCart(bouquet);
        alert("Букет добавлен в корзину!");
      })
      .catch(error => {
        console.error("Ошибка:", error);
        alert("Не удалось добавить букет в корзину: " + error.message);
      });
  };

  const handleToggleFavorite = (bouquet) => {
    if (isFavorite(bouquet.id)) {
      removeFromFavorites(bouquet.id);
    } else {
      addToFavorites(bouquet);
    }
  };

  if (loading) {
    return <div style={styles.container}><div style={styles.loader}></div></div>;
  }

  if (error) {
    return <div style={styles.container}>Ошибка: {error}</div>;
  }

  // Если букетов нет, добавим временные данные для демонстрации
  const displayBouquets = bouquets.length > 0 ? bouquets : [
    {
      id: 1,
      name: "Весенний поцелуй",
      description: "Нежный букет из розовых тюльпанов, лилий и ирисов",
      price: 3500,
      image_url: "/assets/boquet_1.webp"
    },
    {
      id: 2,
      name: "Парижский шарм",
      description: "Элегантный букет из пионов, ранункулюсов и роз",
      price: 4200,
      image_url: "/assets/boquet_2.webp"
    },
    {
      id: 3,
      name: "Нежность облаков",
      description: "Воздушный букет из белых роз и эвкалипта",
      price: 3800,
      image_url: "/assets/boquet_3.webp"
    },
    {
      id: 4,
      name: "Тропический рай",
      description: "Яркий букет из экзотических орхидей и стрелиций",
      price: 5500,
      image_url: "/assets/boquet_4.webp"
    }
  ];

  return (
    <div className="main-content" style={{
      padding: '60px 0',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="container">
        <h2 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Каталог букетов
        </h2>

        <div className="bouquet-grid">
          {displayBouquets.map((bouquet) => (
            <div key={bouquet.id} className="card fade-in">
              <div style={{
                position: 'relative',
                paddingTop: '75%',
                overflow: 'hidden',
                borderRadius: '8px'
              }}>
                <img
                  src={bouquet.image_url}
                  alt={bouquet.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                />
              </div>

              <div style={{
                padding: '20px 0'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '10px'
                }}>
                  {bouquet.name}
                </h3>

                <p style={{
                  color: '#666',
                  marginBottom: '20px',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  {bouquet.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#ff5e7e'
                  }}>
                    {bouquet.price} ₽
                  </span>

                  <button
                    className="btn"
                    style={styles.addButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(bouquet);
                    }}
                  >
                    В корзину
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    textAlign: "center",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  loader: {
    border: "6px solid #f3f3f3",
    borderTop: "6px solid #ff4081",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    animation: "spin 1s linear infinite",
    margin: "50px auto"
  },
  addButton: {
    padding: '10px 20px',
    fontSize: '14px'
  }
};

// Добавляем глобальные стили для анимаций
const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes fadeIn {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .catalog-item {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .catalog-item:hover {
    transform: translateY(-10px);
    box-shadow: 0 12px 20px rgba(0,0,0,0.2);
  }
`;

if (!document.head.querySelector('#catalog-animations')) {
  styleTag.id = 'catalog-animations';
  document.head.appendChild(styleTag);
}

export default Catalog;
