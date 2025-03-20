import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import {
  getAllFlowers,
  createBouquet,
  addFlowerToBouquet,
  getBouquetComposition
} from '../database/queries.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const pool = new pg.Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "bouquet_db",
  password: process.env.DB_PASSWORD || "", // 📌 Берём пароль из .env
  port: process.env.DB_PORT || 5432,
});

app.use(cors());
app.use(express.json());

// 📌 Главная страница сервера
app.get("/", (req, res) => {
  res.send("Boquet Shop Backend работает!");
});

// 📌 API для получения всех букетов
app.get("/bouquets", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bouquets");
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка получения букетов:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// 📌 API для оформления заказа
app.post("/order", async (req, res) => {
  const { userId } = req.body;

  try {
    const orderResult = await pool.query(
      "INSERT INTO orders (user_id) VALUES ($1) RETURNING id",
      [userId]
    );
    const orderId = orderResult.rows[0].id;

    const cartItems = await pool.query(
      "SELECT bouquet_id, quantity FROM cart WHERE user_id = $1",
      [userId]
    );

    for (const item of cartItems.rows) {
      await pool.query(
        "INSERT INTO order_items (order_id, bouquet_id, quantity) VALUES ($1, $2, $3)",
        [orderId, item.bouquet_id, item.quantity]
      );
    }

    await pool.query("DELETE FROM cart WHERE user_id = $1", [userId]);

    res.status(201).json({ message: "Заказ успешно оформлен", orderId });
  } catch (error) {
    console.error("Ошибка оформления заказа:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получить список всех цветов
app.get('/api/flowers', async (req, res) => {
  try {
    const flowers = await getAllFlowers();
    res.json(flowers);
  } catch (error) {
    console.error('Ошибка при получении цветов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создать новый букет
app.post('/api/bouquets', async (req, res) => {
  try {
    const { userId, name, circleCount, flowerCount } = req.body;
    if (!userId || !name || !circleCount || !flowerCount) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    const newBouquet = await createBouquet(userId, name, circleCount, flowerCount);
    res.json(newBouquet);
  } catch (error) {
    console.error('Ошибка при создании букета:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Добавить цветок в букет
app.post('/api/bouquets/:bouquetId/flowers', async (req, res) => {
  try {
    const { bouquetId } = req.params;
    const { flowerId, positionX, positionY, color } = req.body;

    if (!flowerId || positionX === undefined || positionY === undefined || !color) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const addedFlower = await addFlowerToBouquet(bouquetId, flowerId, positionX, positionY, color);
    res.json(addedFlower);
  } catch (error) {
    console.error('Ошибка при добавлении цветка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить состав букета
app.get('/api/bouquets/:bouquetId/flowers', async (req, res) => {
  try {
    const { bouquetId } = req.params;
    const composition = await getBouquetComposition(bouquetId);
    res.json(composition);
  } catch (error) {
    console.error('Ошибка при получении состава букета:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// 📌 Запуск сервера (ОСТАВЛЯЕМ ОДИН РАЗ!)
app.listen(port, () => {
  console.log(`✅ Сервер запущен на http://localhost:${port}`);
});
