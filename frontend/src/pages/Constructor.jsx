import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FlowerCounter from "../components/FlowerCounter";
import FlowerSelector from "../components/FlowerSelector";
import BouquetConstructor from "../components/BouquetConstructor";

const Constructor = () => {
  const [totalFlowers, setTotalFlowers] = useState(1);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bouquetName, setBouquetName] = useState("Мой букет");
  const [bouquetDescription, setBouquetDescription] = useState("Красивый букет ручной работы");
  const [bouquetPrice, setBouquetPrice] = useState(3500);
  const navigate = useNavigate();

  // Проверка авторизации
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");

    if (!userId || !username || username === "undefined") {
      alert("Для доступа к конструктору необходимо войти в аккаунт");
      navigate("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  const saveBouquet = async () => {
    if (!selectedFlower) {
      alert("Добавьте хотя бы один цветок в букет!");
      return;
    }

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
      alert("Ошибка: сначала войдите в аккаунт!");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/bouquets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          name: bouquetName,
          description: bouquetDescription,
          price: bouquetPrice,
          image_url: "/assets/custom_bouquet.webp"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Букет "${bouquetName}" успешно создан и добавлен в корзину!`);
        navigate("/cart");
      } else {
        alert(`❌ Ошибка: ${data.error}`);
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("❌ Не удалось создать букет: " + error.message);
    }
  };

  const appStyle = {
    backgroundColor: '#f5f5f5',
    minHeight: 'calc(100vh - 60px)', // Учитываем Header
    margin: 0,
    padding: 0,
  };

  const contentStyle = {
    padding: '2rem',
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    maxWidth: "500px",
    margin: "0 auto",
    gap: "10px",
    marginBottom: "20px"
  };

  return (
    <div style={appStyle}>
      <div style={contentStyle}>
        <h1 style={{ textAlign: "center" }}>Конструктор букета</h1>

        {isAuthenticated && (
          <>
            {/* Форма для названия и описания букета */}
            <div style={formStyle}>
              <input
                type="text"
                value={bouquetName}
                onChange={(e) => setBouquetName(e.target.value)}
                placeholder="Название букета"
                style={{ padding: "8px" }}
              />
              <textarea
                value={bouquetDescription}
                onChange={(e) => setBouquetDescription(e.target.value)}
                placeholder="Описание букета"
                style={{ padding: "8px", height: "60px" }}
              />
              <div style={{ display: "flex", alignItems: "center" }}>
                <label style={{ marginRight: "10px" }}>Цена: </label>
                <input
                  type="number"
                  value={bouquetPrice}
                  onChange={(e) => setBouquetPrice(Number(e.target.value))}
                  min="1000"
                  style={{ padding: "8px", width: "100px" }}
                />
                <span style={{ marginLeft: "5px" }}>₽</span>
              </div>
            </div>

            {/* Компоненты конструктора */}
            <FlowerCounter onCountChange={setTotalFlowers} />
            <FlowerSelector onFlowerSelect={setSelectedFlower} />
            <BouquetConstructor
              totalFlowers={totalFlowers}
              selectedFlower={selectedFlower}
            />

            {/* Кнопка сохранения букета */}
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={saveBouquet}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "16px",
                  cursor: "pointer"
                }}
              >
                Сохранить букет и добавить в корзину
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Constructor;
