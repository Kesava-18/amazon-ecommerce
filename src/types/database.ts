export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  role: 'customer' | 'seller' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Seller {
  id: string
  user_id: string
  business_name: string
  description?: string
  logo_url?: string
  website_url?: string
  phone?: string
  rating: number
  total_sales: number
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  seller_id: string
  category_id: string
  name: string
  slug: string
  description?: string
  short_description?: string
  sku?: string
  price: number
  compare_price?: number
  cost_price?: number
  stock_quantity: number
  low_stock_threshold: number
  weight?: number
  dimensions?: any
  tags?: string[]
  features?: string[]
  specifications?: any
  rating: number
  review_count: number
  view_count: number
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  seller?: Seller
  category?: Category
  images?: ProductImage[]
  variants?: ProductVariant[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text?: string
  sort_order: number
  is_primary: boolean
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  value: string
  price_adjustment: number
  stock_quantity: number
  sku?: string
  is_active: boolean
  created_at: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  variant_id?: string
  quantity: number
  created_at: string
  updated_at: string
  product?: Product
  variant?: ProductVariant
}

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product
}

export interface Address {
  id: string
  user_id: string
  type: string
  first_name: string
  last_name: string
  company?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  payment_method?: string
  payment_intent_id?: string
  shipping_address: any
  billing_address: any
  notes?: string
  tracking_number?: string
  shipped_at?: string
  delivered_at?: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id?: string
  seller_id: string
  quantity: number
  unit_price: number
  total_price: number
  product_snapshot: any
  created_at: string
  product?: Product
  variant?: ProductVariant
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  order_item_id?: string
  rating: number
  title?: string
  content?: string
  images?: string[]
  is_verified_purchase: boolean
  helpful_count: number
  created_at: string
  updated_at: string
  user?: User
}