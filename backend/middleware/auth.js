import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware для проверки JWT-токена
export const authenticateToken = (req, res, next) => {
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
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: "Доступ запрещен. Требуются права администратора." });
  }
};

// Middleware для проверки владельца букета
export const isBouquetOwner = async (req, res, next, pool) => {
  const bouquetId = req.params.bouquetId || req.params.id;
  const userId = req.user.id;

  // Администраторы имеют право на любые операции с букетами
  if (req.user.role === 'admin') {
    return next();
  }

  try {
    const bouquet = await pool.query(
      "SELECT user_id FROM bouquets WHERE id = $1",
      [bouquetId]
    );

    if (bouquet.rows.length === 0) {
      return res.status(404).json({ error: "Букет не найден" });
    }

    if (bouquet.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "У вас нет прав на выполнение этой операции" });
    }

    next();
  } catch (error) {
    console.error("Ошибка при проверке владельца букета:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
}; 