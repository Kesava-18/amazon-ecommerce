import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Account from './pages/Account/Account'
import Orders from './pages/Account/Orders'
import Wishlist from './pages/Wishlist'
import SellerDashboard from './pages/Seller/Dashboard'
import AdminDashboard from './pages/Admin/Dashboard'
import { useAuthStore } from './store/authStore'
import { useCartStore } from './store/cartStore'
import LoadingSpinner from './components/UI/LoadingSpinner'

function App() {
  const { user, loading } = useAuthStore()
  const { fetchCart } = useCartStore()

  useEffect(() => {
    if (user) {
      fetchCart(user.id)
    }
  }, [user])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={user ? <Checkout /> : <Navigate to="/login" />} />
            <Route path="wishlist" element={user ? <Wishlist /> : <Navigate to="/login" />} />
            <Route path="account" element={user ? <Account /> : <Navigate to="/login" />} />
            <Route path="orders" element={user ? <Orders /> : <Navigate to="/login" />} />
            <Route path="seller/dashboard" element={user ? <SellerDashboard /> : <Navigate to="/login" />} />
            <Route path="admin/*" element={user ? <AdminDashboard /> : <Navigate to="/login" />} />
          </Route>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App