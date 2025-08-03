"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Clock, Users, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./auth/auth-provider"
import { supabase } from "@/lib/supabase"

interface InviteData {
  id: string
  workspace_id: string
  created_by: string
  expires_at: string
  max_uses: number
  uses_count: number
  allow_guests: boolean
  require_approval: boolean
  channels: string[]
  message: string
  active: boolean
  creator: {
    display_name: string
    email: string
    avatar_url?: string
  }
  workspace: {
    name: string
    description?: string
  }
}

interface InviteHandlerProps {
  inviteId: string
}

export function InviteHandler({ inviteId }: InviteHandlerProps) {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvite()
  }, [inviteId])

  const loadInvite = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("invites")
        .select(`
          *,
          creator:users!created_by(display_name, email, avatar_url),
          workspace:workspaces(name, description)
        `)
        .eq("id", inviteId)
        .single()

      if (error) throw error

      // Check if invite is valid
      if (!data.active) {
        setError("This invite has been revoked")
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("This invite has expired")
        return
      }

      if (data.uses_count >= data.max_uses) {
        setError("This invite has reached its maximum number of uses")
        return
      }

      setInvite(data)
    } catch (error) {
      console.error("Error loading invite:", error)
      setError("Invalid or expired invite link")
    } finally {
      setLoading(false)
    }
  }

  const acceptInvite = async () => {
    if (!invite || !user) return

    try {
      setJoining(true)

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", invite.workspace_id)
        .eq("user_id", user.id)
        .single()

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You're already a member of this workspace",
        })
        router.push("/")
        return
      }

      // Add user to workspace
      const { error: memberError } = await supabase.from("workspace_members").insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: "member",
        permissions: ["read", "write"],
      })

      if (memberError) throw memberError

      // Increment invite usage count
      const { error: updateError } = await supabase
        .from("invites")
        .update({ uses_count: invite.uses_count + 1 })
        .eq("id", invite.id)

      if (updateError) throw updateError

      toast({
        title: "Welcome to the team!",
        description: `You've successfully joined ${invite.workspace.name}`,
      })

      router.push("/")
    } catch (error) {
      console.error("Error accepting invite:", error)
      toast({
        title: "Failed to join",
        description: "There was an error joining the workspace. Please try again.",
        variant: "destructive",
      })
    } finally {
      setJoining(false)
    }
  }

  const declineInvite = () => {
    toast({
      title: "Invite declined",
      description: "You have declined the invitation",
    })
    router.push("/")
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="p-8 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invite</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push("/")} className="rounded-2xl">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="p-8 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invite Not Found</h2>
            <p className="text-muted-foreground mb-6">This invite link is invalid or has been removed.</p>
            <Button onClick={() => router.push("/")} className="rounded-2xl">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
            <p className="text-muted-foreground mb-6">You need to sign in to accept this invitation.</p>
            <div className="space-y-2">
              <Button onClick={() => router.push("/login")} className="w-full rounded-2xl">
                Sign In
              </Button>
              <Button
                onClick={() => router.push("/signup")}
                variant="outline"
                className="w-full rounded-2xl bg-transparent"
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-3xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>Join {invite.workspace.name} and start collaborating</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Workspace Info */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{invite.workspace.name}</h3>
            {invite.workspace.description && (
              <p className="text-sm text-muted-foreground">{invite.workspace.description}</p>
            )}
          </div>

          {/* Inviter Info */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl">
            <Avatar className="h-10 w-10">
              <AvatarImage src={invite.creator.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {invite.creator.display_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{invite.creator.display_name}</p>
              <p className="text-sm text-muted-foreground">invited you to join</p>
            </div>
          </div>

          {/* Personal Message */}
          {invite.message && (
            <div className="p-4 bg-primary/5 rounded-2xl">
              <p className="text-sm italic">"{invite.message}"</p>
            </div>
          )}

          {/* Invite Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expires</span>
              <Badge variant="outline" className="rounded-xl">
                <Clock className="mr-1 h-3 w-3" />
                {new Date(invite.expires_at).toLocaleDateString()}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uses</span>
              <Badge variant="outline" className="rounded-xl">
                {invite.uses_count} / {invite.max_uses}
              </Badge>
            </div>

            {invite.channels.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">You'll have access to:</span>
                <div className="flex flex-wrap gap-1">
                  {invite.channels.map((channel) => (
                    <Badge key={channel} variant="secondary" className="rounded-xl text-xs">
                      #{channel}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={acceptInvite} disabled={joining} className="flex-1 rounded-2xl">
              {joining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Invite
                </>
              )}
            </Button>
            <Button onClick={declineInvite} variant="outline" className="rounded-2xl bg-transparent">
              Decline
            </Button>
          </div>

          {invite.require_approval && (
            <p className="text-xs text-muted-foreground text-center">
              Your request will need to be approved by a workspace admin
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
