"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { supabase, type User } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateUserStatus: (status: "online" | "away" | "busy" | "offline") => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("Session error:", error)
          setLoading(false)
          return
        }

        if (session?.user) {
          setSupabaseUser(session.user)
          fetchUserProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false)
          })
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      setSupabaseUser(session?.user ?? null)

      if (session?.user) {
        if (event === "SIGNED_IN") {
          fetchUserProfile(session.user.id)
          updateUserStatus("online").catch(console.error)
        }
      } else {
        setUser(null)
        if (loading) setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser.user) {
            const newUser: Partial<User> = {
              id: authUser.user.id,
              email: authUser.user.email || "",
              display_name: authUser.user.user_metadata?.display_name || authUser.user.email?.split("@")[0] || "User",
              status: "online",
              role: "member",
            }

            const { data: createdUser } = await supabase.from("users").insert(newUser).select().single()

            if (createdUser) {
              setUser(createdUser as User)
            }
          }
        } else {
          throw error
        }
      } else {
        setUser(data)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      const { data: authUser } = await supabase.auth.getUser()
      if (authUser.user) {
        setUser({
          id: authUser.user.id,
          email: authUser.user.email || "",
          display_name: authUser.user.user_metadata?.display_name || "User",
          status: "online",
          role: "member",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })
      if (error) throw error

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      updateUserStatus("offline").catch(console.error)

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const updateUserStatus = async (status: "online" | "away" | "busy" | "offline") => {
    if (!user) return

    try {
      setUser((prev) => (prev ? { ...prev, status } : null))

      const { error } = await supabase.rpc("update_user_status", { new_status: status })
      if (error) {
        console.error("Error updating user status:", error)
        setUser((prev) => (prev ? { ...prev, status: prev.status } : null))
      }
    } catch (error) {
      console.error("Error updating user status:", error)
    }
  }

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
