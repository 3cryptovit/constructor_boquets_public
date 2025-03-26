import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import AdminBouquets from "./AdminBouquets";
import AdminOrders from "./AdminOrders";
import AdminUsers from "./AdminUsers";
import './AdminPanel.css';

const AdminPanel = () => {
  const [tab, setTab] = useState("bouquets");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем роль пользователя при загрузке
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role === "admin") {
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="admin-loading">Загрузка...</div>;
  }

  // Если не админ, перенаправляем на главную
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="admin-panel">
      <h1 className="admin-title">Панель администратора</h1>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === "bouquets" ? "active" : ""}`}
          onClick={() => setTab("bouquets")}
        >
          Букеты
        </button>
        <button
          className={`admin-tab ${tab === "orders" ? "active" : ""}`}
          onClick={() => setTab("orders")}
        >
          Заказы
        </button>
        <button
          className={`admin-tab ${tab === "users" ? "active" : ""}`}
          onClick={() => setTab("users")}
        >
          Пользователи
        </button>
      </div>

      <div className="admin-content">
        {tab === "bouquets" && <AdminBouquets />}
        {tab === "orders" && <AdminOrders />}
        {tab === "users" && <AdminUsers />}
      </div>
    </div>
  );
};

export default AdminPanel; 