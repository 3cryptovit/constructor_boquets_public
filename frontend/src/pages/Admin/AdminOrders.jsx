import React, { useState, useEffect } from "react";
import './AdminPanel.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Загрузка заказов
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/admin/orders", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить заказы");
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
      console.error("Ошибка при загрузке заказов:", err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка деталей заказа
  const fetchOrderItems = async (orderId) => {
    setLoadingItems(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить детали заказа");
      }

      const data = await response.json();
      setOrderItems(data);
      setSelectedOrder(orderId);
    } catch (err) {
      console.error("Ошибка при загрузке деталей заказа:", err);
      alert(err.message);
    } finally {
      setLoadingItems(false);
    }
  };

  // Обновление статуса заказа
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error("Не удалось обновить статус заказа");
      }

      // Обновляем статус в списке заказов
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      alert("Статус заказа успешно обновлен!");
    } catch (err) {
      console.error("Ошибка при обновлении статуса заказа:", err);
      alert(err.message);
    }
  };

  // Функция для отображения статуса на русском языке
  const getStatusText = (status) => {
    const statuses = {
      'pending': 'Ожидается',
      'processing': 'В обработке',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'canceled': 'Отменен'
    };
    return statuses[status] || status;
  };

  // Функция для отображения даты в локальном формате
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

  if (loading) {
    return <div className="admin-loading">Загрузка заказов...</div>;
  }

  if (error) {
    return <div className="admin-error">Ошибка: {error}</div>;
  }

  return (
    <div className="admin-orders">
      <div className="admin-header">
        <h2>Управление заказами</h2>
      </div>

      <div className="admin-orders-container">
        <div className="admin-orders-list">
          {orders.length === 0 ? (
            <p>Заказы не найдены</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Дата</th>
                  <th>Клиент</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr
                    key={order.id}
                    className={selectedOrder === order.id ? 'selected' : ''}
                  >
                    <td>{order.id}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>{order.username}</td>
                    <td>{order.total_price} ₽</td>
                    <td className={`status status-${order.status}`}>
                      {getStatusText(order.status)}
                    </td>
                    <td>
                      <button
                        className="admin-button"
                        onClick={() => fetchOrderItems(order.id)}
                      >
                        Просмотр
                      </button>
                      <select
                        className="status-select"
                        defaultValue={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="pending">Ожидается</option>
                        <option value="processing">В обработке</option>
                        <option value="shipped">Отправлен</option>
                        <option value="delivered">Доставлен</option>
                        <option value="canceled">Отменен</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedOrder && (
          <div className="admin-order-details">
            <h3>Состав заказа #{selectedOrder}</h3>

            {loadingItems ? (
              <div className="admin-loading">Загрузка деталей заказа...</div>
            ) : orderItems.length === 0 ? (
              <p>Товары в заказе не найдены</p>
            ) : (
              <table className="admin-table details-table">
                <thead>
                  <tr>
                    <th>Изображение</th>
                    <th>Название</th>
                    <th>Количество</th>
                    <th>Цена</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <img
                          src={item.image_url && item.image_url.startsWith('/uploads')
                            ? `http://localhost:5000${item.image_url}`
                            : item.image_url || "/placeholder.jpg"}
                          alt={item.name}
                          className="admin-image small"
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.price} ₽</td>
                      <td>{(item.price * item.quantity).toFixed(2)} ₽</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="total-label">Итого:</td>
                    <td className="total-value">
                      {orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} ₽
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            <button
              className="admin-button"
              onClick={() => setSelectedOrder(null)}
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders; 