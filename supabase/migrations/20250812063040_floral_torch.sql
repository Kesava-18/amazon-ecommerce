/*
  # Complete E-commerce Platform Database Schema

  1. New Tables
    - `users` - Extended user profiles with addresses and preferences
    - `categories` - Product categories with hierarchical structure
    - `products` - Product catalog with detailed information
    - `product_images` - Multiple images per product
    - `product_variants` - Size, color, etc. variations
    - `reviews` - Product reviews and ratings
    - `carts` - Shopping cart items
    - `wishlists` - User wishlists
    - `orders` - Order management
    - `order_items` - Individual items in orders
    - `sellers` - Seller/vendor information
    - `addresses` - User shipping addresses

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Seller and admin role-based access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  phone text,
  role user_role DEFAULT 'customer',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  parent_id uuid REFERENCES categories(id),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  description text,
  logo_url text,
  website_url text,
  phone text,
  rating numeric(3,2) DEFAULT 0,
  total_sales integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  sku text UNIQUE,
  price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  cost_price numeric(10,2),
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  weight numeric(8,2),
  dimensions jsonb, -- {length, width, height, unit}
  tags text[],
  features text[],
  specifications jsonb,
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Product variants table (for size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g., "Size", "Color"
  value text NOT NULL, -- e.g., "Large", "Red"
  price_adjustment numeric(10,2) DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  sku text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'shipping', 'billing'
  first_name text NOT NULL,
  last_name text NOT NULL,
  company text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  phone text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Carts table
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  subtotal numeric(10,2) NOT NULL,
  tax_amount numeric(10,2) DEFAULT 0,
  shipping_amount numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_method text,
  payment_intent_id text, -- Stripe payment intent
  shipping_address jsonb NOT NULL,
  billing_address jsonb NOT NULL,
  notes text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  seller_id uuid REFERENCES sellers(id),
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  product_snapshot jsonb, -- Store product details at time of order
  created_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES order_items(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  images text[],
  is_verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id, order_item_id)
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Categories policies (public read)
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT TO authenticated, anon USING (is_active = true);

-- Sellers policies
CREATE POLICY "Anyone can read active sellers" ON sellers
  FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "Users can create seller profile" ON sellers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can update own profile" ON sellers
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Products policies
CREATE POLICY "Anyone can read active products" ON products
  FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "Sellers can manage own products" ON products
  FOR ALL TO authenticated USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );

-- Product images policies
CREATE POLICY "Anyone can read product images" ON product_images
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Sellers can manage own product images" ON product_images
  FOR ALL TO authenticated USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- Product variants policies
CREATE POLICY "Anyone can read product variants" ON product_variants
  FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "Sellers can manage own product variants" ON product_variants
  FOR ALL TO authenticated USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- Addresses policies
CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Carts policies
CREATE POLICY "Users can manage own cart" ON carts
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Wishlists policies
CREATE POLICY "Users can manage own wishlist" ON wishlists
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can read own order items" ON order_items
  FOR SELECT TO authenticated USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT TO authenticated WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- Reviews policies
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);

-- Insert sample categories
INSERT INTO categories (name, slug, description) VALUES
  ('Electronics', 'electronics', 'Latest gadgets and electronic devices'),
  ('Clothing', 'clothing', 'Fashion and apparel for all'),
  ('Home & Garden', 'home-garden', 'Everything for your home and garden'),
  ('Books', 'books', 'Books, magazines, and educational materials'),
  ('Sports', 'sports', 'Sports equipment and outdoor gear'),
  ('Beauty', 'beauty', 'Beauty and personal care products'),
  ('Toys', 'toys', 'Toys and games for all ages'),
  ('Automotive', 'automotive', 'Car parts and automotive accessories')
ON CONFLICT (slug) DO NOTHING;