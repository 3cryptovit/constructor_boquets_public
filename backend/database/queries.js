import pool from "./db.js"; // Вместо require('./db')

export const getAllFlowers = async () => {
  const result = await pool.query("SELECT * FROM flowers");
  return result.rows;
};

export const createBouquet = async (userId, name, circleCount, flowerCount) => {
  const result = await pool.query(
    `INSERT INTO bouquets (user_id, name, circle_count, flower_count) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, name, circleCount, flowerCount]
  );
  return result.rows[0];
};

export const addFlowerToBouquet = async (bouquetId, flowerId, x, y, color) => {
  const result = await pool.query(
    `INSERT INTO bouquet_flowers (bouquet_id, flower_id, position_x, position_y, color) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [bouquetId, flowerId, x, y, color]
  );
  return result.rows[0];
};

export const getBouquetComposition = async (bouquetId) => {
  const result = await pool.query(
    `SELECT bf.position_x, bf.position_y, bf.color, f.name AS flower_name, f.image_url
     FROM bouquet_flowers bf
     JOIN flowers f ON bf.flower_id = f.id
     WHERE bf.bouquet_id = $1`,
    [bouquetId]
  );
  return result.rows;
};
