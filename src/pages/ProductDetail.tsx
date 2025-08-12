import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  StarIcon, 
  HeartIcon, 
  ShoppingCartIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { supabase } from '../lib/supabase'
import { Product, Review } from '../types/database'
import { useCartStore } from '../store/cartStore'
import { useWishlistStore } from '../store/wishlistStore'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const { addItem: addToCart } = useCartStore()
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [quantity, setQuantity] = useState(1)

  const isInWishlist = product && wishlistItems.some(item => item.product_id === product.id)

  useEffect(() => {
    if (id) {
      fetchProduct()
      fetchReviews()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          variants:product_variants(*),
          seller:sellers(*),
          category:categories(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) throw error

      setProduct(data)
      
      // Set initial selected image
      const primaryImage = data.images?.find((img: any) => img.is_primary) || data.images?.[0]
      if (primaryImage) {
        setSelectedImage(primaryImage.url)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(full_name, avatar_url)
        `)
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to cart')
      return
    }

    if (!product) return

    try {
      await addToCart(product.id, selectedVariant || undefined, quantity)
      toast.success('Added to cart!')
    } catch (error) {
      toast.error('Failed to add to cart')
    }
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error('Please sign in to use wishlist')
      return
    }

    if (!product) return

    try {
      if (isInWishlist) {
        const wishlistItem = wishlistItems.find(item => item.product_id === product.id)
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem.id)
          toast.success('Removed from wishlist')
        }
      } else {
        await addToWishlist(product.id)
        toast.success('Added to wishlist!')
      }
    } catch (error) {
      toast.error('Failed to update wishlist')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-xl"></div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-12 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
        <Link
          to="/products"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Products
        </Link>
      </div>
    )
  }

  const discountPercentage = product.compare_price 
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-gray-700">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link 
              to={`/products?category=${product.category.slug}`} 
              className="hover:text-gray-700"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-xl">No Image</span>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image.url)}
                  className={`w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                    selectedImage === image.url ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt_text || ''}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Seller */}
          {product.seller && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sold by</span>
              <Link
                to={`/seller/${product.seller.id}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {product.seller.business_name}
              </Link>
              {product.seller.is_verified && (
                <ShieldCheckIcon className="h-4 w-4 text-green-500" />
              )}
            </div>
          )}

          {/* Product Name */}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              {product.rating.toFixed(1)} ({product.review_count} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    ${product.compare_price.toFixed(2)}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                    Save {discountPercentage}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Options</h3>
              <div className="space-y-2">
                {/* Group variants by name */}
                {Object.entries(
                  product.variants.reduce((acc, variant) => {
                    if (!acc[variant.name]) acc[variant.name] = []
                    acc[variant.name].push(variant)
                    return acc
                  }, {} as Record<string, any[]>)
                ).map(([variantName, variants]) => (
                  <div key={variantName}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variantName}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant.id)}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                            selectedVariant === variant.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {variant.value}
                          {variant.price_adjustment !== 0 && (
                            <span className="ml-1 text-xs">
                              ({variant.price_adjustment > 0 ? '+' : ''}${variant.price_adjustment.toFixed(2)})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-50"
                >
                  <span className="text-lg">−</span>
                </button>
                <span className="px-4 py-2 text-lg font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-50"
                >
                  <span className="text-lg">+</span>
                </button>
              </div>
              <span className="text-gray-600">
                {product.stock_quantity} available
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              <span>
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </span>
            </button>

            <button
              onClick={handleWishlistToggle}
              className="w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              {isInWishlist ? (
                <HeartSolidIcon className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5" />
              )}
              <span>
                {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </span>
            </button>
          </div>

          {/* Features */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center space-x-3">
              <TruckIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">30-day return guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description & Reviews */}
      <div className="mt-16 space-y-12">
        {/* Description */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Description</h2>
          {product.description ? (
            <div className="prose max-w-none text-gray-700">
              {product.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No description available.</p>
          )}
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            <div className="text-sm text-gray-600">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </div>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {review.user?.avatar_url ? (
                        <img
                          src={review.user.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {review.user?.full_name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {review.user?.full_name || 'Anonymous'}
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="font-medium text-gray-900 mb-2">
                          {review.title}
                        </h4>
                      )}
                      {review.content && (
                        <p className="text-gray-700">{review.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No reviews yet</p>
              <p className="text-sm text-gray-400">
                Be the first to review this product!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail