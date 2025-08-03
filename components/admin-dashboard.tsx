"use client"

import { useState, useEffect } from "react"
import { Shield, Users, Code, Plus, Copy, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./auth/auth-provider"
import { supabase } from "@/lib/supabase"

interface PremiumCode {
  id: string
  code: string
  is_used: boolean
  used_by?: string
  used_at?: string
  created_at: string
  expires_at?: string
}

interface UserData {
  id: string
  email: string
  display_name: string
  role: string
  status: string
  created_at: string
}

export function AdminDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [premiumCodes, setPremiumCodes] = useState<PremiumCode[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [codeCount, setCodeCount] = useState(1)
  const [expiryDays, setExpiryDays] = useState(30)
  const [showCodes, setShowCodes] = useState(false)

  useEffect(() => {
    if (user?.role === "admin") {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      // Load premium codes
      const { data: codesData, error: codesError } = await supabase
        .from("premium_codes")
        .select("*")
        .order("created_at", { ascending: false })

      if (codesError) throw codesError
      setPremiumCodes(codesData || [])

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) throw usersError
      setUsers(usersData || [])
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePremiumCodes = async () => {
    try {
      const codes = []
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)

      for (let i = 0; i < codeCount; i++) {
        const code = generateRandomCode()
        codes.push({
          code,
          is_used: false,
          expires_at: expiryDate.toISOString(),
        })
      }

      const { data, error } = await supabase.from("premium_codes").insert(codes).select()

      if (error) throw error

      setPremiumCodes((prev) => [...(data || []), ...prev])
      setShowGenerateDialog(false)
      setCodeCount(1)

      toast({
        title: "Codes Generated",
        description: `Successfully generated ${codeCount} premium code${codeCount > 1 ? "s" : ""}`,
      })
    } catch (error) {
      console.error("Error generating codes:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate premium codes",
        variant: "destructive",
      })
    }
  }

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) result += "-"
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Copied",
        description: "Premium code copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      })
    }
  }

  const deleteCode = async (codeId: string) => {
    try {
      const { error } = await supabase.from("premium_codes").delete().eq("id", codeId)

      if (error) throw error

      setPremiumCodes((prev) => prev.filter((code) => code.id !== codeId))

      toast({
        title: "Code Deleted",
        description: "Premium code has been deleted",
      })
    } catch (error) {
      console.error("Error deleting code:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete premium code",
        variant: "destructive",
      })
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId)

      if (error) throw error

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}`,
      })
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">Access Denied</h3>
        <p className="text-gray-500">You need administrator privileges to access this page.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-red-500" />
            Admin Dashboard
          </CardTitle>
          <CardDescription className="text-gray-400">Manage users, premium codes, and system settings</CardDescription>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-sm text-gray-400">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.filter((u) => u.role === "premium").length}</p>
                <p className="text-sm text-gray-400">Premium Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
                <Code className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{premiumCodes.filter((c) => !c.is_used).length}</p>
                <p className="text-sm text-gray-400">Available Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Code className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{premiumCodes.filter((c) => c.is_used).length}</p>
                <p className="text-sm text-gray-400">Used Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Codes Management */}
      <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Premium Codes</CardTitle>
              <CardDescription className="text-gray-400">Generate and manage premium access codes</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCodes(!showCodes)}
                className="text-gray-400 hover:text-white"
              >
                {showCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Codes
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Generate Premium Codes</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Number of codes</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={codeCount}
                        onChange={(e) => setCodeCount(Number.parseInt(e.target.value) || 1)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Expiry (days)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(Number.parseInt(e.target.value) || 30)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <Button onClick={generatePremiumCodes} className="w-full bg-purple-600 hover:bg-purple-700">
                      Generate {codeCount} Code{codeCount > 1 ? "s" : ""}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {premiumCodes.slice(0, 10).map((code) => (
              <div key={code.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${code.is_used ? "bg-red-500" : "bg-green-500"}`} />
                  <div>
                    <p className="font-mono text-white">{showCodes ? code.code : "••••-••••-••••"}</p>
                    <p className="text-sm text-gray-400">
                      {code.is_used
                        ? `Used ${new Date(code.used_at!).toLocaleDateString()}`
                        : `Created ${new Date(code.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={code.is_used ? "destructive" : "default"}>
                    {code.is_used ? "Used" : "Available"}
                  </Badge>
                  {!code.is_used && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyCode(code.code)}
                        className="text-gray-400 hover:text-white h-8 w-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCode(code.id)}
                        className="text-gray-400 hover:text-red-400 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">User Management</CardTitle>
          <CardDescription className="text-gray-400">Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.slice(0, 10).map((userData) => (
              <div key={userData.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${userData.status === "online" ? "bg-green-500" : "bg-gray-500"}`}
                  />
                  <div>
                    <p className="font-medium text-white">{userData.display_name}</p>
                    <p className="text-sm text-gray-400">{userData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={userData.role} onValueChange={(value) => updateUserRole(userData.id, value)}>
                    <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge
                    variant={
                      userData.role === "admin" ? "destructive" : userData.role === "premium" ? "default" : "secondary"
                    }
                    className={
                      userData.role === "admin"
                        ? "bg-red-900/50 text-red-300 border-red-800"
                        : userData.role === "premium"
                          ? "bg-yellow-900/50 text-yellow-300 border-yellow-800"
                          : "bg-gray-700 text-gray-300"
                    }
                  >
                    {userData.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
