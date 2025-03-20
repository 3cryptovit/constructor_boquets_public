exports.up = pgm => {
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

  // Добавляем тестовые данные
  pgm.sql(`
    INSERT INTO flowers (name, color, price, popularity) VALUES
    ('Роза', 'Красный', 2.50, 100),
    ('Тюльпан', 'Желтый', 1.80, 80),
    ('Лилия', 'Белый', 3.20, 90)
  `);
};

exports.down = pgm => {
  pgm.dropTable('flowers');
}; 