/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Обновление таблицы users
  pgm.addColumns('users', {
    role: { type: 'varchar(20)', default: 'user' }
  }, { ifNotExists: true });

  // Обновление таблицы bouquets
  pgm.addColumns('bouquets', {
    circle_count: { type: 'integer', default: 0 },
    flower_count: { type: 'integer', default: 0 },
    image_url: { type: 'text' },
    description: { type: 'text' }
  }, { ifNotExists: true });

  // Связь bouquets с users
  pgm.addConstraint('bouquets', 'bouquets_user_id_fkey', {
    foreignKeys: {
      columns: ['user_id'],
      references: 'users(id)',
      onDelete: 'CASCADE'
    }
  }, { ifNotExists: true });

  // Обновление таблицы bouquet_flowers
  pgm.addColumns('bouquet_flowers', {
    position_x: { type: 'integer', default: 0 },
    position_y: { type: 'integer', default: 0 },
    color: { type: 'varchar(50)', default: '#FFFFFF' },
    quantity: { type: 'integer', default: 1 }
  }, { ifNotExists: true });

  // Обновление таблицы flowers
  pgm.addColumns('flowers', {
    image_url: { type: 'text' },
    popularity: { type: 'integer', default: 0 }
  }, { ifNotExists: true });

  // Обновление таблицы cart
  pgm.createConstraint('cart', 'cart_unique_user_bouquet', {
    unique: ['user_id', 'bouquet_id']
  }, { ifNotExists: true });

  // Обновление таблицы orders
  pgm.addColumns('orders', {
    bouquet_id: { type: 'integer', references: 'bouquets(id)' },
    total_price: { type: 'decimal(10,2)', default: 0 },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  }, { ifNotExists: true });

  // Добавление индексов для оптимизации запросов
  pgm.createIndex('bouquets', 'user_id');
  pgm.createIndex('bouquet_flowers', 'bouquet_id');
  pgm.createIndex('cart', 'user_id');
  pgm.createIndex('orders', 'user_id');
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  // Удаление индексов
  pgm.dropIndex('bouquets', 'user_id');
  pgm.dropIndex('bouquet_flowers', 'bouquet_id');
  pgm.dropIndex('cart', 'user_id');
  pgm.dropIndex('orders', 'user_id');

  // Удаление ограничений
  pgm.dropConstraint('cart', 'cart_unique_user_bouquet');
  pgm.dropConstraint('bouquets', 'bouquets_user_id_fkey');

  // Удаление колонок
  pgm.dropColumns('orders', ['bouquet_id', 'total_price', 'created_at']);
  pgm.dropColumns('flowers', ['image_url', 'popularity']);
  pgm.dropColumns('bouquet_flowers', ['position_x', 'position_y', 'color', 'quantity']);
  pgm.dropColumns('bouquets', ['circle_count', 'flower_count', 'image_url', 'description']);
  pgm.dropColumns('users', ['role']);
}; 