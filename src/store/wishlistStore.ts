import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { WishlistItem } from '../types/database'

interface WishlistStore {
  items: WishlistItem[]
  loading: boolean
  addItem: (productId: string) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  fetchWishlist: (userId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  loading: false,

  addItem: async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    set({ loading: true })

    try {
      const { data, error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          product_id: productId
        })
        .select('*, product:products(*)')
        .single()

      if (error) throw error

      set(state => ({
        items: [...state.items, data],
        loading: false
      }))
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      set({ loading: false })
      throw error
    }
  },

  removeItem: async (itemId: string) => {
    set({ loading: true })

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      set(state => ({
        items: state.items.filter(item => item.id !== itemId),
        loading: false
      }))
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      set({ loading: false })
      throw error
    }
  },

  fetchWishlist: async (userId: string) => {
    set({ loading: true })

    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          product:products(*,
            images:product_images(*),
            seller:sellers(*)
          )
        `)
        .eq('user_id', userId)

      if (error) throw error

      set({ items: data || [], loading: false })
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      set({ items: [], loading: false })
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.some(item => item.product_id === productId)
  }
}))