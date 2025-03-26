-- Добавление поля email в таблицу users
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS email TEXT; 