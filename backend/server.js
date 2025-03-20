import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { getAllFlowers, createBouquet, addFlowerToBouquet, getBouquetComposition } from "./database/queries.js";

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

app.use(cors({
  origin: "http://localhost:3000", // Разрешаем запросы с фронта
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));
app.use(express.json());

// 📌 Главная страница сервера
app.get("/", (req, res) => {
  res.send("Boquet Shop Backend работает!");
});

// 📌 API для получения всех букетов
app.get("/api/bouquets", async (req, res) => {
  try {
    const bouquets = await pool.query("SELECT * FROM bouquets");

    // Добавляем цветы в каждый букет
    for (let bouquet of bouquets.rows) {
      const flowers = await pool.query(
        `SELECT bf.position_x, bf.position_y, bf.color, f.name, f.image_url 
         FROM bouquet_flowers bf
         JOIN flowers f ON bf.flower_id = f.id
         WHERE bf.bouquet_id = $1`,
        [bouquet.id]
      );
      bouquet.flowers = flowers.rows;
    }

    res.json(bouquets.rows);
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
app.post("/api/bouquets", async (req, res) => {
  const { userId, name } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  try {
    const newBouquet = await pool.query(
      "INSERT INTO bouquets (user_id, name, circle_count, flower_count) VALUES ($1, $2, 0, 0) RETURNING *",
      [userId, name]
    );
    res.json(newBouquet.rows[0]);
  } catch (error) {
    console.error("Ошибка создания букета:", error);
    res.status(500).json({ error: "Ошибка сервера при создании букета" });
  }
});

// Добавить цветок в букет
app.post("/api/bouquets/:bouquetId/flowers", async (req, res) => {
  try {
    const { bouquetId } = req.params;
    const { flowerId, positionX, positionY, color } = req.body;

    if (!flowerId || positionX === undefined || positionY === undefined || !color) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    // Добавляем цветок в букет
    await pool.query(
      `INSERT INTO bouquet_flowers (bouquet_id, flower_id, position_x, position_y, color) 
       VALUES ($1, $2, $3, $4, $5)`,
      [bouquetId, flowerId, positionX, positionY, color]
    );

    // Пересчитываем количество цветов в букете
    await pool.query(
      `UPDATE bouquets SET flower_count = (
        SELECT COUNT(*) FROM bouquet_flowers WHERE bouquet_id = $1
      ) WHERE id = $1`,
      [bouquetId]
    );

    res.json({ message: "Цветок добавлен!" });
  } catch (error) {
    console.error("Ошибка при добавлении цветка:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
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

// Удаление цветка из букета
app.delete("/api/bouquets/:bouquetId/flowers/:flowerId", async (req, res) => {
  try {
    const { bouquetId, flowerId } = req.params;

    await pool.query(
      "DELETE FROM bouquet_flowers WHERE bouquet_id = $1 AND flower_id = $2",
      [bouquetId, flowerId]
    );

    // Обновляем количество цветов в букете
    await pool.query(
      `UPDATE bouquets SET flower_count = (
        SELECT COUNT(*) FROM bouquet_flowers WHERE bouquet_id = $1
      ) WHERE id = $1`,
      [bouquetId]
    );

    res.json({ message: "Цветок удалён!" });
  } catch (error) {
    console.error("Ошибка при удалении цветка:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Регистрация пользователя
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  try {
    // Проверяем, существует ли пользователь
    const userExists = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Пользователь уже существует" });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, hashedPassword]
    );

    res.status(201).json({ message: "Регистрация успешна!", user: newUser.rows[0] });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  try {
    // Проверяем, существует ли пользователь
    const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверное имя пользователя или пароль" });
    }

    const user = userResult.rows[0];

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Неверное имя пользователя или пароль" });
    }

    res.json({ message: "Авторизация успешна", userId: user.id });
  } catch (error) {
    console.error("Ошибка авторизации:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});
// 📌 Запуск сервера (ОСТАВЛЯЕМ ОДИН РАЗ!)
app.listen(port, () => {
  console.log(`✅ Сервер запущен на http://localhost:${port}`);
});
