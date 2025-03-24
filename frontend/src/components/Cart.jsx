import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Cart() {
  const [cart, setCart] = useState([]);
  const [customCart, setCustomCart] = useState([]); // Для кастомных букетов
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Получаем данные кастомных букетов из localStorage
    try {
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      console.log("Локальная корзина с кастомными букетами:", localCart);
      setCustomCart(localCart);
    } catch (e) {
      console.error("Ошибка при загрузке кастомных букетов:", e);
      setCustomCart([]);
    }

    // Получаем токен авторизации из localStorage
    const userToken = localStorage.getItem("token");
    const userIdFromStorage = localStorage.getItem("userId");

    // Проверяем, есть ли токен и userId
    if (!userToken || !userIdFromStorage) {
      setError("Для оформления заказа необходимо авторизоваться");
      setLoading(false);
      return;
    }

    setToken(userToken);
    setUserId(userIdFromStorage);

    console.log("Запрашиваем корзину для пользователя:", userIdFromStorage);

    // Запрашиваем содержимое корзины с сервера
    fetch('http://localhost:5000/api/cart', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    })
      .then(response => {
        console.log("Ответ от сервера:", response.status, response.statusText);
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.error("Ошибка авторизации:", response.status);
            throw new Error('Требуется авторизация');
          }
          throw new Error(`Ошибка загрузки корзины: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Данные корзины с сервера:", data);
        if (Array.isArray(data)) {
          setCart(data);
        } else {
          console.error("Получены некорректные данные:", data);
          setCart([]);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Ошибка загрузки корзины с сервера:", error);
        setError(error.message || "Не удалось загрузить корзину");
        setLoading(false);
      });
  }, []);

  // Функция для удаления букета из корзины на сервере
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

  // Обновление количества букетов на сервере
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

  // Функция для удаления кастомного букета из localStorage
  const removeCustomBouquet = (bouquetId) => {
    try {
      const updatedCart = customCart.filter(item => item.id !== bouquetId);
      setCustomCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (e) {
      console.error("Ошибка при удалении кастомного букета:", e);
      setError("Не удалось удалить букет из корзины");
    }
  };

  // Обновление количества кастомных букетов в localStorage
  const updateCustomQuantity = (bouquetId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const updatedCart = customCart.map(item => {
        if (item.id === bouquetId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });

      setCustomCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (e) {
      console.error("Ошибка при обновлении количества:", e);
      setError("Не удалось обновить количество букета");
    }
  };

  const placeOrder = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      setError("Требуется авторизация");
      return;
    }

    const hasItems = cart.length > 0 || customCart.length > 0;
    if (!hasItems) {
      setError("Корзина пуста");
      return;
    }

    // Объединяем данные корзины с сервера и из localStorage
    const allCartItems = [
      ...cart,
      ...customCart.map(item => ({
        ...item,
        isCustom: true
      }))
    ];

    fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        items: allCartItems
      })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Ошибка оформления заказа");
        }
        return res.json();
      })
      .then(data => {
        // Очищаем корзину
        setCart([]);
        setCustomCart([]);
        localStorage.removeItem('cart');

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

  if (loading && !customCart.length) {
    return <div style={styles.container}><p>Загрузка корзины...</p></div>;
  }

  if (error && !cart.length && !customCart.length) {
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

  // Объединяем обычные букеты и кастомные букеты для отображения
  const allItems = [...cart, ...customCart];
  // Считаем общую стоимость
  const total = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const hasItems = allItems.length > 0;

  return (
    <div className="main-content" style={{
      padding: '60px 0',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      minHeight: 'calc(100vh - 80px)'
    }}>
      <div className="container">
        <h2 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Корзина
        </h2>

        {!hasItems ? (
          <div className="card fade-in" style={{
            textAlign: 'center',
            padding: '40px'
          }}>
            <p style={{
              fontSize: '18px',
              color: '#666',
              marginBottom: '20px'
            }}>
              Ваша корзина пуста
            </p>
            <button
              className="btn"
              onClick={() => navigate('/catalog')}
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <div className="card fade-in">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Отображаем обычные букеты с сервера */}
              {cart.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '10px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
                }}>
                  <img
                    src={item.image_url || '/assets/default-bouquet.jpg'}
                    alt={item.name}
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '5px'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '5px' }}>{item.name}</h3>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                      {item.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      <div>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={styles.quantityButton}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span style={styles.quantityValue}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={styles.quantityButton}
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontWeight: 'bold' }}>
                        {item.price * item.quantity} ₽
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={styles.removeButton}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Отображаем кастомные букеты из localStorage */}
              {customCart.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '10px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
                  border: '1px dashed var(--primary-color)'
                }}>
                  <img
                    src={item.image_url || '/assets/custom-bouquet.jpg'}
                    alt={item.name}
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '5px'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '5px' }}>
                      {item.name}
                      <span style={{
                        fontSize: '12px',
                        color: 'var(--primary-color)',
                        marginLeft: '5px',
                        padding: '2px 5px',
                        background: 'rgba(255, 94, 126, 0.1)',
                        borderRadius: '3px'
                      }}>
                        Собран вами
                      </span>
                    </h3>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                      {item.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      <div>
                        <button
                          onClick={() => updateCustomQuantity(item.id, item.quantity - 1)}
                          style={styles.quantityButton}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span style={styles.quantityValue}>{item.quantity}</span>
                        <button
                          onClick={() => updateCustomQuantity(item.id, item.quantity + 1)}
                          style={styles.quantityButton}
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontWeight: 'bold' }}>
                        {item.price * item.quantity} ₽
                      </span>
                      <button
                        onClick={() => removeCustomBouquet(item.id)}
                        style={styles.removeButton}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '30px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #eee'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                Итого: {total} ₽
              </span>
              <button
                onClick={placeOrder}
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Оформить заказ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px'
  },
  error: {
    color: '#d32f2f',
    marginBottom: '20px'
  },
  loginButton: {
    background: '#ff4081',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  successMessage: {
    color: '#43a047',
    fontSize: '18px',
    marginBottom: '20px'
  },
  quantityButton: {
    border: '1px solid #ddd',
    background: 'white',
    width: '30px',
    height: '30px',
    borderRadius: '5px',
    cursor: 'pointer',
    margin: '0 5px'
  },
  quantityValue: {
    padding: '0 10px'
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '18px',
    marginLeft: 'auto'
  }
};

export default Cart;
