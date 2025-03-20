import React, { useEffect, useState } from "react";

const Constructor = () => {
  const [flowers, setFlowers] = useState([]); // Доступные цветы
  const [selectedFlower, setSelectedFlower] = useState(null); // Выбранный цветок
  const [bouquet, setBouquet] = useState([]); // Состав букета
  const [bouquetId, setBouquetId] = useState(null); // ID созданного букета
  const [bouquetName, setBouquetName] = useState("Мой букет");

  // Загружаем цветы с backend
  useEffect(() => {
    fetch("http://localhost:5000/api/flowers")
      .then((response) => response.json())
      .then((data) => setFlowers(data))
      .catch((error) => console.error("Ошибка загрузки цветов:", error));
  }, []);

  // Создаём новый букет
  const createNewBouquet = async () => {
    const userId = localStorage.getItem("userId"); // Берём userId из локального хранилища

    if (!userId) {
      alert("Ошибка: сначала войдите в аккаунт!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/bouquets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name: bouquetName }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Букет создан!");
        setBouquetId(data.id);
      } else {
        alert(`❌ Ошибка: ${data.error}`);
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("❌ Не удалось создать букет: " + error.message);
    }
  };

  // Добавляем цветок в букет
  const addFlowerToBouquet = async (positionX, positionY) => {
    if (!selectedFlower) {
      alert("Сначала выберите цветок!");
      return;
    }

    if (!bouquetId) {
      alert("Сначала создайте букет!");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/bouquets/${bouquetId}/flowers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowerId: selectedFlower.id,
          positionX,
          positionY,
          color: selectedFlower.color,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при добавлении цветка");
      }

      setBouquet([...bouquet, { ...selectedFlower, positionX, positionY }]);
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Не удалось добавить цветок: " + error.message);
    }
  };

  // Очистить букет
  const clearBouquet = () => {
    setBouquet([]);
    setBouquetId(null);
    alert("Букет очищен!");
  };

  // Сохранить букет в каталог
  const saveBouquet = async () => {
    if (!bouquetId) {
      alert("Сначала создайте букет!");
      return;
    }

    if (bouquet.length === 0) {
      alert("Букет пуст! Добавьте хотя бы один цветок.");
      return;
    }

    alert(`Букет "${bouquetName}" успешно сохранен в каталог!`);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Конструктор букета</h1>

      {/* Ввод названия и создание букета */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={bouquetName}
          onChange={(e) => setBouquetName(e.target.value)}
          placeholder="Название букета"
          style={{ padding: "8px", marginRight: "10px" }}
        />
        <button
          onClick={createNewBouquet}
          disabled={bouquetId !== null}
          style={{
            padding: "8px 16px",
            backgroundColor: bouquetId ? "#cccccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          {bouquetId ? "Букет создан!" : "Создать новый букет"}
        </button>
      </div>

      {/* Выбор цветка */}
      <h2>Выберите цветок:</h2>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
        {flowers.map((flower) => (
          <button
            key={flower.id}
            onClick={() => setSelectedFlower(flower)}
            style={{
              padding: "10px",
              backgroundColor: selectedFlower?.id === flower.id ? "lightgray" : "white",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}
          >
            {flower.name} ({flower.color})
          </button>
        ))}
      </div>

      {/* Сетка для букета */}
      <h2>Ваш букет:</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 50px)", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
        {Array.from({ length: 10 }).map((_, index) => {
          const flowerInPosition = bouquet.find((f) => f.positionX === index % 5 && f.positionY === Math.floor(index / 5));
          return (
            <div
              key={index}
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: flowerInPosition ? flowerInPosition.color : "lightgray",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: selectedFlower && bouquetId ? "pointer" : "default",
              }}
              onClick={() => addFlowerToBouquet(index % 5, Math.floor(index / 5))}
            >
              {flowerInPosition ? flowerInPosition.name[0] : "+"}
            </div>
          );
        })}
      </div>

      {/* Кнопки управления букетом */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={saveBouquet}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          Сохранить букет
        </button>
        <button
          onClick={clearBouquet}
          style={{
            padding: "10px 20px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          Очистить букет
        </button>
      </div>
    </div>
  );
};

export default Constructor;
