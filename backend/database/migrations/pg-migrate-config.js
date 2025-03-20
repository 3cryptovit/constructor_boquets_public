require('dotenv').config();

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  migrationsTable: "pgmigrations",
  dir: "database/migrations", // Должно быть "database/migrations"
  direction: "up",
};
