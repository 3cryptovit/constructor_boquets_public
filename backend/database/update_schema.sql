-- Добавляем поле role в таблицу users, если оно не существует
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    END IF;
END $$;

-- Добавляем поле created_at в таблицу orders, если оно не существует
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Обновляем существующие записи users, устанавливая role = 'user' для null значений
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Обновляем существующие записи orders, устанавливая created_at = NOW() для null значений
UPDATE orders SET created_at = NOW() WHERE created_at IS NULL;

-- Добавляем индекс для ускорения поиска по полю role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_role'
    ) THEN
        CREATE INDEX idx_users_role ON users(role);
    END IF;
END $$;

-- Обновляем структуру таблицы bouquet_flowers для предотвращения дублирования позиций
DO $$
BEGIN
    -- Проверяем, существует ли ограничение для уникальности позиции в букете
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_bouquet_flowers_position'
    ) THEN
        -- Добавляем уникальное ограничение на комбинацию bouquet_id, position_x и position_y
        ALTER TABLE bouquet_flowers 
        ADD CONSTRAINT uq_bouquet_flowers_position 
        UNIQUE (bouquet_id, position_x, position_y);
    END IF;
END $$; 