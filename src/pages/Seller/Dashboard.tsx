import React, { useEffect, useState } from 'react'
import { 
  ChartBarIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

const SellerDashboard = () => {
  const { user, profile } = useAuthStore()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Get seller info
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!seller) {
        // Create seller profile if it doesn't exist
        const { data: newSeller } = await supabase
          .from('sellers')
          .insert({
            user_id: user.id,
            business_name: profile?.full_name || 'My Store',
            description: 'Welcome to my store!'
          })
          .select()
          .single()
        
        seller.id = newSeller.id
      }

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*, images:product_images(*)')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch orders
      const { data: ordersData } = await supabase
        .from('order_items')
        .select(`
          *,
          order:orders(*),
          product:products(name)
        `)
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Calculate stats
      const totalProducts = productsData?.length || 0
      const totalOrders = ordersData?.length || 0
      const totalRevenue = ordersData?.reduce((sum: number, item: any) => sum + item.total_price, 0) || 0
      const uniqueCustomers = new Set(ordersData?.map((item: any) => item.order?.user_id)).size || 0

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        totalCustomers: uniqueCustomers
      })
      setRecentOrders(ordersData?.slice(0, 5) || [])
      setProducts(productsData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: ShoppingBagIcon,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ChartBarIcon,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      name: 'Customers',
      value: stats.totalCustomers.toString(),
      icon: UserGroupIcon,
      color: 'text-orange-600 bg-orange-100'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-md ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Orders
            </h3>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.product?.name || 'Product'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Order #{item.order?.order_number} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${item.total_price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            )}
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Products
            </h3>
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product: any) => {
                  const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0]
                  return (
                    <div key={product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${product.price.toFixed(2)} • Stock: {product.stock_quantity}
                        </p>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        product.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No products yet</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Your First Product
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard