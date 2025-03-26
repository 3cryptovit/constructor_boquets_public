import express from "express";
import pool from "../database/db.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Настраиваем multer для загрузки изображений
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Загрузите файл изображения!'), false);
    }
  }
});

// ===== УПРАВЛЕНИЕ БУКЕТАМИ =====

// Получение всех букетов для админа (с полной информацией)
router.get("/bouquets", authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log("Запрос на получение букетов для админ-панели");

    // Проверяем наличие колонки created_at в таблице bouquets
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='bouquets' AND column_name='created_at'
    `);

    let result;
    if (checkColumn.rows.length > 0) {
      // Если колонка есть, используем сортировку по created_at
      result = await pool.query("SELECT * FROM bouquets ORDER BY created_at DESC");
    } else {
      // Если колонки нет, запрашиваем без сортировки
      result = await pool.query("SELECT * FROM bouquets");
    }

    console.log(`Получено букетов: ${result.rows.length}`);
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка при получении букетов:", error);
    res.status(500).json({ message: "Ошибка сервера при получении букетов" });
  }
});

// Добавление нового букета
router.post("/bouquets", authenticateToken, isAdmin, upload.single("image"), async (req, res) => {
  try {
    console.log("Получен запрос на добавление букета:", req.body);

    const { name, description, price } = req.body;

    // Проверка обязательных полей
    if (!name || !description || !price) {
      console.log("Отсутствуют обязательные поля");
      return res.status(400).json({ message: "Необходимо заполнить все обязательные поля" });
    }

    console.log("Файл изображения:", req.file);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Проверка структуры таблицы bouquets перед вставкой
    const checkColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='bouquets'
    `);

    console.log("Структура таблицы bouquets:", checkColumns.rows.map(row => row.column_name));

    // Базовые поля, которые точно должны быть
    const columns = ['name', 'description', 'price', 'image_url'];
    const values = [name, description, price, imageUrl];

    // Проверяем наличие поля user_id
    const hasUserId = checkColumns.rows.some(col => col.column_name === 'user_id');
    if (hasUserId) {
      columns.push('user_id');
      values.push(req.user.id); // ID администратора, добавившего букет
    }

    // Проверяем наличие поля created_at
    const hasCreatedAt = checkColumns.rows.some(col => col.column_name === 'created_at');
    if (hasCreatedAt) {
      columns.push('created_at');
      values.push('NOW()');
    }

    // Создаем SQL запрос динамически
    const columnStr = columns.join(', ');
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    // Если created_at добавляется как NOW(), корректируем placeholder
    const sqlQuery = `
      INSERT INTO bouquets (${columnStr})
      VALUES (${hasCreatedAt ? placeholders.replace(/\$\d+$/, 'NOW()') : placeholders}) 
      RETURNING *
    `;

    console.log("SQL запрос:", sqlQuery);
    console.log("Значения:", values);

    // Если у нас есть created_at как NOW(), удаляем последний элемент из values
    const sqlValues = hasCreatedAt ? values.slice(0, -1) : values;

    const result = await pool.query(sqlQuery, sqlValues);

    console.log("Букет успешно добавлен:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Ошибка добавления букета:", error);
    res.status(500).json({ message: "Ошибка сервера при добавлении букета" });
  }
});

// Удаление букета по ID
router.delete("/bouquets/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, существует ли букет
    const bouquet = await pool.query("SELECT * FROM bouquets WHERE id = $1", [id]);
    if (bouquet.rows.length === 0) {
      return res.status(404).json({ message: "Букет не найден" });
    }

    // Удаляем букет
    await pool.query("DELETE FROM bouquets WHERE id = $1", [id]);

    res.json({ message: "Букет успешно удален" });
  } catch (error) {
    console.error("Ошибка при удалении букета:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// ===== УПРАВЛЕНИЕ ЗАКАЗАМИ =====

// Получение всех заказов
router.get("/orders", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id, o.user_id, o.total_price, o.status, o.created_at, u.username, u.email
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка при получении заказов:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Получение состава заказа по ID
router.get("/orders/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT oi.id, oi.quantity, oi.price, b.name, b.image_url
      FROM order_items oi
      JOIN bouquets b ON b.id = oi.bouquet_id
      WHERE oi.order_id = $1
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка при получении состава заказа:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Обновление статуса заказа
router.put("/orders/:id/status", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Статус не указан" });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'canceled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Недопустимый статус. Допустимые статусы: " + validStatuses.join(", ")
      });
    }

    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Ошибка при обновлении статуса заказа:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ =====

// Получение всех пользователей
router.get("/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, email, role, created_at FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Обновление роли пользователя
router.put("/users/:id/role", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Роль не указана" });
    }

    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Недопустимая роль. Допустимые роли: " + validRoles.join(", ")
      });
    }

    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role",
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Ошибка при обновлении роли пользователя:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Удаление пользователя
router.delete("/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, существует ли пользователь
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Проверяем, не пытается ли админ удалить самого себя
    if (user.rows[0].id === req.user.id) {
      return res.status(400).json({ message: "Вы не можете удалить свою учетную запись" });
    }

    // Удаляем пользователя
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ message: "Пользователь успешно удален" });
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;
