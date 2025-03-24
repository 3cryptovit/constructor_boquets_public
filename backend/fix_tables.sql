-- Добавление недостающих полей в таблицы, если их ещё нет
-- Добавление роли в таблицу users, если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- bouquet_flowers: position_x
ALTER TABLE IF EXISTS bouquet_flowers
    ADD COLUMN IF NOT EXISTS position_x INTEGER;

-- bouquet_flowers: position_y
ALTER TABLE IF EXISTS bouquet_flowers
    ADD COLUMN IF NOT EXISTS position_y INTEGER;

-- bouquet_flowers: color
ALTER TABLE IF EXISTS bouquet_flowers
    ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- bouquets: image_url
ALTER TABLE IF EXISTS bouquets
    ADD COLUMN IF NOT EXISTS image_url TEXT;

-- bouquets: circle_count
ALTER TABLE IF EXISTS bouquets
    ADD COLUMN IF NOT EXISTS circle_count INTEGER;

-- bouquets: flower_count
ALTER TABLE IF EXISTS bouquets
    ADD COLUMN IF NOT EXISTS flower_count INTEGER;

-- bouquets: user_id
ALTER TABLE IF EXISTS bouquets
    ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- bouquets: добавим URL изображения по шаблону, если оно не задано
UPDATE bouquets
SET image_url = '/assets/boquet_' || id || '.webp'
WHERE image_url IS NULL;

-- flowers: image_url
ALTER TABLE IF EXISTS flowers
    ADD COLUMN IF NOT EXISTS image_url TEXT;

-- users: role
ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20);

-- orders: created_at
ALTER TABLE IF EXISTS orders
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
