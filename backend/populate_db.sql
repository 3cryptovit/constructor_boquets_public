-- Проверяем существование таблиц
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bouquets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Проверяем наличие админа, если нет - создаем
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2b$10$3JqfeJ0PG9O/EHlQzIpvBOXGxwf.BRa9K9L5Py3f.7HAJcQJU5PYG', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Получаем id администратора
DO $$
DECLARE
    admin_id INTEGER;
BEGIN
    SELECT id INTO admin_id FROM users WHERE username = 'admin';
    
    -- Добавляем букеты, если они не существуют
    INSERT INTO bouquets (id, user_id, name, description, price, image_url)
    VALUES 
    (1, admin_id, 'Весенний поцелуй', 'Нежный букет из розовых тюльпанов, лилий и ирисов', 3500, '/assets/boquet_1.webp'),
    (2, admin_id, 'Парижский шарм', 'Элегантный букет из пионов, ранункулюсов и роз', 4200, '/assets/boquet_2.webp'),
    (3, admin_id, 'Нежность облаков', 'Воздушный букет из белых роз и эвкалипта', 3800, '/assets/boquet_3.webp'),
    (4, admin_id, 'Тропический рай', 'Яркий букет из экзотических орхидей и стрелиций', 5500, '/assets/boquet_4.webp')
    ON CONFLICT (id) DO UPDATE 
    SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        image_url = EXCLUDED.image_url;
END $$; 