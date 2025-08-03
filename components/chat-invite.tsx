"use client"

import { useState } from "react"
import { Copy, Mail, MessageSquare, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./auth/auth-provider"
import { supabase } from "@/lib/supabase"

interface InviteSettings {
  expiresIn: string
  maxUses: number
  allowGuests: boolean
  requireApproval: boolean
  channels: string[]
  message: string
}

export function ChatInvite() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<InviteSettings>({
    expiresIn: "7d",
    maxUses: 10,
    allowGuests: true,
    requireApproval: false,
    channels: ["general"],
    message: "Join our workspace to collaborate and chat!",
  })

  const generateInviteLink = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Create invite record in database
      const inviteData = {
        created_by: user.id,
        workspace_id: "default", // You can modify this based on your workspace logic
        expires_at: new Date(Date.now() + Number.parseInt(settings.expiresIn.replace("d", "")) * 24 * 60 * 60 * 1000),
        max_uses: settings.maxUses,
        allow_guests: settings.allowGuests,
        require_approval: settings.requireApproval,
        channels: settings.channels,
        message: settings.message,
        uses_count: 0,
        active: true,
      }

      const { data, error } = await supabase.from("invites").insert(inviteData).select().single()

      if (error) throw error

      const link = `${window.location.origin}/invite/${data.id}`
      setInviteLink(link)

      toast({
        title: "Invite Link Generated",
        description: "Your invite link has been created successfully",
      })
    } catch (error) {
      console.error("Error generating invite:", error)
      toast({
        title: "Error",
        description: "Failed to generate invite link",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendEmailInvite = async () => {
    if (!email || !user) return

    try {
      setLoading(true)

      // Generate invite link if not exists
      let linkToSend = inviteLink
      if (!linkToSend) {
        await generateInviteLink()
        linkToSend = inviteLink
      }

      // In a real app, you would send this via your email service
      // For now, we'll just copy to clipboard and show a message
      const emailContent = `
Hi there!

${user.display_name} has invited you to join our workspace.

${settings.message}

Click here to join: ${linkToSend}

This invite will expire in ${settings.expiresIn.replace("d", " days")}.

Best regards,
The Team
      `.trim()

      await navigator.clipboard.writeText(emailContent)

      toast({
        title: "Email Content Copied",
        description: "Email invitation content has been copied to your clipboard",
      })

      setEmail("")
    } catch (error) {
      console.error("Error sending email invite:", error)
      toast({
        title: "Error",
        description: "Failed to prepare email invitation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async () => {
    if (!inviteLink) return

    try {
      await navigator.clipboard.writeText(inviteLink)
      toast({
        title: "Link Copied",
        description: "Invite link has been copied to your clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const revokeInvite = async () => {
    if (!inviteLink) return

    try {
      const inviteId = inviteLink.split("/").pop()
      const { error } = await supabase.from("invites").update({ active: false }).eq("id", inviteId)

      if (error) throw error

      setInviteLink("")
      toast({
        title: "Invite Revoked",
        description: "The invite link has been deactivated",
      })
    } catch (error) {
      console.error("Error revoking invite:", error)
      toast({
        title: "Error",
        description: "Failed to revoke invite",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Invite */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email Invitation
          </CardTitle>
          <CardDescription>Invite someone directly via email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl"
            />
          </div>

          <Button onClick={sendEmailInvite} disabled={!email || loading} className="w-full rounded-2xl">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Preparing Invite...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Email Invite
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generate Link */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Generate Invite Link
          </CardTitle>
          <CardDescription>Create a shareable link for multiple people</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!inviteLink ? (
            <Button onClick={generateInviteLink} disabled={loading} className="w-full rounded-2xl">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Generate Invite Link
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="rounded-2xl" />
                <Button onClick={copyInviteLink} variant="outline" className="rounded-2xl bg-transparent">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={generateInviteLink} variant="outline" className="flex-1 rounded-2xl bg-transparent">
                  Generate New
                </Button>
                <Button
                  onClick={revokeInvite}
                  variant="outline"
                  className="flex-1 rounded-2xl text-red-500 hover:text-red-700 bg-transparent"
                >
                  <X className="mr-2 h-4 w-4" />
                  Revoke
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Settings */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invite Settings
          </CardTitle>
          <CardDescription>Configure how your invites work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Invitation Message</Label>
            <Textarea
              placeholder="Add a personal message to your invitation..."
              value={settings.message}
              onChange={(e) => setSettings((prev) => ({ ...prev, message: e.target.value }))}
              className="rounded-2xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expires In</Label>
              <Select
                value={settings.expiresIn}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, expiresIn: value }))}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1 day</SelectItem>
                  <SelectItem value="3d">3 days</SelectItem>
                  <SelectItem value="7d">1 week</SelectItem>
                  <SelectItem value="30d">1 month</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={settings.maxUses}
                onChange={(e) => setSettings((prev) => ({ ...prev, maxUses: Number.parseInt(e.target.value) || 1 }))}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Allow Guests</Label>
                <p className="text-xs text-muted-foreground">Let people join without creating an account</p>
              </div>
              <Switch
                checked={settings.allowGuests}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowGuests: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Require Approval</Label>
                <p className="text-xs text-muted-foreground">Manually approve new members</p>
              </div>
              <Switch
                checked={settings.requireApproval}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, requireApproval: checked }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Channels</Label>
            <div className="flex flex-wrap gap-2">
              {["general", "random", "announcements"].map((channel) => (
                <Badge
                  key={channel}
                  variant={settings.channels.includes(channel) ? "default" : "outline"}
                  className="cursor-pointer rounded-xl"
                  onClick={() => {
                    setSettings((prev) => ({
                      ...prev,
                      channels: prev.channels.includes(channel)
                        ? prev.channels.filter((c) => c !== channel)
                        : [...prev.channels, channel],
                    }))
                  }}
                >
                  #{channel}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
