import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthStore {
  user: User | null
  profile: any | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: any | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  }
}))

// Initialize auth state
supabase.auth.onAuthStateChange(async (event, session) => {
  const { setUser, setProfile, setLoading } = useAuthStore.getState()
  
  setLoading(true)
  
  if (session?.user) {
    setUser(session.user)
    
    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    setProfile(profile)
  } else {
    setUser(null)
    setProfile(null)
  }
  
  setLoading(false)
})