exports.up = pgm => {
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
    price: {
      type: 'decimal(10,2)',
      default: 0
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

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
};

exports.down = pgm => {
  pgm.dropTable('bouquet_flowers');
  pgm.dropTable('bouquets');
}; 