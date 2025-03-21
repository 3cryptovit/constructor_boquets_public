import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getAllFlowers, createBouquet, addFlowerToBouquet, getBouquetComposition } from "./database/queries.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Секретный ключ для JWT

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

// Middleware для проверки JWT-токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Недействительный токен" });
    }
    req.user = user;
    next();
  });
};

// Middleware для проверки прав администратора
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: "Доступ запрещен. Требуются права администратора." });
  }
};

// 📌 Главная страница сервера
app.get("/", (req, res) => {
  res.send("Boquet Shop Backend работает!");
});

// 📌 API для получения всех букетов
app.get("/api/bouquets", async (req, res) => {
  try {
    const bouquets = await pool.query("SELECT * FROM bouquets");

    for (let bouquet of bouquets.rows) {
      const flowers = await pool.query(
        `SELECT bf.position_x, bf.position_y, bf.quantity, f.name, f.color, f.image_url 
         FROM bouquet_flowers bf
         JOIN flowers f ON bf.flower_id = f.id
         WHERE bf.bouquet_id = $1`,
        [bouquet.id]
      );
      bouquet.flowers = flowers.rows;

      // Добавляем путь к изображению, если его нет
      if (!bouquet.image_url) {
        bouquet.image_url = `/assets/boquet_${bouquet.id}.webp`;
      }
    }

    res.json(bouquets.rows);
  } catch (error) {
    console.error("Ошибка получения букетов:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// 📌 API для получения букета по ID
app.get("/api/bouquets/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Получаем информацию о букете
    const bouquetResult = await pool.query(
      "SELECT * FROM bouquets WHERE id = $1",
      [id]
    );

    if (bouquetResult.rows.length === 0) {
      return res.status(404).json({ error: "Букет не найден" });
    }

    const bouquet = bouquetResult.rows[0];

    // Получаем цветы букета
    const flowers = await pool.query(
      `SELECT bf.position_x, bf.position_y, bf.quantity, f.name, f.color, f.image_url 
       FROM bouquet_flowers bf
       JOIN flowers f ON bf.flower_id = f.id
       WHERE bf.bouquet_id = $1`,
      [id]
    );

    bouquet.flowers = flowers.rows;

    // Добавляем путь к изображению, если его нет
    if (!bouquet.image_url) {
      bouquet.image_url = `/assets/boquet_${bouquet.id}.webp`;
    }

    res.json(bouquet);
  } catch (error) {
    console.error("Ошибка получения букета:", error);
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
  const { username, password, role } = req.body;
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

    // Устанавливаем роль 'user' по умолчанию, роль 'admin' может быть установлена только администратором
    const userRole = role === 'admin' ? 'user' : (role || 'user');

    const newUser = await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role",
      [username, hashedPassword, userRole]
    );

    res.status(201).json({ message: "Регистрация успешна!", user: newUser.rows[0] });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Аутентификация пользователя
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  try {
    // Ищем пользователя в базе данных
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    // Создаем JWT-токен с информацией о роли пользователя
    const token = jwt.sign(
      {
        userId: user.rows[0].id,
        username: user.rows[0].username,
        role: user.rows[0].role || 'user' // Добавляем роль в токен
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Возвращаем данные пользователя и токен
    res.json({
      userId: user.rows[0].id,
      username: user.rows[0].username,
      role: user.rows[0].role || 'user', // Возвращаем роль клиенту
      token: token
    });
  } catch (error) {
    console.error("Ошибка аутентификации:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получить корзину пользователя
app.get("/api/cart/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;

  // Проверяем, что пользователь запрашивает свою корзину
  if (parseInt(userId) !== req.user.userId) {
    return res.status(403).json({ error: "Доступ запрещен" });
  }

  try {
    // Получаем содержимое корзины с детальной информацией о букетах
    const cartItems = await pool.query(
      `SELECT c.id, c.bouquet_id, c.quantity, b.name, b.price, b.image_url, b.description
       FROM cart c
       JOIN bouquets b ON c.bouquet_id = b.id
       WHERE c.user_id = $1`,
      [userId]
    );

    // Добавляем изображения, если их нет
    for (let item of cartItems.rows) {
      if (!item.image_url) {
        item.image_url = `/assets/boquet_${item.bouquet_id}.webp`;
      }
    }

    res.json(cartItems.rows);
  } catch (error) {
    console.error("Ошибка получения корзины:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Добавить букет в корзину
app.post("/api/cart", authenticateToken, async (req, res) => {
  const { userId, bouquetId, quantity } = req.body;

  // Проверяем, что пользователь добавляет в свою корзину
  if (parseInt(userId) !== req.user.userId) {
    return res.status(403).json({ error: "Доступ запрещен" });
  }

  try {
    // Сначала проверяем, существует ли букет
    const bouquetCheck = await pool.query("SELECT id FROM bouquets WHERE id = $1", [bouquetId]);

    if (bouquetCheck.rows.length === 0) {
      return res.status(404).json({ error: "Букет не найден в базе данных" });
    }

    // Проверяем, есть ли уже такой букет в корзине
    const existingItem = await pool.query(
      `SELECT c.*, b.price 
       FROM cart c 
       JOIN bouquets b ON c.bouquet_id = b.id 
       WHERE c.user_id = $1 AND c.bouquet_id = $2`,
      [userId, bouquetId]
    );

    if (existingItem.rows.length > 0) {
      // Обновляем количество, если букет уже в корзине
      await pool.query(
        "UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND bouquet_id = $3",
        [quantity, userId, bouquetId]
      );
    } else {
      // Добавляем новый букет в корзину
      await pool.query(
        "INSERT INTO cart (user_id, bouquet_id, quantity) VALUES ($1, $2, $3)",
        [userId, bouquetId, quantity]
      );
    }

    res.status(201).json({ message: "Букет добавлен в корзину" });
  } catch (error) {
    console.error("Ошибка добавления в корзину:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обновить количество букета в корзине
app.put("/api/cart/:cartItemId", authenticateToken, async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  try {
    // Проверяем, что элемент корзины принадлежит пользователю
    const cartItem = await pool.query(
      "SELECT * FROM cart WHERE id = $1",
      [cartItemId]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({ error: "Элемент корзины не найден" });
    }

    if (cartItem.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    // Обновляем количество
    await pool.query(
      "UPDATE cart SET quantity = $1 WHERE id = $2",
      [quantity, cartItemId]
    );

    res.json({ message: "Количество обновлено" });
  } catch (error) {
    console.error("Ошибка обновления корзины:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Удалить букет из корзины
app.delete("/api/cart/:cartItemId", authenticateToken, async (req, res) => {
  const { cartItemId } = req.params;

  try {
    // Проверяем, что элемент корзины принадлежит пользователю
    const cartItem = await pool.query(
      "SELECT * FROM cart WHERE id = $1",
      [cartItemId]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({ error: "Элемент корзины не найден" });
    }

    if (cartItem.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    // Удаляем элемент
    await pool.query("DELETE FROM cart WHERE id = $1", [cartItemId]);

    res.json({ message: "Букет удален из корзины" });
  } catch (error) {
    console.error("Ошибка удаления из корзины:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Оформить заказ
app.post("/api/orders", authenticateToken, async (req, res) => {
  const { userId } = req.body;

  // Проверяем, что пользователь оформляет свой заказ
  if (parseInt(userId) !== req.user.userId) {
    return res.status(403).json({ error: "Доступ запрещен" });
  }

  try {
    // Начинаем транзакцию
    await pool.query('BEGIN');

    // Создаем заказ
    const orderResult = await pool.query(
      "INSERT INTO orders (user_id, created_at) VALUES ($1, NOW()) RETURNING id",
      [userId]
    );
    const orderId = orderResult.rows[0].id;

    // Получаем товары из корзины пользователя
    const cartItems = await pool.query(
      "SELECT bouquet_id, quantity FROM cart WHERE user_id = $1",
      [userId]
    );

    // Добавляем товары в заказ
    for (const item of cartItems.rows) {
      await pool.query(
        "INSERT INTO order_items (order_id, bouquet_id, quantity) VALUES ($1, $2, $3)",
        [orderId, item.bouquet_id, item.quantity]
      );
    }

    // Очищаем корзину
    await pool.query("DELETE FROM cart WHERE user_id = $1", [userId]);

    // Завершаем транзакцию
    await pool.query('COMMIT');

    res.status(201).json({
      message: "Заказ успешно оформлен",
      orderId
    });
  } catch (error) {
    // Откатываем транзакцию в случае ошибки
    await pool.query('ROLLBACK');
    console.error("Ошибка оформления заказа:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получить историю заказов пользователя
app.get("/api/orders/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;

  // Проверяем, что пользователь запрашивает свои заказы
  if (parseInt(userId) !== req.user.userId) {
    return res.status(403).json({ error: "Доступ запрещен" });
  }

  try {
    // Получаем все заказы пользователя
    const orders = await pool.query(
      `SELECT o.id, o.created_at,
       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count,
       (SELECT SUM(oi.quantity * b.price) 
        FROM order_items oi 
        JOIN bouquets b ON oi.bouquet_id = b.id 
        WHERE oi.order_id = o.id) as total_price
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    // Для каждого заказа добавляем детали (товары)
    for (const order of orders.rows) {
      const orderItems = await pool.query(
        `SELECT oi.quantity, b.id as bouquet_id, b.name, b.price
         FROM order_items oi
         JOIN bouquets b ON oi.bouquet_id = b.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = orderItems.rows;
    }

    res.json(orders.rows);
  } catch (error) {
    console.error("Ошибка получения заказов:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// API для назначения роли администратора (только для админов)
app.post("/api/users/:userId/make-admin", authenticateToken, isAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);

    res.json({ message: "Пользователь назначен администратором" });
  } catch (error) {
    console.error("Ошибка назначения администратором:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// API для удаления букета (только для админов)
app.delete("/api/bouquets/:id", authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Удаляем цветы из букета
    await pool.query(
      "DELETE FROM bouquet_flowers WHERE bouquet_id = $1",
      [id]
    );

    // Удаляем букет из корзин пользователей
    await pool.query(
      "DELETE FROM cart WHERE bouquet_id = $1",
      [id]
    );

    // Удаляем букет
    const result = await pool.query(
      "DELETE FROM bouquets WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Букет не найден" });
    }

    res.json({ message: "Букет успешно удален", deletedBouquet: result.rows[0] });
  } catch (error) {
    console.error("Ошибка удаления букета:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// API для получения списка пользователей (только для админов)
app.get("/api/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT id, username, role, created_at FROM users ORDER BY id"
    );
    res.json(users.rows);
  } catch (error) {
    console.error("Ошибка получения списка пользователей:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
}); // ✅ Закрываем app.get

// 📌 Запуск сервера (вне всех маршрутов)
app.listen(port, () => {
  console.log(`✅ Сервер запущен на http://localhost:${port}`);
});
