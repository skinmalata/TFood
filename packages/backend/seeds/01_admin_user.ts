import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  await knex('menu_items').del();
  await knex('consumers').del();
  await knex('vendors').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('Admin@12345', 12);

  // Admin user
  const [adminRow] = await knex('users').insert({
    email: 'admin@tfood.ng',
    phone: '+2348000000000',
    password_hash: passwordHash,
    first_name: 'Super',
    last_name: 'Admin',
    role: 'admin',
    is_active: true,
    email_verified_at: new Date(),
    phone_verified_at: new Date(),
  }).returning('id');
  const adminId = typeof adminRow === 'object' ? adminRow.id : adminRow;

  // Sample vendor
  const [vendorUserRow] = await knex('users').insert({
    email: 'vendor@test.com',
    phone: '+2348012345678',
    password_hash: passwordHash,
    first_name: 'Chidi',
    last_name: 'Okonkwo',
    role: 'vendor',
    is_active: true,
    email_verified_at: new Date(),
    phone_verified_at: new Date(),
  }).returning('id');
  const vendorUserId = typeof vendorUserRow === 'object' ? vendorUserRow.id : vendorUserRow;

  const [vendorRow] = await knex('vendors').insert({
    user_id: vendorUserId,
    business_name: 'Chidi\'s Kitchen',
    business_address: '42 Awolowo Road, Ikoyi, Lagos',
    latitude: 6.4489,
    longitude: 3.4357,
    status: 'approved',
    cuisine_type: 'Nigerian',
    description: 'Authentic Nigerian home-cooked meals. Try our jollof rice, egusi soup, and grilled fish!',
    delivery_radius: 10,
    preparation_time: 25,
    is_open: true,
    opening_hours: '08:00',
    closing_hours: '22:00',
    rating: 4.5,
    total_orders: 150,
  }).returning('id');
  const vendorId = typeof vendorRow === 'object' ? vendorRow.id : vendorRow;

  // Sample consumer
  const [consumerUserRow] = await knex('users').insert({
    email: 'consumer@test.com',
    phone: '+2348098765432',
    password_hash: passwordHash,
    first_name: 'Ada',
    last_name: 'Eze',
    role: 'consumer',
    is_active: true,
    email_verified_at: new Date(),
    phone_verified_at: new Date(),
  }).returning('id');
  const consumerUserId = typeof consumerUserRow === 'object' ? consumerUserRow.id : consumerUserRow;

  await knex('consumers').insert({
    user_id: consumerUserId,
    default_address: '15 Bourdillon Road, Ikoyi, Lagos',
    latitude: 6.4523,
    longitude: 3.4312,
  });

  // Menu items for sample vendor
  const menuItems = [
    { vendor_id: vendorId, name: 'Jollof Rice & Chicken', description: 'Classic Nigerian jollof rice with fried chicken and plantain', price: 3500, category: 'Main Course', is_popular: true, preparation_time: 20 },
    { vendor_id: vendorId, name: 'Egusi Soup & Pounded Yam', description: 'Rich melon seed soup with assorted meat and smooth pounded yam', price: 4500, category: 'Main Course', is_popular: true, preparation_time: 30 },
    { vendor_id: vendorId, name: 'Fried Rice & Fish', description: 'Nigerian fried rice with grilled tilapia fish', price: 3800, category: 'Main Course', preparation_time: 25 },
    { vendor_id: vendorId, name: 'Pepper Soup', description: 'Spicy goat meat pepper soup', price: 2500, category: 'Soups', preparation_time: 15 },
    { vendor_id: vendorId, name: 'Small Chops', description: 'Assorted small chops: samosa, spring rolls, puff puff', price: 2000, category: 'Small Chops', preparation_time: 10 },
    { vendor_id: vendorId, name: 'Zobo Drink', description: 'Refreshing hibiscus drink', price: 500, category: 'Drinks', preparation_time: 2 },
    { vendor_id: vendorId, name: 'Chapman', description: 'Nigerian mixed fruit drink', price: 1000, category: 'Drinks', preparation_time: 5 },
  ];

  await knex('menu_items').insert(menuItems);

  console.log('Seed data inserted successfully!');
}
