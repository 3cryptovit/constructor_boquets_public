import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useFavoritesStore from "../store/useFavoritesStore";
import formatImageUrl from "../utils/imageUrl";

function BouquetDetails() {
  const [bouquet, setBouquet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore();

  useEffect(() => {
    fetch(`http://localhost:5000/api/bouquets/${id}`)
      .then(response => {
        if (!response.ok) {
          console.error("Ошибка запроса:", response.status, response.statusText);
          // Если 404, используем временные данные вместо ошибки
          if (response.status === 404) {
            // Устанавливаем временный букет для демонстрации
            setBouquet({
              id: parseInt(id),
              name: "Демо-букет " + id,
              description: "Это временный букет, используемый для демонстрации. Настоящие букеты появятся после заполнения базы данных.",
              price: 3500 + (id * 100),
              image_url: `/assets/boquet_${(parseInt(id) % 4) + 1}.webp`,
              flowers: [
                { name: "Роза", color: "красный" },
                { name: "Гербера", color: "оранжевый" },
                { name: "Лилия", color: "белый" }
              ]
            });
            setLoading(false);
            return null; // Прерываем цепочку промисов
          }
          throw new Error('Ошибка загрузки данных');
        }
        return response.json();
      })
      .then(data => {
        if (data) {
          console.log("Получены данные букета:", data);
          setBouquet(data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Ошибка загрузки букета:", error);
        setError("Не удалось загрузить информацию о букете");
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      if (window.confirm("Для добавления в корзину необходимо войти. Перейти на страницу входа?")) {
        navigate('/login');
      }
      return;
    }

    fetch("http://localhost:5000/api/cart", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        bouquetId: id,
        quantity: 1
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка добавления в корзину');
        }
        return response.json();
      })
      .then(data => {
        alert("Букет добавлен в корзину!");
      })
      .catch(error => {
        console.error("Ошибка:", error);
        alert("Не удалось добавить букет в корзину");
      });
  };

  const handleToggleFavorite = () => {
    if (!bouquet) return;

    if (isFavorite(bouquet.id)) {
      removeFromFavorites(bouquet.id);
    } else {
      addToFavorites(bouquet);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}></div>
        <p>Загрузка информации о букете...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Ошибка</h1>
        <p style={styles.error}>{error}</p>
        <button
          style={styles.button}
          onClick={() => navigate('/catalog')}
        >
          Вернуться в каталог
        </button>
      </div>
    );
  }

  // Если букета нет в базе, используем заглушку
  const displayBouquet = bouquet || {
    id: parseInt(id),
    name: "Красивый букет",
    description: "Подробное описание букета пока недоступно",
    price: 3500,
    image_url: "https://images.unsplash.com/photo-1584278773612-ba99fb465562?w=500&auto=format&fit=crop"
  };

  return (
    <div style={styles.container}>
      <button
        style={styles.backButton}
        onClick={() => navigate('/catalog')}
      >
        ← Назад к каталогу
      </button>

      <div style={styles.content}>
        <div style={styles.imageContainer}>
          <img
            src={formatImageUrl(displayBouquet.image_url, "https://via.placeholder.com/500x500?text=Bouquet")}
            alt={displayBouquet.name}
            style={styles.image}
          />
        </div>

        <div style={styles.details}>
          <div style={styles.titleContainer}>
            <h1 style={styles.title}>{displayBouquet.name}</h1>
            <button
              style={styles.favoriteButton}
              onClick={handleToggleFavorite}
            >
              {isFavorite(parseInt(id)) ? "❤️ В избранном" : "🤍 В избранное"}
            </button>
          </div>
          <p style={styles.price}>{displayBouquet.price} ₽</p>
          <div style={styles.divider}></div>
          <p style={styles.description}>{displayBouquet.description || "Описание букета отсутствует"}</p>

          {displayBouquet.flowers && displayBouquet.flowers.length > 0 && (
            <div style={styles.flowersList}>
              <h3>Состав букета:</h3>
              <ul>
                {displayBouquet.flowers.map((flower, index) => (
                  <li key={index}>{flower.name} - {flower.color}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={styles.actions}>
            <button
              style={styles.addToCartButton}
              onClick={handleAddToCart}
            >
              Добавить в корзину
            </button>
            <button
              style={styles.constructorButton}
              onClick={() => navigate('/constructor')}
            >
              Создать похожий букет
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
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
  backButton: {
    background: "transparent",
    border: "none",
    color: "#333",
    fontSize: "1.1rem",
    cursor: "pointer",
    padding: "10px 0",
    marginBottom: "20px",
    display: "inline-block"
  },
  content: {
    display: "flex",
    flexDirection: "row",
    gap: "40px",
    flexWrap: "wrap"
  },
  imageContainer: {
    flex: "1 1 400px",
    minWidth: "300px"
  },
  image: {
    width: "100%",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  details: {
    flex: "1 1 400px",
    minWidth: "300px"
  },
  title: {
    fontSize: "2.5rem",
    color: "#333",
    marginTop: "0",
    marginBottom: "15px"
  },
  price: {
    fontSize: "1.8rem",
    color: "#ff4081",
    fontWeight: "bold",
    marginBottom: "20px"
  },
  divider: {
    height: "1px",
    background: "#eee",
    marginBottom: "20px"
  },
  description: {
    fontSize: "1.2rem",
    color: "#666",
    lineHeight: "1.6",
    marginBottom: "30px"
  },
  flowersList: {
    marginBottom: "30px"
  },
  actions: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap"
  },
  addToCartButton: {
    background: "#ff4081",
    color: "white",
    border: "none",
    padding: "15px 30px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.2rem",
    fontWeight: "bold",
    transition: "background 0.3s ease"
  },
  constructorButton: {
    background: "transparent",
    color: "#ff4081",
    border: "1px solid #ff4081",
    padding: "15px 30px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.2rem",
    fontWeight: "bold",
    transition: "all 0.3s ease"
  },
  error: {
    color: "#f44336",
    fontSize: "1.2rem",
    marginBottom: "20px"
  },
  button: {
    background: "#ff4081",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.1rem"
  },
  titleContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px"
  },
  favoriteButton: {
    display: "flex",
    alignItems: "center",
    background: "transparent",
    color: "#ff4081",
    border: "1px solid #ff4081",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.3s ease"
  }
};

export default BouquetDetails; 