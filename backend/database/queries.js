import pool from "./db.js"; // Вместо require('./db')

export const getAllFlowers = async () => {
  const result = await pool.query("SELECT * FROM flowers");
  return result.rows;
};

export const createBouquet = async (userId, name, description, circleCount, flowerCount, imageUrl) => {
  const result = await pool.query(
    `INSERT INTO bouquets (user_id, name, description, circle_count, flower_count, image_url, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
    [userId, name, description, circleCount, flowerCount, imageUrl]
  );
  return result.rows[0];
};

export const addFlowerToBouquet = async (bouquetId, flowerId, x, y, color, quantity) => {
  const result = await pool.query(
    `INSERT INTO bouquet_flowers (bouquet_id, flower_id, position_x, position_y, color, quantity)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [bouquetId, flowerId, x, y, color, quantity]
  );
  return result.rows[0];
};

export const getBouquetComposition = async (bouquetId) => {
  const result = await pool.query(
    `SELECT bf.position_x, bf.position_y, bf.color, bf.quantity, 
            f.name AS flower_name, f.price, f.image_url
     FROM bouquet_flowers bf
     JOIN flowers f ON bf.flower_id = f.id
     WHERE bf.bouquet_id = $1`,
    [bouquetId]
  );
  return result.rows;
};

export const getUserCart = async (userId) => {
  const result = await pool.query(
    `SELECT c.*, b.name, b.price, b.image_url
     FROM cart c
     JOIN bouquets b ON b.id = c.bouquet_id
     WHERE c.user_id = $1`,
    [userId]
  );
  return result.rows;
};

export const addToCart = async (userId, bouquetId, quantity) => {
  const result = await pool.query(
    `INSERT INTO cart (user_id, bouquet_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, bouquet_id)
     DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
     RETURNING *`,
    [userId, bouquetId, quantity]
  );
  return result.rows[0];
};

export const removeFromCart = async (userId, bouquetId) => {
  const result = await pool.query(
    `DELETE FROM cart 
     WHERE user_id = $1 AND bouquet_id = $2
     RETURNING *`,
    [userId, bouquetId]
  );
  return result.rows[0];
};

export const createOrder = async (userId, bouquetId, totalPrice) => {
  const result = await pool.query(
    `INSERT INTO orders (user_id, bouquet_id, total_price, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [userId, bouquetId, totalPrice]
  );
  return result.rows[0];
};

export const getUserOrders = async (userId) => {
  const result = await pool.query(
    `SELECT o.*, b.name, b.image_url
     FROM orders o
     JOIN bouquets b ON b.id = o.bouquet_id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const addFlower = async (name, color, price, popularity, imageUrl) => {
  const result = await pool.query(
    `INSERT INTO flowers (name, color, price, popularity, image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, color, price, popularity, imageUrl]
  );
  return result.rows[0];
};

export const updateFlower = async (id, name, color, price, popularity, imageUrl) => {
  const result = await pool.query(
    `UPDATE flowers
     SET name = $2, color = $3, price = $4, popularity = $5, image_url = $6
     WHERE id = $1
     RETURNING *`,
    [id, name, color, price, popularity, imageUrl]
  );
  return result.rows[0];
};

export const deleteFlower = async (id) => {
  const result = await pool.query(
    `DELETE FROM flowers
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0];
};
