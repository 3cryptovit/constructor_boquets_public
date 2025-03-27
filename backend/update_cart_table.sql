-- Добавляем поле quantity в таблицу cart, если его ещё нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'cart' 
                  AND column_name = 'quantity') THEN
        ALTER TABLE cart ADD COLUMN quantity INTEGER DEFAULT 1;
    END IF;
END $$;

-- Добавляем уникальное ограничение на комбинацию user_id и bouquet_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_user_bouquet_unique') THEN
        ALTER TABLE cart ADD CONSTRAINT cart_user_bouquet_unique UNIQUE (user_id, bouquet_id);
    END IF;
END $$;

-- Создаем индексы для оптимизации запросов
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cart_user') THEN
        CREATE INDEX idx_cart_user ON cart(user_id);
    END IF;
END $$;

-- Индекс для orders.user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_user') THEN
        CREATE INDEX idx_orders_user ON orders(user_id);
    END IF;
END $$;

-- Настраиваем каскадное удаление для ссылки на users
DO $$
BEGIN
    -- Удаляем существующее ограничение FK, если оно есть с другими настройками
    BEGIN
        ALTER TABLE cart DROP CONSTRAINT IF EXISTS cart_user_id_fkey;
    EXCEPTION WHEN OTHERS THEN
        -- ничего не делаем если ограничения нет
    END;
    
    -- Добавляем новое ограничение с каскадным удалением
    ALTER TABLE cart 
    ADD CONSTRAINT cart_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$; 