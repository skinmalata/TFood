import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table (base for all roles)
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).unique().notNullable();
    table.string('phone', 20).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.enum('role', ['consumer', 'vendor', 'admin']).notNullable();
    table.string('avatar_url', 500).nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('email_verified_at').nullable();
    table.timestamp('phone_verified_at').nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });

  // Consumer-specific data
  await knex.schema.createTable('consumers', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('default_address').nullable();
    table.decimal('latitude', 10, 8).nullable();
    table.decimal('longitude', 11, 8).nullable();
    table.timestamps(true, true);
  });

  // Vendors (extends users via user_id)
  await knex.schema.createTable('vendors', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('business_name', 255).notNullable();
    table.text('business_address').notNullable();
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.enum('status', ['pending', 'vetting', 'approved', 'rejected', 'suspended']).defaultTo('pending');
    table.string('cuisine_type', 100).notNullable();
    table.text('description').nullable();
    table.string('cover_image_url', 500).nullable();
    table.string('logo_url', 500).nullable();
    table.decimal('delivery_radius', 10, 2).defaultTo(5.0);
    table.integer('preparation_time').defaultTo(30);
    table.boolean('is_open').defaultTo(false);
    table.string('opening_hours', 10).nullable();
    table.string('closing_hours', 10).nullable();
    table.decimal('rating', 3, 2).defaultTo(0.0);
    table.integer('total_orders').defaultTo(0);
    table.string('bank_account_name', 255).nullable();
    table.string('bank_name', 100).nullable();
    table.string('bank_account_number', 20).nullable();
    table.timestamps(true, true);
  });

  // Vendor documents (for vetting)
  await knex.schema.createTable('vendor_documents', (table) => {
    table.increments('id').primary();
    table.integer('vendor_id').unsigned().notNullable().references('id').inTable('vendors').onDelete('CASCADE');
    table.enum('type', ['cac', 'nafdac', 'identity', 'utility_bill', 'other']).notNullable();
    table.string('file_url', 500).notNullable();
    table.timestamp('verified_at').nullable();
    table.integer('verified_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  // Menu items
  await knex.schema.createTable('menu_items', (table) => {
    table.increments('id').primary();
    table.integer('vendor_id').unsigned().notNullable().references('id').inTable('vendors').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.decimal('price', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('NGN');
    table.string('image_url', 500).nullable();
    table.string('category', 100).notNullable();
    table.boolean('is_available').defaultTo(true);
    table.boolean('is_popular').defaultTo(false);
    table.integer('preparation_time').nullable();
    table.timestamps(true, true);
  });

  // Saved cards
  await knex.schema.createTable('saved_cards', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('authorization_code', 255).notNullable();
    table.string('last4', 4).notNullable();
    table.string('brand', 50).notNullable();
    table.string('exp_month', 2).notNullable();
    table.string('exp_year', 4).notNullable();
    table.boolean('is_default').defaultTo(false);
    table.timestamps(true, true);
  });

  // Orders
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_number', 20).unique().notNullable();
    table.integer('consumer_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('vendor_id').unsigned().notNullable().references('id').inTable('vendors').onDelete('CASCADE');
    table.decimal('total_amount', 10, 2).notNullable();
    table.decimal('delivery_fee', 10, 2).defaultTo(0);
    table.enum('status', [
      'pending', 'accepted', 'declined', 'preparing',
      'ready', 'out_for_delivery', 'delivered', 'cancelled',
    ]).defaultTo('pending');
    table.enum('payment_status', ['pending', 'success', 'failed', 'refunded']).defaultTo('pending');
    table.enum('delivery_method', ['pickup', 'delivery']).defaultTo('pickup');
    table.text('delivery_address').nullable();
    table.decimal('delivery_latitude', 10, 8).nullable();
    table.decimal('delivery_longitude', 11, 8).nullable();
    table.timestamp('estimated_delivery_time').nullable();
    table.timestamp('actual_delivery_time').nullable();
    table.text('notes').nullable();
    table.integer('accepted_by').unsigned().nullable().references('id').inTable('users');
    table.timestamp('accepted_at').nullable();
    table.timestamps(true, true);
  });

  // Order items
  await knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('menu_item_id').unsigned().notNullable().references('id').inTable('menu_items');
    table.string('name', 255).notNullable();
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('subtotal', 10, 2).notNullable();
    table.text('special_instructions').nullable();
  });

  // Chat messages
  await knex.schema.createTable('chat_messages', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('sender_id').unsigned().notNullable().references('id').inTable('users');
    table.enum('sender_role', ['consumer', 'vendor', 'admin']).notNullable();
    table.enum('message_type', ['text', 'voice', 'image']).defaultTo('text');
    table.text('content').notNullable();
    table.string('voice_url', 500).nullable();
    table.string('image_url', 500).nullable();
    table.integer('duration').nullable();
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamps(true, true);
  });

  // Voice calls
  await knex.schema.createTable('voice_calls', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('caller_id').unsigned().notNullable().references('id').inTable('users');
    table.integer('receiver_id').unsigned().notNullable().references('id').inTable('users');
    table.string('call_sid', 255).notNullable();
    table.integer('duration').defaultTo(0);
    table.enum('status', ['initiated', 'ongoing', 'completed', 'missed']).defaultTo('initiated');
    table.timestamp('started_at').nullable();
    table.timestamp('ended_at').nullable();
    table.timestamps(true, true);
  });

  // Reviews
  await knex.schema.createTable('reviews', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE').unique();
    table.integer('consumer_id').unsigned().notNullable().references('id').inTable('users');
    table.integer('vendor_id').unsigned().notNullable().references('id').inTable('vendors').onDelete('CASCADE');
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('comment').nullable();
    table.timestamps(true, true);
  });

  // Disputes
  await knex.schema.createTable('disputes', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('raised_by').unsigned().notNullable().references('id').inTable('users');
    table.enum('raised_by_role', ['consumer', 'vendor']).notNullable();
    table.string('reason', 255).notNullable();
    table.text('description').notNullable();
    table.enum('status', ['open', 'under_review', 'resolved', 'dismissed']).defaultTo('open');
    table.text('admin_notes').nullable();
    table.integer('resolved_by').unsigned().nullable().references('id').inTable('users');
    table.timestamp('resolved_at').nullable();
    table.timestamps(true, true);
  });

  // Payment transactions
  await knex.schema.createTable('payment_transactions', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users');
    table.string('reference', 100).unique().notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('NGN');
    table.enum('status', ['pending', 'success', 'failed', 'refunded']).defaultTo('pending');
    table.enum('gateway', ['paystack', 'flutterwave']).notNullable();
    table.json('gateway_response').nullable();
    table.timestamp('paid_at').nullable();
    table.timestamps(true, true);
  });

  // Admin activity log
  await knex.schema.createTable('admin_logs', (table) => {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().notNullable().references('id').inTable('users');
    table.string('action', 255).notNullable();
    table.string('entity_type', 100).nullable();
    table.integer('entity_id').unsigned().nullable();
    table.json('details').nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'admin_logs',
    'payment_transactions',
    'disputes',
    'reviews',
    'voice_calls',
    'chat_messages',
    'order_items',
    'orders',
    'saved_cards',
    'menu_items',
    'vendor_documents',
    'vendors',
    'consumers',
    'users',
  ];
  for (const table of tables.reverse()) {
    await knex.schema.dropTableIfExists(table);
  }
}
