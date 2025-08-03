"use client"

import { useState, useEffect, useRef } from "react"
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "./auth/auth-provider"

interface CallParticipant {
  id: string
  name: string
  avatar?: string
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing: boolean
}

export function VideoCall() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isInCall, setIsInCall] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [participants, setParticipants] = useState<CallParticipant[]>([])
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [localStream])

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setIsInCall(true)

      // Simulate other participants joining
      setTimeout(() => {
        setParticipants([
          {
            id: "1",
            name: "Alice Johnson",
            avatar: "/placeholder.svg?height=40&width=40",
            isVideoEnabled: true,
            isAudioEnabled: true,
            isScreenSharing: false,
          },
          {
            id: "2",
            name: "Bob Smith",
            avatar: "/placeholder.svg?height=40&width=40",
            isVideoEnabled: false,
            isAudioEnabled: true,
            isScreenSharing: false,
          },
        ])
      }, 2000)

      toast({
        title: "Call Started",
        description: "You are now in a video call",
      })
    } catch (error) {
      console.error("Error starting call:", error)
      toast({
        title: "Call Failed",
        description: "Could not access camera/microphone",
        variant: "destructive",
      })
    }
  }

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
      setLocalStream(null)
    }

    setIsInCall(false)
    setParticipants([])

    toast({
      title: "Call Ended",
      description: "You have left the call",
    })
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        // Replace video track with screen share
        if (localStream && localVideoRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0]
          const sender = localStream.getVideoTracks()[0]

          localVideoRef.current.srcObject = screenStream
          setIsScreenSharing(true)

          videoTrack.onended = () => {
            setIsScreenSharing(false)
            // Switch back to camera
            if (localStream && localVideoRef.current) {
              localVideoRef.current.srcObject = localStream
            }
          }
        }
      } else {
        setIsScreenSharing(false)
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }
      }
    } catch (error) {
      console.error("Error toggling screen share:", error)
      toast({
        title: "Screen Share Failed",
        description: "Could not start screen sharing",
        variant: "destructive",
      })
    }
  }

  if (!isInCall) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Video className="h-5 w-5" />
              Video Calling
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Video className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Start a Video Call</h3>
            <p className="text-gray-400 mb-6">Connect with your team through high-quality video calls</p>
            <Button onClick={startCall} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl">
              <Video className="h-5 w-5 mr-2" />
              Start Call
            </Button>
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Team Standup", time: "2 hours ago", duration: "45 min", participants: 5 },
                { name: "Client Meeting", time: "Yesterday", duration: "1h 20min", participants: 3 },
                { name: "Design Review", time: "2 days ago", duration: "30 min", participants: 4 },
              ].map((call, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center">
                      <Video className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{call.name}</p>
                      <p className="text-sm text-gray-400">
                        {call.time} • {call.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                      <Users className="h-3 w-3 mr-1" />
                      {call.participants}
                    </Badge>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white h-8 w-8">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Video Area */}
      <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gray-800 rounded-t-3xl overflow-hidden">
            {/* Main Video */}
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

            {/* Screen Share Indicator */}
            {isScreenSharing && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-600 text-white">
                  <Monitor className="h-3 w-3 mr-1" />
                  Screen Sharing
                </Badge>
              </div>
            )}

            {/* Local Video Overlay */}
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600">
              <video
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute bottom-1 left-1">
                <span className="text-xs text-white bg-black/50 px-1 rounded">You</span>
              </div>
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm rounded-2xl p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAudio}
                  className={`rounded-full w-12 h-12 ${
                    isAudioEnabled
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVideo}
                  className={`rounded-full w-12 h-12 ${
                    isVideoEnabled
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleScreenShare}
                  className={`rounded-full w-12 h-12 ${
                    isScreenSharing
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                >
                  <Monitor className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={endCall}
                  className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700 text-white"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      {participants.length > 0 && (
        <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Participants ({participants.length + 1})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Current User */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {user?.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-white">{user?.display_name} (You)</p>
                    <div className="flex items-center gap-2">
                      {isVideoEnabled ? (
                        <Video className="h-3 w-3 text-green-400" />
                      ) : (
                        <VideoOff className="h-3 w-3 text-red-400" />
                      )}
                      {isAudioEnabled ? (
                        <Mic className="h-3 w-3 text-green-400" />
                      ) : (
                        <MicOff className="h-3 w-3 text-red-400" />
                      )}
                      {isScreenSharing && <Monitor className="h-3 w-3 text-blue-400" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Participants */}
              {participants.map((participant) => (
                <div key={participant.id} className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gray-600 text-white">{participant.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-white">{participant.name}</p>
                      <div className="flex items-center gap-2">
                        {participant.isVideoEnabled ? (
                          <Video className="h-3 w-3 text-green-400" />
                        ) : (
                          <VideoOff className="h-3 w-3 text-red-400" />
                        )}
                        {participant.isAudioEnabled ? (
                          <Mic className="h-3 w-3 text-green-400" />
                        ) : (
                          <MicOff className="h-3 w-3 text-red-400" />
                        )}
                        {participant.isScreenSharing && <Monitor className="h-3 w-3 text-blue-400" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
