import React, { useState, useEffect } from "react";
import './AdminPanel.css';
import formatImageUrl from "../../utils/imageUrl";

const AdminBouquets = () => {
  const [bouquets, setBouquets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Состояние для нового букета
  const [newBouquet, setNewBouquet] = useState({
    name: "",
    description: "",
    price: "",
    image: null
  });

  // Загрузка букетов
  useEffect(() => {
    fetchBouquets();
  }, []);

  const fetchBouquets = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/admin/bouquets", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить букеты");
      }

      const data = await response.json();
      setBouquets(data);
    } catch (err) {
      setError(err.message);
      console.error("Ошибка при загрузке букетов:", err);
    } finally {
      setLoading(false);
    }
  };

  // Обработка изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBouquet({
      ...newBouquet,
      [name]: name === "price" ? parseFloat(value) || "" : value
    });
  };

  // Обработка загрузки изображения
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setNewBouquet({
        ...newBouquet,
        image: e.target.files[0]
      });
    }
  };

  // Добавление нового букета
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Проверка обязательных полей
      if (!newBouquet.name || !newBouquet.description || !newBouquet.price) {
        throw new Error("Заполните все обязательные поля");
      }

      const token = localStorage.getItem("token");

      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append("name", newBouquet.name);
      formData.append("description", newBouquet.description);
      formData.append("price", newBouquet.price);
      if (newBouquet.image) {
        formData.append("image", newBouquet.image);
      }

      const response = await fetch("http://localhost:5000/api/admin/bouquets", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Не удалось добавить букет");
      }

      const data = await response.json();

      // Добавляем новый букет в список и сбрасываем форму
      setBouquets([data, ...bouquets]);
      setNewBouquet({
        name: "",
        description: "",
        price: "",
        image: null
      });
      setShowForm(false);

      alert("Букет успешно добавлен!");
    } catch (err) {
      alert(err.message);
      console.error("Ошибка при добавлении букета:", err);
    }
  };

  // Удаление букета
  const handleDelete = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот букет?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5000/api/admin/bouquets/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить букет");
      }

      // Удаляем букет из списка
      setBouquets(bouquets.filter(bouquet => bouquet.id !== id));
      alert("Букет успешно удален!");
    } catch (err) {
      alert(err.message);
      console.error("Ошибка при удалении букета:", err);
    }
  };

  if (loading) {
    return <div className="admin-loading">Загрузка букетов...</div>;
  }

  if (error) {
    return <div className="admin-error">Ошибка: {error}</div>;
  }

  return (
    <div className="admin-bouquets">
      <div className="admin-header">
        <h2>Управление букетами</h2>
        <button
          className="admin-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Отменить" : "Добавить букет"}
        </button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название:</label>
            <input
              type="text"
              name="name"
              value={newBouquet.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Описание:</label>
            <textarea
              name="description"
              value={newBouquet.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Цена (₽):</label>
            <input
              type="number"
              name="price"
              value={newBouquet.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Изображение:</label>
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="admin-button primary">
              Сохранить
            </button>
            <button
              type="button"
              className="admin-button"
              onClick={() => setShowForm(false)}
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="admin-list">
        {bouquets.length === 0 ? (
          <p>Букеты не найдены</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Изображение</th>
                <th>Название</th>
                <th>Описание</th>
                <th>Цена</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {bouquets.map(bouquet => (
                <tr key={bouquet.id}>
                  <td>{bouquet.id}</td>
                  <td>
                    <img
                      src={formatImageUrl(bouquet.image_url, "/placeholder.jpg")}
                      alt={bouquet.name}
                      className="admin-image"
                    />
                  </td>
                  <td>{bouquet.name}</td>
                  <td className="description-cell">{bouquet.description}</td>
                  <td>{bouquet.price} ₽</td>
                  <td>
                    <button
                      className="admin-button delete"
                      onClick={() => handleDelete(bouquet.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminBouquets; 