import pool from './database/db.js';

/**
 * Функция для исправления всех проблем с базой данных
 */
const fixDatabase = async () => {
  console.log('🔧 Начинаю проверку и исправление базы данных...');

  try {
    // 1. Проверяем таблицу orders
    console.log('\n📋 Проверяю таблицу orders...');
    await fixOrdersTable();

    // 2. Проверяем наличие других важных полей
    console.log('\n📋 Проверяю другие таблицы...');
    await fixOtherTables();

    console.log('\n✅ Все исправления успешно выполнены!');
  } catch (error) {
    console.error('❌ Произошла ошибка при исправлении базы данных:', error);
  } finally {
    await pool.end();
    console.log('\n👋 Работа скрипта завершена.');
  }
};

/**
 * Функция для исправления таблицы orders
 */
const fixOrdersTable = async () => {
  try {
    // Проверяем наличие таблицы orders
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ Таблица orders не существует!');

      // Создаем таблицу orders если она не существует
      await pool.query(`
        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          total_price DECIMAL(10, 2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Таблица orders успешно создана!');
      return;
    }

    // Проверяем наличие поля created_at
    const hasCreatedAt = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'created_at'
      );
    `);

    if (!hasCreatedAt.rows[0].exists) {
      console.log('❌ Поле created_at отсутствует в таблице orders');
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
      `);
      console.log('✅ Поле created_at успешно добавлено в таблицу orders');
    } else {
      console.log('✓ Поле created_at уже существует в таблице orders');
    }

    // Проверяем наличие поля total_price
    const hasTotalPrice = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'total_price'
      );
    `);

    if (!hasTotalPrice.rows[0].exists) {
      console.log('❌ Поле total_price отсутствует в таблице orders');
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN total_price DECIMAL(10, 2) DEFAULT 0;
      `);
      console.log('✅ Поле total_price успешно добавлено в таблицу orders');
    } else {
      console.log('✓ Поле total_price уже существует в таблице orders');
    }

    // Проверяем наличие поля status
    const hasStatus = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'status'
      );
    `);

    if (!hasStatus.rows[0].exists) {
      console.log('❌ Поле status отсутствует в таблице orders');
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
      `);
      console.log('✅ Поле status успешно добавлено в таблицу orders');
    } else {
      console.log('✓ Поле status уже существует в таблице orders');
    }
  } catch (error) {
    console.error('Ошибка при исправлении таблицы orders:', error);
    throw error;
  }
};

/**
 * Функция для исправления других таблиц
 */
const fixOtherTables = async () => {
  try {
    // Проверяем наличие таблицы order_items
    const orderItemsExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items'
      );
    `);

    if (!orderItemsExists.rows[0].exists) {
      console.log('❌ Таблица order_items не существует!');

      // Создаем таблицу order_items если она не существует
      await pool.query(`
        CREATE TABLE order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL,
          bouquet_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          price DECIMAL(10, 2) DEFAULT 0
        );
      `);
      console.log('✅ Таблица order_items успешно создана!');
    } else {
      console.log('✓ Таблица order_items существует');

      // Проверяем наличие поля price в order_items
      const hasPrice = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'order_items' 
          AND column_name = 'price'
        );
      `);

      if (!hasPrice.rows[0].exists) {
        console.log('❌ Поле price отсутствует в таблице order_items');
        await pool.query(`
          ALTER TABLE order_items 
          ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
        `);
        console.log('✅ Поле price успешно добавлено в таблицу order_items');
      } else {
        console.log('✓ Поле price уже существует в таблице order_items');
      }
    }
  } catch (error) {
    console.error('Ошибка при исправлении других таблиц:', error);
    throw error;
  }
};

// Запускаем функцию исправления БД
fixDatabase().catch(console.error);