-- Таблица цветов (без цвета!)
CREATE TABLE flowers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,  -- Название цветка
    price DECIMAL(10, 2) NOT NULL,  -- Цена за 1 штуку
    image_url TEXT  -- Изображение цветка
);

-- Таблица букетов
CREATE TABLE bouquets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,  -- Название букета
    circle_count INTEGER NOT NULL,  -- Количество окружностей
    flower_count INTEGER NOT NULL,  -- Общее количество цветов
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица состава букета (тут цвет!)
CREATE TABLE bouquet_flowers (
    id SERIAL PRIMARY KEY,
    bouquet_id INTEGER REFERENCES bouquets(id) ON DELETE CASCADE,
    flower_id INTEGER REFERENCES flowers(id) ON DELETE CASCADE,
    position_x INTEGER NOT NULL,  -- X-координата цветка в букете
    position_y INTEGER NOT NULL,  -- Y-координата цветка в букете
    color VARCHAR(50) NOT NULL  -- Цвет конкретного цветка
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
