import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartIcon, ShoppingCartIcon, StarIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Product } from '../../types/database'
import { useCartStore } from '../../store/cartStore'
import { useWishlistStore } from '../../store/wishlistStore'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useAuthStore()
  const { addItem: addToCart } = useCartStore()
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()
  const [isLoading, setIsLoading] = useState(false)
  
  const isInWishlist = wishlistItems.some(item => item.product_id === product.id)
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast.error('Please sign in to add items to cart')
      return
    }
    
    setIsLoading(true)
    try {
      await addToCart(product.id)
      toast.success('Added to cart!')
    } catch (error) {
      toast.error('Failed to add to cart')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast.error('Please sign in to use wishlist')
      return
    }
    
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

  const discountPercentage = product.compare_price 
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <Link to={`/product/${product.id}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt_text || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400 text-lg">No Image</span>
            </div>
          )}
          
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              -{discountPercentage}%
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            {isInWishlist ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Seller */}
          {product.seller && (
            <p className="text-sm text-gray-500 mb-1">{product.seller.business_name}</p>
          )}
          
          {/* Product Name */}
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              ({product.review_count})
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.compare_price.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isLoading || product.stock_quantity === 0}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
            >
              <ShoppingCartIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Stock Status */}
          {product.stock_quantity === 0 && (
            <p className="text-red-500 text-sm mt-2">Out of Stock</p>
          )}
          {product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold && (
            <p className="text-orange-500 text-sm mt-2">Only {product.stock_quantity} left!</p>
          )}
        </div>
      </Link>
    </div>
  )
}

export default ProductCard