"use client"

import { useState } from "react"
import { Crown, Gift, Check, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "./auth/auth-provider"
import { supabase } from "@/lib/supabase"

const premiumFeatures = [
  "Unlimited cloud storage",
  "Advanced AI features",
  "Priority video calling",
  "Custom themes",
  "Advanced analytics",
  "Priority support",
  "Team collaboration tools",
  "API access",
]

export function PremiumRedeem() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [redeemCode, setRedeemCode] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRedeemCode = async () => {
    if (!redeemCode.trim() || !user) return

    setLoading(true)

    try {
      // Check if code exists and is valid
      const { data: codeData, error: codeError } = await supabase
        .from("premium_codes")
        .select("*")
        .eq("code", redeemCode.trim().toUpperCase())
        .eq("is_used", false)
        .single()

      if (codeError || !codeData) {
        toast({
          title: "Invalid Code",
          description: "The premium code you entered is invalid or has already been used.",
          variant: "destructive",
        })
        return
      }

      // Mark code as used
      const { error: updateError } = await supabase
        .from("premium_codes")
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date().toISOString(),
        })
        .eq("id", codeData.id)

      if (updateError) throw updateError

      // Update user role to premium
      const { error: userError } = await supabase.from("users").update({ role: "premium" }).eq("id", user.id)

      if (userError) throw userError

      toast({
        title: "Premium Activated!",
        description: "Your premium subscription has been activated successfully.",
      })

      setRedeemCode("")

      // Refresh the page to update user role
      window.location.reload()
    } catch (error) {
      console.error("Error redeeming code:", error)
      toast({
        title: "Redemption Failed",
        description: "Failed to redeem premium code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Premium Status */}
      <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Crown className="h-5 w-5 text-yellow-500" />
            Premium Status
          </CardTitle>
          <CardDescription className="text-gray-400">
            {user?.role === "premium"
              ? "You have premium access to all features"
              : "Upgrade to premium for unlimited access"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  user?.role === "premium" ? "bg-gradient-to-r from-yellow-600 to-orange-600" : "bg-gray-700"
                }`}
              >
                <Crown className={`h-6 w-6 ${user?.role === "premium" ? "text-white" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="font-semibold text-white">{user?.role === "premium" ? "Premium Member" : "Free Plan"}</p>
                <p className="text-sm text-gray-400">
                  {user?.role === "premium" ? "All premium features unlocked" : "Limited features available"}
                </p>
              </div>
            </div>
            <Badge
              variant={user?.role === "premium" ? "default" : "secondary"}
              className={
                user?.role === "premium"
                  ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-0"
                  : "bg-gray-700 text-gray-300"
              }
            >
              {user?.role === "premium" ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Redeem Code */}
      {user?.role !== "premium" && (
        <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Gift className="h-5 w-5 text-purple-500" />
              Redeem Premium Code
            </CardTitle>
            <CardDescription className="text-gray-400">Enter your premium code to unlock all features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter premium code..."
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-700 text-white"
                disabled={loading}
              />
              <Button
                onClick={handleRedeemCode}
                disabled={!redeemCode.trim() || loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? "Redeeming..." : "Redeem"}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Premium codes are case-insensitive and can be obtained from administrators.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Premium Features */}
      <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Premium Features
          </CardTitle>
          <CardDescription className="text-gray-400">Everything included with premium access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    user?.role === "premium" ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  {user?.role === "premium" ? (
                    <Check className="h-3 w-3 text-white" />
                  ) : (
                    <X className="h-3 w-3 text-gray-400" />
                  )}
                </div>
                <span className={`text-sm ${user?.role === "premium" ? "text-white" : "text-gray-400"}`}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-xl border-purple-800/50">
        <CardContent className="p-6">
          <div className="text-center">
            <Crown className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {user?.role === "premium" ? "Welcome to Premium!" : "Upgrade to Premium"}
            </h3>
            <p className="text-gray-400 mb-4">
              {user?.role === "premium"
                ? "You now have access to all premium features and unlimited usage."
                : "Get unlimited access to all features, priority support, and advanced tools."}
            </p>
            {user?.role !== "premium" && (
              <p className="text-sm text-gray-500">Contact an administrator to get your premium code.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
