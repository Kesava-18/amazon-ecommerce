import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { CartItem } from '../types/database'

interface CartStore {
  items: CartItem[]
  loading: boolean
  addItem: (productId: string, variantId?: string, quantity?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  fetchCart: (userId: string) => Promise<void>
  getItemCount: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      addItem: async (productId: string, variantId?: string, quantity = 1) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        set({ loading: true })

        try {
          const { data, error } = await supabase
            .from('carts')
            .upsert({
              user_id: user.id,
              product_id: productId,
              variant_id: variantId,
              quantity
            }, {
              onConflict: 'user_id,product_id,variant_id'
            })
            .select('*, product:products(*), variant:product_variants(*)')
            .single()

          if (error) throw error

          set(state => ({
            items: [...state.items.filter(item => 
              !(item.product_id === productId && item.variant_id === variantId)
            ), data],
            loading: false
          }))
        } catch (error) {
          console.error('Error adding to cart:', error)
          set({ loading: false })
        }
      },

      removeItem: async (itemId: string) => {
        set({ loading: true })

        try {
          const { error } = await supabase
            .from('carts')
            .delete()
            .eq('id', itemId)

          if (error) throw error

          set(state => ({
            items: state.items.filter(item => item.id !== itemId),
            loading: false
          }))
        } catch (error) {
          console.error('Error removing from cart:', error)
          set({ loading: false })
        }
      },

      updateQuantity: async (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        set({ loading: true })

        try {
          const { error } = await supabase
            .from('carts')
            .update({ quantity })
            .eq('id', itemId)

          if (error) throw error

          set(state => ({
            items: state.items.map(item =>
              item.id === itemId ? { ...item, quantity } : item
            ),
            loading: false
          }))
        } catch (error) {
          console.error('Error updating cart:', error)
          set({ loading: false })
        }
      },

      clearCart: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        set({ loading: true })

        try {
          const { error } = await supabase
            .from('carts')
            .delete()
            .eq('user_id', user.id)

          if (error) throw error

          set({ items: [], loading: false })
        } catch (error) {
          console.error('Error clearing cart:', error)
          set({ loading: false })
        }
      },

      fetchCart: async (userId: string) => {
        set({ loading: true })

        try {
          const { data, error } = await supabase
            .from('carts')
            .select(`
              *,
              product:products(*,
                images:product_images(*),
                seller:sellers(*)
              ),
              variant:product_variants(*)
            `)
            .eq('user_id', userId)

          if (error) throw error

          set({ items: data || [], loading: false })
        } catch (error) {
          console.error('Error fetching cart:', error)
          set({ items: [], loading: false })
        }
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.product?.price || 0
          const adjustment = item.variant?.price_adjustment || 0
          return total + ((price + adjustment) * item.quantity)
        }, 0)
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
)