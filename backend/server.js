import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getAllFlowers, createBouquet, addFlowerToBouquet, getBouquetComposition, getUserCart, addToCart, removeFromCart, createOrder, getUserOrders, addFlower, updateFlower, deleteFlower } from "./database/queries.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Секретный ключ для JWT

const pool = new pg.Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "bouquet_DB",
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
      try {
        const flowers = await pool.query(
          `SELECT bf.quantity, f.name, f.color, f.image_url 
           FROM bouquet_flowers bf
           JOIN flowers f ON bf.flower_id = f.id
           WHERE bf.bouquet_id = $1`,
          [bouquet.id]
        );
        bouquet.flowers = flowers.rows;
      } catch (flowerError) {
        console.error("Ошибка загрузки цветов для букета:", flowerError);
        bouquet.flowers = []; // Если произошла ошибка, устанавливаем пустой массив
      }

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
    try {
      const flowers = await pool.query(
        `SELECT bf.quantity, f.name, f.color, f.image_url 
         FROM bouquet_flowers bf
         JOIN flowers f ON bf.flower_id = f.id
         WHERE bf.bouquet_id = $1`,
        [id]
      );

      bouquet.flowers = flowers.rows;
    } catch (flowerError) {
      console.error("Ошибка загрузки цветов для букета:", flowerError);
      bouquet.flowers = []; // Если произошла ошибка, устанавливаем пустой массив
    }

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

    // Добавляем пути к изображениям, если их нет
    for (let flower of flowers) {
      if (!flower.image_url) {
        flower.image_url = `/assets/flowers/${flower.name.toLowerCase()}.png`;
      }
    }

    res.json(flowers);
  } catch (error) {
    console.error('Ошибка при получении цветов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создать новый букет
app.post("/api/bouquets", authenticateToken, async (req, res) => {
  const { userId, name, description, price, image_url, circle_count, flower_count } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  try {
    // Проверяем, что пользователь создает букет под своим ID
    if (parseInt(userId) !== req.user.userId) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    // Создаем новый букет
    const newBouquet = await createBouquet(
      userId,
      name,
      description || "Красивый букет ручной работы",
      circle_count || 0,
      flower_count || 0,
      image_url || "/assets/default_bouquet.webp"
    );

    // Сразу добавляем этот букет в корзину пользователя
    await addToCart(userId, newBouquet.id, 1);

    res.json({
      message: "Букет создан и добавлен в корзину!",
      bouquet: newBouquet
    });
  } catch (error) {
    console.error("Ошибка создания букета:", error);
    res.status(500).json({ error: "Ошибка сервера при создании букета" });
  }
});

// Добавить цветок в букет
app.post("/api/bouquets/:bouquetId/flowers", authenticateToken, async (req, res) => {
  try {
    const { bouquetId } = req.params;
    const { flowerId, positionX, positionY, color, quantity } = req.body;

    if (!flowerId || positionX === undefined || positionY === undefined || !color) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    // Проверяем, что пользователь добавляет цветок в свой букет
    const bouquet = await pool.query("SELECT user_id FROM bouquets WHERE id = $1", [bouquetId]);

    if (bouquet.rows.length === 0) {
      return res.status(404).json({ error: "Букет не найден" });
    }

    if (bouquet.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    // Проверяем, существует ли уже цветок в этой позиции
    const existingFlower = await pool.query(
      `SELECT * FROM bouquet_flowers 
       WHERE bouquet_id = $1 AND position_x = $2 AND position_y = $3`,
      [bouquetId, positionX, positionY]
    );

    if (existingFlower.rows.length > 0) {
      return res.status(409).json({ error: "В этой позиции уже есть цветок" });
    }

    // Добавляем цветок в букет
    const newFlower = await addFlowerToBouquet(
      bouquetId,
      flowerId,
      positionX,
      positionY,
      color,
      quantity || 1
    );

    // Обновляем количество цветов в букете
    await pool.query(
      `UPDATE bouquets SET flower_count = flower_count + 1 WHERE id = $1`,
      [bouquetId]
    );

    res.json({
      message: "Цветок добавлен в букет",
      flower: newFlower
    });
  } catch (error) {
    console.error("Ошибка добавления цветка в букет:", error);
    res.status(500).json({ error: "Ошибка сервера при добавлении цветка" });
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
app.get("/api/cart", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartItems = await getUserCart(userId);

    res.json(cartItems);
  } catch (error) {
    console.error("Ошибка получения корзины:", error);
    res.status(500).json({ error: "Ошибка сервера при получении корзины" });
  }
});

// Добавить товар в корзину
app.post("/api/cart", authenticateToken, async (req, res) => {
  try {
    const { bouquetId, quantity } = req.body;
    const userId = req.user.userId;

    if (!bouquetId || !quantity) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    const cartItem = await addToCart(userId, bouquetId, quantity);

    res.json({
      message: "Товар добавлен в корзину",
      item: cartItem
    });
  } catch (error) {
    console.error("Ошибка добавления в корзину:", error);
    res.status(500).json({ error: "Ошибка сервера при добавлении в корзину" });
  }
});

// Удалить товар из корзины
app.delete("/api/cart/:bouquetId", authenticateToken, async (req, res) => {
  try {
    const { bouquetId } = req.params;
    const userId = req.user.userId;

    const removedItem = await removeFromCart(userId, bouquetId);

    if (!removedItem) {
      return res.status(404).json({ error: "Товар не найден в корзине" });
    }

    res.json({
      message: "Товар удален из корзины",
      item: removedItem
    });
  } catch (error) {
    console.error("Ошибка удаления из корзины:", error);
    res.status(500).json({ error: "Ошибка сервера при удалении из корзины" });
  }
});

// Оформить заказ
app.post("/api/orders", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Получаем содержимое корзины
    const cartItems = await getUserCart(userId);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Корзина пуста" });
    }

    // Создаем заказы для каждого букета в корзине
    const orders = [];

    for (const item of cartItems) {
      const totalPrice = item.price * item.quantity;
      const order = await createOrder(userId, item.bouquet_id, totalPrice);
      orders.push(order);
    }

    // Очищаем корзину
    await pool.query("DELETE FROM cart WHERE user_id = $1", [userId]);

    res.json({
      message: "Заказ успешно оформлен",
      orders: orders
    });
  } catch (error) {
    console.error("Ошибка оформления заказа:", error);
    res.status(500).json({ error: "Ошибка сервера при оформлении заказа" });
  }
});

// Получить заказы пользователя
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await getUserOrders(userId);

    res.json(orders);
  } catch (error) {
    console.error("Ошибка получения заказов:", error);
    res.status(500).json({ error: "Ошибка сервера при получении заказов" });
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

// Добавить новый цветок (только для админов)
app.post('/api/flowers', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, color, price, popularity, image_url } = req.body;

    if (!name || !color || !price) {
      return res.status(400).json({ error: 'Необходимо указать название, цвет и цену цветка' });
    }

    const newFlower = await addFlower(name, color, price, popularity || 0, image_url);

    res.status(201).json({
      message: "Цветок успешно добавлен",
      flower: newFlower
    });
  } catch (error) {
    console.error('Ошибка при добавлении цветка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновить цветок (только для админов)
app.put('/api/flowers/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, price, popularity, image_url } = req.body;

    if (!name || !color || !price) {
      return res.status(400).json({ error: 'Необходимо указать название, цвет и цену цветка' });
    }

    const updatedFlower = await updateFlower(id, name, color, price, popularity || 0, image_url);

    if (!updatedFlower) {
      return res.status(404).json({ error: 'Цветок не найден' });
    }

    res.json({
      message: "Цветок успешно обновлен",
      flower: updatedFlower
    });
  } catch (error) {
    console.error('Ошибка при обновлении цветка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удалить цветок (только для админов)
app.delete('/api/flowers/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFlower = await deleteFlower(id);

    if (!deletedFlower) {
      return res.status(404).json({ error: 'Цветок не найден' });
    }

    res.json({
      message: "Цветок успешно удален",
      flower: deletedFlower
    });
  } catch (error) {
    console.error('Ошибка при удалении цветка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// 📌 Запуск сервера (вне всех маршрутов)
app.listen(port, () => {
  console.log(`✅ Сервер запущен на http://localhost:${port}`);
});
