import React from "react";
import { useNavigate } from "react-router-dom";
import useFavoritesStore from "../store/useFavoritesStore";
import useCartStore from "../store/useCartStore";
import formatImageUrl from "../utils/imageUrl";

function Favorites() {
  const { favorites, removeFromFavorites } = useFavoritesStore();
  const { addToCart } = useCartStore();
  const navigate = useNavigate();

  const handleAddToCart = (bouquet) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      if (window.confirm("Для добавления в корзину необходимо войти. Перейти на страницу входа?")) {
        navigate('/login');
      }
      return;
    }

    console.log("Добавление в корзину из избранного:", bouquet.id);
    console.log("Токен:", token);
    console.log("ID пользователя:", userId);

    fetch("http://localhost:5000/api/cart", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        bouquetId: bouquet.id,
        quantity: 1
      })
    })
      .then(response => {
        if (!response.ok) {
          console.error("Ошибка ответа:", response.status, response.statusText);
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
        alert("Не удалось добавить букет в корзину");
      });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Избранные букеты</h1>

      {favorites.length === 0 ? (
        <div style={styles.emptyState}>
          <p>У вас пока нет избранных букетов</p>
          <button
            style={styles.catalogButton}
            onClick={() => navigate('/catalog')}
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <>
          <p style={styles.subtitle}>Букеты, которые вы добавили в избранное</p>

          <div style={styles.grid}>
            {favorites.map((bouquet) => (
              <div key={bouquet.id} style={styles.card}>
                <div
                  style={{
                    ...styles.cardImage,
                    backgroundImage: `url('${formatImageUrl(bouquet.image_url, "https://via.placeholder.com/300x300?text=Bouquet")}')`
                  }}
                >
                  <div style={styles.price}>{bouquet.price} ₽</div>
                  <button
                    style={styles.removeButton}
                    onClick={() => removeFromFavorites(bouquet.id)}
                  >
                    ×
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
        </>
      )}
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
  emptyState: {
    marginTop: "50px",
    padding: "40px",
    background: "#f8f8f8",
    borderRadius: "10px"
  },
  catalogButton: {
    background: "#ff4081",
    color: "white",
    border: "none",
    padding: "12px 25px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: "bold",
    marginTop: "20px"
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
    transition: "transform 0.4s ease, box-shadow 0.4s ease"
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
  removeButton: {
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
    fontSize: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0
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
  }
};

export default Favorites; 