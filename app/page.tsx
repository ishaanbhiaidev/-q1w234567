"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PersonalDashboard } from "@/components/personal-dashboard"
import { useAuth } from "@/components/auth/auth-provider"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect to login if Supabase is properly configured
    if (!loading && !user && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co") {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Show dashboard in demo mode if no user and Supabase not configured
  if (!user && (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "https://placeholder.supabase.co")) {
    return <PersonalDashboard />
  }

  if (!user) {
    return null
  }

  return <PersonalDashboard />
}
