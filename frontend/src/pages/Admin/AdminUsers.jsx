import React, { useState, useEffect } from "react";
import './AdminPanel.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Загрузка пользователей
  useEffect(() => {
    fetchUsers();

    // Определяем текущего пользователя
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/admin/users", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить пользователей");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
      console.error("Ошибка при загрузке пользователей:", err);
    } finally {
      setLoading(false);
    }
  };

  // Обновление роли пользователя
  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error("Не удалось обновить роль пользователя");
      }

      const updatedUser = await response.json();

      // Обновляем роль в списке пользователей
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));

      // Если текущий пользователь изменил свою роль, обновляем localStorage
      if (currentUser && currentUser.id === userId) {
        const updatedCurrentUser = { ...currentUser, role: newRole };
        localStorage.setItem("user", JSON.stringify(updatedCurrentUser));
        setCurrentUser(updatedCurrentUser);
      }

      alert("Роль пользователя успешно обновлена!");
    } catch (err) {
      console.error("Ошибка при обновлении роли пользователя:", err);
      alert(err.message);
    }
  };

  // Удаление пользователя
  const deleteUser = async (userId) => {
    // Проверяем, не пытается ли админ удалить самого себя
    if (currentUser && currentUser.id === userId) {
      alert("Вы не можете удалить свою учетную запись!");
      return;
    }

    if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить пользователя");
      }

      // Удаляем пользователя из списка
      setUsers(users.filter(user => user.id !== userId));
      alert("Пользователь успешно удален!");
    } catch (err) {
      console.error("Ошибка при удалении пользователя:", err);
      alert(err.message);
    }
  };

  // Функция для отображения роли на русском языке
  const getRoleText = (role) => {
    const roles = {
      'user': 'Пользователь',
      'admin': 'Администратор'
    };
    return roles[role] || role;
  };

  // Функция для отображения даты в локальном формате
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

  if (loading) {
    return <div className="admin-loading">Загрузка пользователей...</div>;
  }

  if (error) {
    return <div className="admin-error">Ошибка: {error}</div>;
  }

  return (
    <div className="admin-users">
      <div className="admin-header">
        <h2>Управление пользователями</h2>
      </div>

      <div className="admin-list">
        {users.length === 0 ? (
          <p>Пользователи не найдены</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя пользователя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={currentUser && currentUser.id === user.id ? 'current-user' : ''}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td className={`role role-${user.role}`}>
                    {getRoleText(user.role)}
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <select
                      className="role-select"
                      defaultValue={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                    >
                      <option value="user">Пользователь</option>
                      <option value="admin">Администратор</option>
                    </select>

                    <button
                      className="admin-button delete"
                      onClick={() => deleteUser(user.id)}
                      disabled={currentUser && currentUser.id === user.id}
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

export default AdminUsers; 