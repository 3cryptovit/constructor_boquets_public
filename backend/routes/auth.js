import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../database/db.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Регистрация пользователя
router.post("/register", async (req, res) => {
  try {
    console.log("Получен запрос на регистрацию:", req.body);
    const { username, email, password } = req.body;

    // Проверка на наличие обязательных полей
    if (!username || !password) {
      return res.status(400).json({
        message: "Имя пользователя и пароль обязательны"
      });
    }

    // Проверяем, существует ли пользователь с таким именем
    const userExists = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        message: "Пользователь с таким именем уже существует"
      });
    }

    // Если email указан, проверяем его уникальность
    if (email) {
      const emailExists = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (emailExists.rows.length > 0) {
        return res.status(400).json({
          message: "Пользователь с таким email уже существует"
        });
      }
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем нового пользователя (с проверкой на наличие email)
    let result;
    if (email) {
      result = await pool.query(
        `INSERT INTO users (username, email, password, role) 
         VALUES ($1, $2, $3, $4) RETURNING id, username, email, role`,
        [username, email, hashedPassword, "user"]
      );
    } else {
      result = await pool.query(
        `INSERT INTO users (username, password, role) 
         VALUES ($1, $2, $3) RETURNING id, username, role`,
        [username, hashedPassword, "user"]
      );
    }

    // Создаем JWT токен
    const token = jwt.sign(
      {
        id: result.rows[0].id,
        username: result.rows[0].username,
        role: result.rows[0].role
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Подготавливаем объект пользователя для ответа
    const user = {
      id: result.rows[0].id,
      username: result.rows[0].username,
      role: result.rows[0].role
    };

    // Добавляем email, если он доступен
    if (result.rows[0].email) {
      user.email = result.rows[0].email;
    }

    res.status(201).json({
      message: "Пользователь успешно зарегистрирован",
      user,
      token
    });
  } catch (error) {
    console.error("Ошибка при регистрации:", error);
    res.status(500).json({ message: "Ошибка сервера при регистрации" });
  }
});

// Вход пользователя
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Ищем пользователя в базе
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Неверное имя пользователя или пароль" });
    }

    const user = result.rows[0];

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Неверное имя пользователя или пароль" });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Вход выполнен успешно",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error("Ошибка при входе:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router; 