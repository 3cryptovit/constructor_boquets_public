import pool from './database/db.js';

const addCreatedAtColumn = async () => {
  try {
    // Проверяем наличие колонки created_at в таблице orders
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='orders' AND column_name='created_at'
    `);

    // Если колонка не существует, добавляем ее
    if (checkColumn.rows.length === 0) {
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW()
      `);
      console.log('✅ Поле created_at успешно добавлено в таблицу orders');
    } else {
      console.log('ℹ️ Поле created_at уже существует в таблице orders');
    }
  } catch (error) {
    console.error('❌ Ошибка при добавлении поля created_at:', error);
  } finally {
    // Завершаем соединение с БД
    pool.end();
  }
};

// Запускаем миграцию
addCreatedAtColumn(); 