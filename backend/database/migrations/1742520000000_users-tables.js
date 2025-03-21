exports.up = pgm => {
  // Создаем таблицу пользователей
  pgm.createTable('users', {
    id: 'id',
    username: {
      type: 'varchar(100)',
      notNull: true,
      unique: true
    },
    password: {
      type: 'varchar(255)',
      notNull: true
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Создаем таблицу цветов
  pgm.createTable('flowers', {
    id: 'id',
    name: {
      type: 'varchar(100)',
      notNull: true
    },
    color: {
      type: 'varchar(50)',
      notNull: true
    },
    price: {
      type: 'decimal(10,2)',
      notNull: true,
      default: 0
    },
    image_url: {
      type: 'text'
    },
    popularity: {
      type: 'integer',
      default: 0
    }
  });

  // Создаем таблицу букетов
  pgm.createTable('bouquets', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    name: {
      type: 'varchar(100)',
      notNull: true
    },
    description: {
      type: 'text'
    },
    price: {
      type: 'decimal(10,2)',
      default: 0
    },
    image_url: {
      type: 'text'
    },
    circle_count: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    flower_count: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Создаем таблицу цветов в букете
  pgm.createTable('bouquet_flowers', {
    id: 'id',
    bouquet_id: {
      type: 'integer',
      notNull: true,
      references: 'bouquets(id)',
      onDelete: 'CASCADE'
    },
    flower_id: {
      type: 'integer',
      notNull: true,
      references: 'flowers(id)',
      onDelete: 'CASCADE'
    },
    position_x: {
      type: 'integer',
      notNull: true
    },
    position_y: {
      type: 'integer',
      notNull: true
    },
    color: {
      type: 'varchar(50)',
      notNull: true
    }
  });

  // Создаем таблицу корзины
  pgm.createTable('cart', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    bouquet_id: {
      type: 'integer',
      notNull: true,
      references: 'bouquets(id)',
      onDelete: 'CASCADE'
    },
    quantity: {
      type: 'integer',
      notNull: true,
      default: 1
    },
    added_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Создаем таблицу заказов
  pgm.createTable('orders', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'новый'
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Создаем таблицу товаров в заказе
  pgm.createTable('order_items', {
    id: 'id',
    order_id: {
      type: 'integer',
      notNull: true,
      references: 'orders(id)',
      onDelete: 'CASCADE'
    },
    bouquet_id: {
      type: 'integer',
      notNull: true,
      references: 'bouquets(id)',
      onDelete: 'CASCADE'
    },
    quantity: {
      type: 'integer',
      notNull: true,
      default: 1
    },
    price: {
      type: 'decimal(10,2)',
      notNull: true,
      default: 0
    }
  });

  // Добавляем тестовые данные для цветов
  pgm.sql(`
    INSERT INTO flowers (name, color, price, image_url, popularity) VALUES
    ('Роза', 'Красный', 2.50, 'https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=500&auto=format&fit=crop', 100),
    ('Тюльпан', 'Желтый', 1.80, 'https://images.unsplash.com/photo-1591639614777-a2a5755ab877?w=500&auto=format&fit=crop', 80),
    ('Лилия', 'Белый', 3.20, 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=500&auto=format&fit=crop', 90),
    ('Пион', 'Розовый', 4.50, 'https://images.unsplash.com/photo-1527061011048-a3781cc00b97?w=500&auto=format&fit=crop', 95),
    ('Гербера', 'Оранжевый', 2.00, 'https://images.unsplash.com/photo-1590586767908-20d8c7ae2605?w=500&auto=format&fit=crop', 75)
  `);
};

exports.down = pgm => {
  pgm.dropTable('order_items', { cascade: true });
  pgm.dropTable('orders', { cascade: true });
  pgm.dropTable('cart', { cascade: true });
  pgm.dropTable('bouquet_flowers', { cascade: true });
  pgm.dropTable('bouquets', { cascade: true });
  pgm.dropTable('flowers', { cascade: true });
  pgm.dropTable('users', { cascade: true });
}; 