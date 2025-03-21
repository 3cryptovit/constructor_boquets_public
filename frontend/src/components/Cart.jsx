import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Получаем токен авторизации из localStorage
    const userToken = localStorage.getItem("token");
    const userIdFromStorage = localStorage.getItem("userId");

    // Проверяем, есть ли токен и userId
    if (!userToken || !userIdFromStorage) {
      setError("Для просмотра корзины необходимо авторизоваться");
      setLoading(false);
      return;
    }

    setToken(userToken);
    setUserId(userIdFromStorage);

    // Запрашиваем содержимое корзины
    fetch(`http://localhost:5000/api/cart/${userIdFromStorage}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    })
      .then(response => {
        if (!response.ok) {
          console.error("Ошибка ответа:", response.status, response.statusText);
          throw new Error('Ошибка загрузки корзины');
        }
        return response.json();
      })
      .then(data => {
        setCart(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Ошибка загрузки корзины:", error);
        setError("Не удалось загрузить корзину");
        setLoading(false);
      });
  }, []);

  const removeFromCart = (cartItemId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Требуется авторизация");
      return;
    }

    fetch(`http://localhost:5000/api/cart/${cartItemId}`, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Ошибка удаления товара");
        }
        return res.json();
      })
      .then(() => {
        setCart(cart.filter(item => item.id !== cartItemId));
      })
      .catch(error => {
        console.error("Ошибка удаления:", error);
        setError("Не удалось удалить товар");
      });
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Требуется авторизация");
      return;
    }

    fetch(`http://localhost:5000/api/cart/${cartItemId}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity: newQuantity })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Ошибка обновления количества");
        }
        return res.json();
      })
      .then(() => {
        setCart(cart.map(item => {
          if (item.id === cartItemId) {
            return { ...item, quantity: newQuantity };
          }
          return item;
        }));
      })
      .catch(error => {
        console.error("Ошибка обновления:", error);
        setError("Не удалось обновить количество");
      });
  };

  const placeOrder = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      setError("Требуется авторизация");
      return;
    }

    if (cart.length === 0) {
      setError("Корзина пуста");
      return;
    }

    fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Ошибка оформления заказа");
        }
        return res.json();
      })
      .then(data => {
        setCart([]);
        setOrderPlaced(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      })
      .catch(error => {
        console.error("Ошибка оформления заказа:", error);
        setError("Не удалось оформить заказ");
      });
  };

  if (loading) {
    return <div style={styles.container}><p>Загрузка корзины...</p></div>;
  }

  if (error && !cart.length) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🛒 Корзина</h1>
        <p style={styles.error}>{error}</p>
        <button
          style={styles.loginButton}
          onClick={() => navigate('/login')}
        >
          Войти в аккаунт
        </button>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🎉 Заказ оформлен!</h1>
        <p style={styles.successMessage}>Спасибо за покупку! Мы уже готовим ваш заказ.</p>
        <p>Вы будете перенаправлены на главную страницу через несколько секунд...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🛒 Корзина</h1>
      {error && <p style={styles.error}>{error}</p>}

      {cart.length === 0 ? (
        <div>
          <p style={styles.empty}>Корзина пуста</p>
          <button
            style={styles.continueButton}
            onClick={() => navigate('/catalog')}
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div>
          <div style={styles.cartList}>
            {cart.map(item => (
              <div key={item.id} style={styles.item}>
                <div style={styles.itemImage}>
                  <img
                    src={item.image_url || `/assets/boquet_${item.bouquet_id}.webp`}
                    alt={item.name}
                    style={styles.image}
                  />
                </div>
                <div style={styles.itemDetails}>
                  <h2 style={styles.itemName}>{item.name}</h2>
                  <p style={styles.itemDescription}>{item.description}</p>
                  <p style={styles.price}>Цена за шт: {item.price} ₽</p>
                  <div style={styles.quantityControls}>
                    <button
                      style={styles.quantityButton}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span style={styles.quantity}>{item.quantity}</span>
                    <button
                      style={styles.quantityButton}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <p style={styles.itemTotal}>
                    Итого: {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                  </p>
                  <button
                    style={styles.removeButton}
                    onClick={() => removeFromCart(item.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.summary}>
            <h2 style={styles.total}>
              Итого: {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('ru-RU')} ₽
            </h2>
            <button
              style={styles.checkout}
              onClick={placeOrder}
            >
              Оформить заказ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif"
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "30px",
    color: "#333",
    textAlign: "center"
  },
  error: {
    color: "#f44336",
    marginBottom: "20px",
    textAlign: "center"
  },
  empty: {
    fontSize: "1.2rem",
    textAlign: "center",
    margin: "30px 0"
  },
  cartList: {
    marginBottom: "30px"
  },
  item: {
    display: "flex",
    padding: "20px",
    marginBottom: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    backgroundColor: "#fff"
  },
  itemImage: {
    flex: "0 0 120px",
    marginRight: "20px",
    borderRadius: "6px",
    overflow: "hidden"
  },
  image: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    borderRadius: "6px"
  },
  itemDetails: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  itemName: {
    fontSize: "1.4rem",
    marginBottom: "5px",
    color: "#333"
  },
  itemDescription: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "10px",
    maxHeight: "40px",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  price: {
    fontSize: "1.1rem",
    color: "#ff4081",
    marginBottom: "10px"
  },
  quantityControls: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px"
  },
  quantityButton: {
    background: "#f0f0f0",
    color: "#333",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "none",
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  quantity: {
    padding: "0 15px",
    fontSize: "1.1rem"
  },
  itemTotal: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#ff4081",
    marginBottom: "10px"
  },
  removeButton: {
    background: "transparent",
    color: "#ff4081",
    border: "1px solid #ff4081",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.9rem",
    alignSelf: "flex-start"
  },
  summary: {
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    marginTop: "20px"
  },
  total: {
    fontSize: "1.8rem",
    marginBottom: "20px",
    color: "#333",
    textAlign: "right"
  },
  checkout: {
    background: "#ff4081",
    color: "white",
    border: "none",
    padding: "15px 30px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.2rem",
    width: "100%",
    fontWeight: "bold",
    transition: "background 0.3s ease"
  },
  continueButton: {
    background: "#ff4081",
    color: "white",
    border: "none",
    padding: "12px 25px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.1rem",
    display: "block",
    margin: "20px auto",
    transition: "background 0.3s ease"
  },
  loginButton: {
    background: "#ff4081",
    color: "white",
    border: "none",
    padding: "12px 25px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.1rem",
    display: "block",
    margin: "20px auto",
    transition: "background 0.3s ease"
  },
  successMessage: {
    fontSize: "1.3rem",
    color: "#43a047",
    textAlign: "center",
    margin: "20px 0"
  }
};

export default Cart;
