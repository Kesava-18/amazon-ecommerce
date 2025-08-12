import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  ChartBarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import AdminProducts from './AdminProducts'
import AdminOrders from './AdminOrders'
import AdminUsers from './AdminUsers'

const AdminDashboard = () => {
  const location = useLocation()
  const { profile } = useAuthStore()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch basic stats
      const [usersResult, productsResult, ordersResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount')
      ])

      const totalUsers = usersResult.count || 0
      const totalProducts = productsResult.count || 0
      const orders = ordersResult.data || []
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

      setStats({
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Only allow admin users
  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    )
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
    { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Orders', href: '/admin/orders', icon: CurrencyDollarIcon },
    { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
  ]

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: UserGroupIcon,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: ShoppingBagIcon,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: CurrencyDollarIcon,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      name: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: BuildingStorefrontIcon,
      color: 'text-orange-600 bg-orange-100'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your e-commerce platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex space-x-8 mb-8 border-b border-gray-200">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <Routes>
        <Route path="/" element={
          <div>
            {/* Stats Cards */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/admin/products"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <ShoppingBagIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Products</h4>
                    <p className="text-sm text-gray-500">View and edit all products</p>
                  </div>
                </Link>
                
                <Link
                  to="/admin/orders"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Process Orders</h4>
                    <p className="text-sm text-gray-500">Handle order fulfillment</p>
                  </div>
                </Link>
                
                <Link
                  to="/admin/users"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <UserGroupIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Users</h4>
                    <p className="text-sm text-gray-500">View user accounts</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        } />
        <Route path="/products" element={<AdminProducts />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/users" element={<AdminUsers />} />
      </Routes>
    </div>
  )
}

export default AdminDashboard