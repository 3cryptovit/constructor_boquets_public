import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [bouquets, setBouquets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bouquets'); // 'bouquets' или 'users'
  const navigate = useNavigate();

  // Новый букет
  const [newBouquet, setNewBouquet] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
  });

  useEffect(() => {
    // Проверка прав администратора
    const userRole = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");

    if (!token || userRole !== 'admin') {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    // Загружаем букеты
    loadBouquets();

    // Загружаем пользователей, если у нас права админа
    if (userRole === 'admin') {
      loadUsers();
    }
  }, []);

  const loadBouquets = () => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/bouquets")
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ошибка загрузки данных');
        }
        return response.json();
      })
      .then((data) => {
        setBouquets(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Ошибка загрузки букетов:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  const loadUsers = () => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/users", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ошибка загрузки пользователей');
        }
        return response.json();
      })
      .then((data) => {
        setUsers(data);
      })
      .catch((error) => {
        console.error("Ошибка загрузки пользователей:", error);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBouquet({
      ...newBouquet,
      [name]: name === "price" ? parseFloat(value) || "" : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Проверка заполнения полей
    if (!newBouquet.name || !newBouquet.description || !newBouquet.price) {
      alert("Пожалуйста, заполните все обязательные поля");
      return;
    }

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    // Отправка запроса на создание букета
    fetch("http://localhost:5000/api/bouquets", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...newBouquet,
        user_id: userId,
        image_url: newBouquet.image_url || "/assets/bouquet_1.jpg" // Дефолтное изображение, если не указано
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка добавления букета');
        }
        return response.json();
      })
      .then(data => {
        // Добавляем новый букет в список
        setBouquets([...bouquets, data]);
        // Сбрасываем форму
        setNewBouquet({
          name: "",
          description: "",
          price: "",
          image_url: "",
        });
        alert("Букет успешно добавлен!");
      })
      .catch(error => {
        console.error("Ошибка:", error);
        alert("Не удалось добавить букет");
      });
  };

  const handleDeleteBouquet = (bouquetId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот букет?")) {
      return;
    }

    const token = localStorage.getItem("token");

    fetch(`http://localhost:5000/api/bouquets/${bouquetId}`, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка удаления букета');
        }
        // Удаляем букет из списка
        setBouquets(bouquets.filter(b => b.id !== bouquetId));
        alert("Букет успешно удален!");
      })
      .catch(error => {
        console.error("Ошибка:", error);
        alert("Не удалось удалить букет");
      });
  };

  const handleMakeAdmin = (userId) => {
    if (!window.confirm("Вы уверены, что хотите назначить этого пользователя администратором?")) {
      return;
    }

    const token = localStorage.getItem("token");

    fetch(`http://localhost:5000/api/users/${userId}/make-admin`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка назначения прав администратора');
        }
        return response.json();
      })
      .then(() => {
        // Обновляем список пользователей
        loadUsers();
        alert("Пользователь назначен администратором!");
      })
      .catch(error => {
        console.error("Ошибка:", error);
        alert("Не удалось назначить пользователя администратором");
      });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Доступ запрещен</h1>
        <p>У вас нет прав администратора для доступа к этой странице.</p>
        <button
          style={styles.button}
          onClick={() => navigate('/catalog')}
        >
          Вернуться в каталог
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Панель администратора</h1>

      {/* Табы для переключения между разделами */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tabButton,
            background: activeTab === 'bouquets' ? '#ff4081' : '#f1f1f1',
            color: activeTab === 'bouquets' ? 'white' : '#333'
          }}
          onClick={() => setActiveTab('bouquets')}
        >
          Управление букетами
        </button>
        <button
          style={{
            ...styles.tabButton,
            background: activeTab === 'users' ? '#ff4081' : '#f1f1f1',
            color: activeTab === 'users' ? 'white' : '#333'
          }}
          onClick={() => setActiveTab('users')}
        >
          Управление пользователями
        </button>
      </div>

      {activeTab === 'bouquets' ? (
        <>
          {/* Форма добавления букета */}
          <div style={styles.formContainer}>
            <h2>Добавить новый букет</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="name">Название букета *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newBouquet.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="description">Описание *</label>
                <textarea
                  id="description"
                  name="description"
                  value={newBouquet.description}
                  onChange={handleInputChange}
                  style={{ ...styles.input, height: "100px" }}
                  required
                ></textarea>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="price">Цена (₽) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={newBouquet.price}
                  onChange={handleInputChange}
                  style={styles.input}
                  min="0"
                  step="100"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="image_url">URL изображения</label>
                <input
                  type="text"
                  id="image_url"
                  name="image_url"
                  value={newBouquet.image_url}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="/assets/bouquet_1.jpg"
                />
              </div>

              <button type="submit" style={styles.submitButton}>
                Добавить букет
              </button>
            </form>
          </div>

          {/* Список букетов */}
          <div style={styles.bouquetList}>
            <h2>Существующие букеты</h2>

            {bouquets.length === 0 ? (
              <p>Букеты не найдены</p>
            ) : (
              <div style={styles.grid}>
                {bouquets.map((bouquet) => (
                  <div key={bouquet.id} style={styles.card}>
                    <div
                      style={{
                        ...styles.cardImage,
                        backgroundImage: `url('${bouquet.image_url || "/assets/bouquet_1.jpg"}')`
                      }}
                    ></div>
                    <div style={styles.cardContent}>
                      <h3>{bouquet.name}</h3>
                      <p>{bouquet.description.substring(0, 100)}...</p>
                      <p><strong>Цена: </strong>{bouquet.price} ₽</p>
                      <div style={styles.cardActions}>
                        <button
                          style={styles.editButton}
                          onClick={() => navigate(`/bouquet/${bouquet.id}`)}
                        >
                          Просмотр
                        </button>
                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDeleteBouquet(bouquet.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={styles.usersList}>
          <h2>Список пользователей</h2>

          {users.length === 0 ? (
            <p>Пользователи не найдены. Возможно, у вас нет доступа к просмотру пользователей.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>ID</th>
                  <th style={styles.tableHeader}>Имя пользователя</th>
                  <th style={styles.tableHeader}>Роль</th>
                  <th style={styles.tableHeader}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{user.id}</td>
                    <td style={styles.tableCell}>{user.username}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        backgroundColor: user.role === 'admin' ? '#4CAF50' : '#ff4081',
                        color: 'white',
                        fontSize: '0.9rem'
                      }}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      {user.role !== 'admin' && (
                        <button
                          style={styles.actionButton}
                          onClick={() => handleMakeAdmin(user.id)}
                        >
                          Сделать админом
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  title: {
    fontSize: "2.5rem",
    textAlign: "center",
    marginBottom: "30px"
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
  button: {
    background: "#ff4081",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.1rem",
    display: "block",
    margin: "20px auto"
  },
  tabs: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "30px"
  },
  tabButton: {
    padding: "12px 20px",
    margin: "0 10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.1rem",
    transition: "all 0.3s ease"
  },
  formContainer: {
    background: "#f8f8f8",
    padding: "30px",
    borderRadius: "10px",
    marginBottom: "40px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  input: {
    padding: "12px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    fontSize: "1rem"
  },
  submitButton: {
    background: "#4CAF50",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: "bold"
  },
  bouquetList: {
    marginTop: "40px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "30px"
  },
  card: {
    background: "#fff",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  cardImage: {
    height: "180px",
    backgroundSize: "cover",
    backgroundPosition: "center"
  },
  cardContent: {
    padding: "20px"
  },
  cardActions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px"
  },
  editButton: {
    background: "#4CAF50",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer"
  },
  deleteButton: {
    background: "#f44336",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer"
  },
  usersList: {
    marginTop: "40px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
    background: "#fff",
    borderRadius: "5px",
    overflow: "hidden",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  tableHeader: {
    padding: "15px",
    textAlign: "left",
    background: "#f8f8f8",
    borderBottom: "1px solid #ddd"
  },
  tableRow: {
    borderBottom: "1px solid #eee"
  },
  tableCell: {
    padding: "15px"
  },
  actionButton: {
    background: "#4CAF50",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.9rem"
  }
};

export default Admin; 