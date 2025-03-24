import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройки подключения к базе данных
const pool = new pg.Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "bouquet_DB",
  password: process.env.DB_PASSWORD || "",
  port: process.env.DB_PORT || 5432,
});

async function updateDatabase() {
  console.log('Начинаем обновление базы данных...');

  try {
    // 1. Запускаем миграции
    console.log('Запускаем миграции...');
    try {
      execSync('npm run migrate', { stdio: 'inherit' });
      console.log('Миграции успешно применены.');
    } catch (error) {
      console.error('Ошибка при выполнении миграций:', error.message);
      throw new Error('Ошибка миграций');
    }

    // 2. Проверяем и обновляем структуру таблиц
    console.log('Проверяем структуру таблиц...');

    const fixTablesSQL = fs.readFileSync(path.join(__dirname, 'fix_tables.sql'), 'utf8');
    await pool.query(fixTablesSQL);
    console.log('Структура таблиц обновлена.');

    // 3. Добавляем тестовые данные, если нужно
    console.log('Проверяем наличие тестовых данных...');

    const flowersCount = await pool.query('SELECT COUNT(*) FROM flowers');
    if (parseInt(flowersCount.rows[0].count) === 0) {
      console.log('Таблица flowers пуста, добавляем тестовые данные...');

      // Добавляем цветы
      await pool.query(`
        INSERT INTO flowers (name, color, price, popularity, image_url) VALUES
        ('Роза', 'Красный', 150, 100, '/assets/flowers/rose.png'),
        ('Тюльпан', 'Желтый', 100, 80, '/assets/flowers/tulip.png'),
        ('Гербера', 'Оранжевый', 120, 75, '/assets/flowers/gerbera.png'),
        ('Хризантема', 'Белый', 130, 70, '/assets/flowers/chrysanthemum.png'),
        ('Гвоздика', 'Розовый', 90, 60, '/assets/flowers/carnation.png'),
        ('Ирис', 'Фиолетовый', 140, 65, '/assets/flowers/iris.png'),
        ('Орхидея', 'Белый', 300, 95, '/assets/flowers/orchid.png')
      `);

      console.log('Тестовые данные добавлены.');
    } else {
      console.log(`В таблице flowers уже есть ${flowersCount.rows[0].count} записей.`);
    }

    console.log('Обновление базы данных успешно завершено!');
  } catch (error) {
    console.error('Произошла ошибка при обновлении базы данных:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateDatabase(); 