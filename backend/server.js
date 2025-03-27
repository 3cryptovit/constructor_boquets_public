import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getAllFlowers, createBouquet, addFlowerToBouquet, getBouquetComposition, getUserCart, addToCart, removeFromCart, createOrder, getUserOrders, addFlower, updateFlower, deleteFlower } from "./database/queries.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import authRoutes from "./routes/auth.js";

// Создаем директорию для загрузки файлов, если она не существует
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

// Настраиваем хранилище для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Увеличиваем до 5MB
});

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

// Подключаем маршруты аутентификации
app.use("/api/auth", authRoutes);

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

// Функция безопасного логирования
const safeLog = (message, data) => {
  if (process.env.NODE_ENV !== "production") {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

// Функция логирования ошибок
const logError = (message, error) => {
  // Ошибки логируем всегда, но в production убираем детали
  if (process.env.NODE_ENV === "production") {
    console.error(message);
  } else {
    console.error(message, error);
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
        logError("Ошибка загрузки цветов для букета:", flowerError);
        bouquet.flowers = []; // Если произошла ошибка, устанавливаем пустой массив
      }

      // Добавляем путь к изображению, если его нет
      if (!bouquet.image_url) {
        bouquet.image_url = `/assets/boquet_${bouquet.id}.webp`;
      }
    }

    res.json(bouquets.rows);
  } catch (error) {
    logError("Ошибка получения букетов:", error);
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
      logError("Ошибка загрузки цветов для букета:", flowerError);
      bouquet.flowers = []; // Если произошла ошибка, устанавливаем пустой массив
    }

    // Добавляем путь к изображению, если его нет
    if (!bouquet.image_url) {
      bouquet.image_url = `/assets/boquet_${bouquet.id}.webp`;
    }

    res.json(bouquet);
  } catch (error) {
    logError("Ошибка получения букета:", error);
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
    logError("Ошибка оформления заказа:", error);
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
    logError('Ошибка при получении цветов:', error);
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
    logError("Ошибка создания букета:", error);
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
    logError("Ошибка добавления цветка в букет:", error);
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
    logError('Ошибка при получении состава букета:', error);
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
    logError("Ошибка при удалении цветка:", error);
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
    logError("Ошибка регистрации:", error);
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
    logError("Ошибка аутентификации:", error);
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
    logError("Ошибка получения корзины:", error);
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
    logError("Ошибка добавления в корзину:", error);
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
    logError("Ошибка удаления из корзины:", error);
    res.status(500).json({ error: "Ошибка сервера при удалении из корзины" });
  }
});

// Удалить товар из корзины по ID записи (для более гибкого удаления)
app.delete("/api/cart/item/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Проверяем, что элемент корзины принадлежит пользователю
    const cartItemCheck = await pool.query(
      "SELECT * FROM cart WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (cartItemCheck.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден в корзине" });
    }

    // Удаляем элемент корзины
    const result = await pool.query(
      "DELETE FROM cart WHERE id = $1 RETURNING *",
      [id]
    );

    res.json({
      message: "Товар удален из корзины",
      item: result.rows[0]
    });
  } catch (error) {
    logError("Ошибка удаления из корзины:", error);
    res.status(500).json({ error: "Ошибка сервера при удалении из корзины" });
  }
});

// Обновить количество товара в корзине
app.put("/api/cart/item/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.userId;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Количество должно быть положительным числом" });
    }

    // Проверяем, что элемент корзины принадлежит пользователю
    const cartItemCheck = await pool.query(
      "SELECT * FROM cart WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (cartItemCheck.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден в корзине" });
    }

    // Обновляем количество
    const result = await pool.query(
      "UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *",
      [quantity, id]
    );

    res.json({
      message: "Количество товара обновлено",
      item: result.rows[0]
    });
  } catch (error) {
    logError("Ошибка обновления количества:", error);
    res.status(500).json({ error: "Ошибка сервера при обновлении количества" });
  }
});

// API для оформления заказа через корзину
app.post("/api/orders", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    safeLog("Получен запрос на оформление заказа:", req.body);
    safeLog("Пользователь из токена:", req.user);
    const { items } = req.body;
    // Используем userId из токена
    const userId = req.user.userId;

    safeLog(`Используется userId из токена: ${userId}`);

    if (!userId) {
      logError("userId отсутствует в токене!");
      return res.status(403).json({ error: "Не удалось определить ID пользователя" });
    }

    // Проверка наличия предметов в заказе
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Корзина пуста" });
    }

    // Начинаем транзакцию
    await client.query("BEGIN");

    // Проверяем наличие колонки created_at в таблице orders
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='orders' AND column_name='created_at'
    `);

    let orderResult;
    if (checkColumn.rows.length > 0) {
      // Если колонка существует, используем ее
      orderResult = await client.query(
        `INSERT INTO orders (user_id, status, created_at) 
         VALUES ($1, 'pending', NOW()) RETURNING id`,
        [userId]
      );
    } else {
      // Если колонки нет, вставляем без нее
      orderResult = await client.query(
        `INSERT INTO orders (user_id, status) 
         VALUES ($1, 'pending') RETURNING id`,
        [userId]
      );
    }

    const orderId = orderResult.rows[0].id;
    let totalPrice = 0;

    // Добавляем товары в заказ
    for (const item of items) {
      // Если товар кастомный, сначала сохраняем его в БД
      let bouquetId = item.id;

      if (item.isCustom) {
        safeLog("Сохраняем кастомный букет:", item);
        // Создаем новый букет в БД
        const newBouquet = await client.query(
          `INSERT INTO bouquets (name, description, price, image_url, user_id, created_at, flower_count) 
           VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING id`,
          [
            item.name || "Кастомный букет",
            item.description || "Создан пользователем",
            item.price || 0,
            item.image_url || null,
            userId,
            item.flowerCount || 0
          ]
        );

        bouquetId = newBouquet.rows[0].id;

        // Если есть информация о цветах, добавляем их
        if (item.flowers && Array.isArray(item.flowers)) {
          for (const flower of item.flowers) {
            if (flower && flower.id) {
              await client.query(
                `INSERT INTO bouquet_flowers (bouquet_id, flower_id, quantity, position_x, position_y) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                  bouquetId,
                  flower.id,
                  flower.quantity || 1,
                  flower.positionX || 0,
                  flower.positionY || 0
                ]
              );
            }
          }
        }
      }

      const itemPrice = parseFloat(item.price);
      const itemQuantity = parseInt(item.quantity);
      const itemTotal = itemPrice * itemQuantity;
      totalPrice += itemTotal;

      await client.query(
        `INSERT INTO order_items (order_id, bouquet_id, quantity, price) 
         VALUES ($1, $2, $3, $4)`,
        [orderId, bouquetId, itemQuantity, itemPrice]
      );
    }

    // Обновляем общую стоимость заказа
    await client.query(
      "UPDATE orders SET total_price = $1 WHERE id = $2",
      [totalPrice, orderId]
    );

    // Очищаем корзину пользователя
    await client.query("DELETE FROM cart WHERE user_id = $1", [userId]);

    // Фиксируем транзакцию
    await client.query("COMMIT");

    res.status(201).json({
      message: "Заказ успешно оформлен",
      orderId,
      totalPrice
    });
  } catch (error) {
    // Откатываем транзакцию в случае ошибки
    await client.query("ROLLBACK");
    logError("Ошибка оформления заказа:", error);
    res.status(500).json({ error: "Ошибка сервера при оформлении заказа" });
  } finally {
    // Освобождаем клиента
    client.release();
  }
});

// Получить заказы пользователя
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await getUserOrders(userId);

    res.json(orders);
  } catch (error) {
    logError("Ошибка получения заказов:", error);
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
    logError("Ошибка назначения администратором:", error);
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
    logError("Ошибка удаления букета:", error);
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
    logError("Ошибка получения списка пользователей:", error);
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
    logError('Ошибка при добавлении цветка:', error);
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
    logError('Ошибка при обновлении цветка:', error);
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
    logError('Ошибка при удалении цветка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Импортируем маршруты админа
import adminRoutes from "./routes/admin.js";

// Добавляем маршруты админа
app.use("/api/admin", adminRoutes);

// Добавляем статические маршруты для загруженных файлов
app.use("/uploads", express.static("uploads"));

// Запускаем сервер
app.listen(port, () => {
  safeLog('\n============================');
  safeLog(`🚀 Сервер запущен на порту ${port}`);
  safeLog(`📂 Директория проекта: ${process.cwd()}`);
  safeLog(`🌐 API доступно по адресу: http://localhost:${port}`);
  safeLog(`📊 ENV: ${process.env.NODE_ENV || 'development'}`);
  safeLog('============================\n');
});

