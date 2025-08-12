import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrashIcon, ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline'
import { useWishlistStore } from '../store/wishlistStore'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const Wishlist = () => {
  const { user } = useAuthStore()
  const { items, loading, removeItem, fetchWishlist } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()

  useEffect(() => {
    if (user) {
      fetchWishlist(user.id)
    }
  }, [user])

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId)
      toast.success('Removed from wishlist')
    } catch (error) {
      toast.error('Failed to remove item')
    }
  }

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId)
      toast.success('Added to cart!')
    } catch (error) {
      toast.error('Failed to add to cart')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm">
                <div className="aspect-square bg-gray-200 rounded-t-xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <HeartIcon className="mx-auto h-24 w-24 text-gray-300 mb-8" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
        <p className="text-gray-600 mb-8">Save items you love for later!</p>
        <Link
          to="/products"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
        <p className="text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => {
          const product = item.product
          if (!product) return null

          const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]

          return (
            <div key={item.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <Link to={`/product/${product.id}`} className="block">
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
                  
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemoveItem(item.id)
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon className="h-5 w-5 text-red-500" />
                  </button>
                </div>
              </Link>

              <div className="p-4">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                {product.seller && (
                  <p className="text-sm text-gray-500 mb-3">
                    by {product.seller.business_name}
                  </p>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.compare_price && product.compare_price > product.price && (
                    <span className="text-sm text-gray-500 line-through">
                      ${product.compare_price.toFixed(2)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(product.id)}
                  disabled={product.stock_quantity === 0}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
                >
                  <ShoppingCartIcon className="h-4 w-4" />
                  <span>
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Wishlist