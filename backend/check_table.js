import pool from './database/db.js';

const checkOrdersTable = async () => {
  try {
    // Получаем информацию о колонках таблицы orders
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `);

    console.log('Структура таблицы orders:');
    console.table(result.rows);

    // Если таблица пуста, проверяем, существует ли она вообще
    if (result.rows.length === 0) {
      console.log('Таблица orders не найдена или пуста!');

      // Проверяем список всех таблиц
      const tables = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      console.log('Доступные таблицы в базе данных:');
      console.table(tables.rows);
    } else {
      console.log(`Найдено ${result.rows.length} колонок в таблице orders`);

      // Проверяем наличие поля created_at
      const hasCreatedAt = result.rows.some(row => row.column_name === 'created_at');
      if (hasCreatedAt) {
        console.log('✅ Поле created_at существует в таблице orders');
      } else {
        console.log('❌ Поле created_at отсутствует в таблице orders');

        // Пробуем добавить поле created_at
        console.log('Пробуем добавить поле created_at...');
        await pool.query(`
          ALTER TABLE orders 
          ADD COLUMN created_at TIMESTAMP DEFAULT NOW()
        `);
        console.log('✅ Поле created_at успешно добавлено в таблицу orders');
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке таблицы orders:', error);
  } finally {
    pool.end();
  }
};

// Запускаем проверку
checkOrdersTable(); 