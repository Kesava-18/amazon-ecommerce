import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Order } from '../../types/database'

const Orders = () => {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-purple-100 text-purple-800'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBagIcon className="mx-auto h-24 w-24 text-gray-300 mb-8" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
        <p className="text-gray-600 mb-8">Start shopping to see your orders here!</p>
        <Link
          to="/products"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Order Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="mt-4 sm:mt-0 text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${order.total_amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <div className="space-y-4">
                {order.items?.map((item) => {
                  const product = item.product
                  const primaryImage = product?.images?.[0]

                  return (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={product?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        {product ? (
                          <Link
                            to={`/product/${product.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {item.product_snapshot?.name || 'Product'}
                          </span>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </span>
                          <span className="text-sm text-gray-500">
                            ${item.unit_price.toFixed(2)} each
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          ${item.total_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                }) || (
                  <p className="text-gray-500 text-center py-8">No items found for this order</p>
                )}
              </div>

              {/* Order Actions */}
              <div className="border-t pt-4 mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  {order.tracking_number && (
                    <p>Tracking: {order.tracking_number}</p>
                  )}
                </div>
                
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  {order.status === 'delivered' && (
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Leave Review
                    </button>
                  )}
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View Details
                  </button>
                  {order.status === 'delivered' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                      Reorder
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Orders