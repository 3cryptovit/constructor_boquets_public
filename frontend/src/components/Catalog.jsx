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
    <div style={styles.container}>
      <h1 style={styles.title}>Каталог букетов</h1>
      <p style={styles.subtitle}>Выберите готовый букет или создайте свой в нашем конструкторе</p>

      <div style={styles.grid}>
        {displayBouquets.map((bouquet, index) => (
          <div key={bouquet.id} style={{ ...styles.card, animationDelay: `${index * 0.1}s` }}>
            <div
              style={{
                ...styles.cardImage,
                backgroundImage: `url('${bouquet.image_url || "https://via.placeholder.com/300x300?text=Bouquet"}')`
              }}
            >
              <div style={styles.price}>{bouquet.price} ₽</div>
              <button
                style={styles.favoriteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(bouquet);
                }}
              >
                {isFavorite(bouquet.id) ? "❤️" : "🤍"}
              </button>
            </div>
            <div style={styles.cardContent}>
              <h2 style={styles.cardTitle}>{bouquet.name}</h2>
              <p style={styles.cardDescription}>{bouquet.description || "Красивый букет цветов"}</p>
              <div style={styles.cardActions}>
                <button
                  style={styles.addButton}
                  onClick={() => handleAddToCart(bouquet)}
                >
                  В корзину
                </button>
                <button
                  style={styles.viewButton}
                  onClick={() => navigate(`/bouquet/${bouquet.id}`)}
                >
                  Подробнее
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.constructorPromo}>
        <h2>Хотите создать свой уникальный букет?</h2>
        <p>Используйте наш конструктор букетов, чтобы собрать композицию вашей мечты!</p>
        <button
          style={styles.constructorButton}
          onClick={() => navigate('/constructor')}
        >
          Перейти в конструктор
        </button>
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
  title: {
    fontSize: "2.5rem",
    marginBottom: "10px",
    color: "#333"
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "#666",
    marginBottom: "40px"
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "30px",
    justifyItems: "center"
  },
  card: {
    width: "100%",
    maxWidth: "300px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    overflow: "hidden",
    transition: "transform 0.4s ease, box-shadow 0.4s ease",
    animation: "fadeIn 0.6s ease forwards",
    opacity: 0,
    transform: "translateY(20px)",
    ":hover": {
      transform: "translateY(-10px)",
      boxShadow: "0 10px 20px rgba(0,0,0,0.15)"
    }
  },
  cardImage: {
    height: "200px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative"
  },
  price: {
    position: "absolute",
    right: "10px",
    top: "10px",
    background: "#ff4081",
    color: "white",
    padding: "5px 10px",
    borderRadius: "20px",
    fontWeight: "bold"
  },
  cardContent: {
    padding: "20px"
  },
  cardTitle: {
    fontSize: "1.4rem",
    margin: "0 0 10px 0",
    color: "#333"
  },
  cardDescription: {
    color: "#666",
    fontSize: "0.95rem",
    margin: "0 0 20px 0",
    height: "40px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical"
  },
  cardActions: {
    display: "flex",
    justifyContent: "space-between"
  },
  addButton: {
    background: "#ff4081",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background 0.3s ease",
    fontWeight: "bold",
    flex: "1",
    marginRight: "10px"
  },
  viewButton: {
    background: "transparent",
    color: "#ff4081",
    border: "1px solid #ff4081",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "bold",
    flex: "1"
  },
  constructorPromo: {
    margin: "60px 0 20px",
    padding: "30px",
    background: "#f8f8f8",
    borderRadius: "10px"
  },
  constructorButton: {
    background: "#4CAF50",
    color: "white",
    border: "none",
    padding: "12px 25px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: "bold",
    marginTop: "15px",
    transition: "background 0.3s ease"
  },
  favoriteButton: {
    position: "absolute",
    left: "10px",
    top: "10px",
    background: "rgba(255, 255, 255, 0.7)",
    color: "#ff4081",
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.3s ease",
    padding: 0
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
