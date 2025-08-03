"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bell,
  X,
  MapPin,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Cloud,
  MessageSquare,
  Video,
  Bot,
  Crown,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "./auth/auth-provider"
import { CloudStorage } from "./cloud-storage"
import { TeamChat } from "./team-chat"
import { VideoCall } from "./video-call"
import { AIChat } from "./ai-chat"
import { PremiumRedeem } from "./premium-redeem"

interface Task {
  id: string
  title: string
  time: string
  color: "purple" | "orange" | "green" | "blue" | "pink"
  completed: boolean
}

interface NewsItem {
  id: string
  title: string
  description: string
  image: string
  source: string
  time: string
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: "event" | "meeting" | "reminder"
}

interface WeatherData {
  temperature: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  icon: string
}

interface UserPreferences {
  city: string
  timezone: string
  temperatureUnit: "celsius" | "fahrenheit"
  performanceMode: boolean
}

interface SpotifyTrack {
  id: string
  name: string
  artist: string
  album: string
  duration: number
  currentTime: number
  isPlaying: boolean
  albumArt: string
}

export function PersonalDashboard() {
  const { user } = useAuth()
  
  // Create demo user if no user is available
  const demoUser = {
    id: "demo-user",
    email: "demo@example.com",
    display_name: "Demo User",
    avatar_url: "/placeholder-user.jpg",
    status: "online" as const,
    role: "premium" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  const currentUser = user || demoUser
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 22,
    condition: "Sunny",
    description: "Clear skies with gentle breeze",
    humidity: 65,
    windSpeed: 8,
    icon: "☀️",
  })

  const [preferences, setPreferences] = useState<UserPreferences>({
    city: "San Francisco",
    timezone: "America/Los_Angeles",
    temperatureUnit: "celsius",
    performanceMode: false,
  })

  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack>({
    id: "1",
    name: "Lofi Hip Hop Radio",
    artist: "ChilledCow",
    album: "Study Beats",
    duration: 180,
    currentTime: 45,
    isPlaying: false,
    albumArt: "/placeholder.svg?height=60&width=60",
  })

  const [volume, setVolume] = useState([75])

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Morning meditation",
      time: "08:00 - 08:30",
      color: "purple",
      completed: false,
    },
    {
      id: "2",
      title: "Read a chapter",
      time: "09:00 - 09:30",
      color: "green",
      completed: false,
    },
    {
      id: "3",
      title: "Creative writing",
      time: "14:00 - 15:00",
      color: "pink",
      completed: false,
    },
    {
      id: "4",
      title: "Evening walk",
      time: "18:00 - 19:00",
      color: "blue",
      completed: false,
    },
  ])

  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([
    {
      id: "5",
      title: "Yoga session",
      time: "07:00 - 08:00",
      color: "purple",
      completed: false,
    },
    {
      id: "6",
      title: "Art workshop",
      time: "10:00 - 12:00",
      color: "orange",
      completed: false,
    },
  ])

  const [newsItems] = useState<NewsItem[]>([
    {
      id: "1",
      title: "New mindfulness techniques discovered",
      description: "Scientists find new ways to improve mental wellbeing through simple daily practices.",
      image: "/placeholder.svg?height=80&width=120",
      source: "Wellness Today",
      time: "2h ago",
    },
    {
      id: "2",
      title: "Art therapy shows promising results",
      description: "Creative expression helps people process emotions and reduce stress levels.",
      image: "/placeholder.svg?height=80&width=120",
      source: "Health Journal",
      time: "4h ago",
    },
  ])

  const [events] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Sunset photography session",
      date: "Today",
      time: "17:30",
      type: "event",
    },
    {
      id: "2",
      title: "Book club meeting",
      date: "Tomorrow",
      time: "15:00",
      type: "meeting",
    },
  ])

  // Update time based on user's timezone
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const userTime = new Date(now.toLocaleString("en-US", { timeZone: preferences.timezone }))
      setCurrentTime(userTime)
    }, 1000)
    return () => clearInterval(timer)
  }, [preferences.timezone])

  // Fetch weather data when city changes
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const weatherConditions = [
          { condition: "Sunny", icon: "☀️", temp: 25 },
          { condition: "Cloudy", icon: "☁️", temp: 20 },
          { condition: "Rainy", icon: "🌧️", temp: 18 },
          { condition: "Partly Cloudy", icon: "⛅", temp: 22 },
        ]

        const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]

        setWeather({
          temperature:
            preferences.temperatureUnit === "celsius"
              ? randomWeather.temp
              : Math.round((randomWeather.temp * 9) / 5 + 32),
          condition: randomWeather.condition,
          description: `Beautiful ${randomWeather.condition.toLowerCase()} day in ${preferences.city}`,
          humidity: Math.floor(Math.random() * 40) + 40,
          windSpeed: Math.floor(Math.random() * 15) + 5,
          icon: randomWeather.icon,
        })
      } catch (error) {
        console.error("Failed to fetch weather:", error)
      }
    }

    fetchWeather()
  }, [preferences.city, preferences.temperatureUnit])

  // Spotify player simulation
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentTrack.isPlaying) {
      interval = setInterval(() => {
        setCurrentTrack((prev) => ({
          ...prev,
          currentTime: prev.currentTime >= prev.duration ? 0 : prev.currentTime + 1,
        }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentTrack.isPlaying])

  const getTaskColor = useCallback((color: string) => {
    switch (color) {
      case "purple":
        return "bg-gradient-to-r from-purple-600 to-purple-700"
      case "orange":
        return "bg-gradient-to-r from-orange-600 to-orange-700"
      case "green":
        return "bg-gradient-to-r from-emerald-600 to-emerald-700"
      case "blue":
        return "bg-gradient-to-r from-blue-600 to-blue-700"
      case "pink":
        return "bg-gradient-to-r from-pink-600 to-pink-700"
      default:
        return "bg-gradient-to-r from-gray-600 to-gray-700"
    }
  }, [])

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }, [])

  const getGreeting = useMemo(() => {
    const hour = currentTime.getHours()
    const name = currentUser?.display_name || "Friend"

    if (hour < 6) return `Good night, ${name} 🌙`
    if (hour < 12) return `Good morning, ${name} 🌅`
    if (hour < 17) return `Good afternoon, ${name} ☀️`
    if (hour < 21) return `Good evening, ${name} 🌆`
    return `Good night, ${name} 🌙`
  }, [currentTime, currentUser?.display_name])

  const getCurrentDate = useMemo(() => {
    const day = currentTime.getDate()
    const dayName = currentTime.toLocaleDateString("en-US", { weekday: "long" })
    const month = currentTime.toLocaleDateString("en-US", { month: "long" })

    const suffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
          ? "nd"
          : day === 3 || day === 23
            ? "rd"
            : "th"

    return `${dayName}, ${month} ${day}${suffix}`
  }, [currentTime])

  const generateCalendarDays = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }, [selectedDate])

  const toggleTask = useCallback((taskId: string, isToday = true) => {
    if (isToday) {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
    } else {
      setTomorrowTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
      )
    }
  }, [])

  const togglePlayPause = useCallback(() => {
    setCurrentTrack((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
  }, [])

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  const savePreferences = useCallback(() => {
    setShowSettings(false)
  }, [])

  const renderTabContent = () => {
    switch (activeTab) {
      case "cloud":
        return <CloudStorage />
      case "chat":
        return <TeamChat />
      case "video":
        return <VideoCall />
      case "ai":
        return <AIChat />
      case "premium":
        return <PremiumRedeem />
      default:
        return renderDashboard()
    }
  }

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
      {/* Left Column - Tasks */}
      <div className="md:col-span-1 lg:col-span-3 space-y-4 lg:space-y-6">
        {/* Current Time & Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 text-white border border-gray-800"
        >
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-light mb-2 text-gray-100">{formatTime(currentTime)}</div>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm sm:text-base">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{preferences.city}</span>
            </div>
          </div>
        </motion.div>

        {/* Task Notification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-900/30 backdrop-blur-xl rounded-3xl p-4 flex items-center gap-3 border border-emerald-800/50"
        >
          <Bell className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-gray-100">
              You have {tasks.filter((t) => !t.completed).length} tasks pending
            </p>
            <p className="text-xs text-gray-400">for today's productivity.</p>
          </div>
        </motion.div>

        {/* Today's Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="font-semibold text-gray-100">Today's Tasks</h3>
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`${getTaskColor(task.color)} rounded-3xl p-4 text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  task.completed ? "opacity-60" : ""
                }`}
                onClick={() => toggleTask(task.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? "line-through" : ""}`}>{task.title}</p>
                    <p className="text-sm opacity-80">{task.time}</p>
                  </div>
                  {task.completed && <X className="h-4 w-4" />}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Add Task Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-3xl py-6 text-white font-medium border-0 shadow-lg">
            <Plus className="mr-2 h-5 w-5" />
            Add Task
          </Button>
        </motion.div>
      </div>

      {/* Center Column - Weather & Music */}
      <div className="md:col-span-1 lg:col-span-6 space-y-4 lg:space-y-6">
        {/* Weather Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 text-white relative overflow-hidden border border-gray-800"
        >
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-light mb-2 text-gray-100">{preferences.city}</h2>
                <p className="text-gray-400 text-sm sm:text-base">{weather.description}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl sm:text-5xl font-light mb-2 text-gray-100">
                  {weather.temperature}°{preferences.temperatureUnit === "celsius" ? "C" : "F"}
                </div>
                <p className="text-gray-400 text-sm sm:text-base">{weather.condition}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-2xl p-4">
                <p className="text-gray-400 text-sm">Humidity</p>
                <p className="text-xl font-medium text-gray-100">{weather.humidity}%</p>
              </div>
              <div className="bg-gray-800/50 rounded-2xl p-4">
                <p className="text-gray-400 text-sm">Wind</p>
                <p className="text-xl font-medium text-gray-100">{weather.windSpeed} km/h</p>
              </div>
            </div>
          </div>

          <div className="absolute top-6 right-6">
            <div className="text-6xl opacity-60">{weather.icon}</div>
          </div>
        </motion.div>

        {/* Spotify Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/60 backdrop-blur-xl rounded-3xl p-6 text-white border border-gray-800"
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <img
              src={currentTrack.albumArt || "/placeholder.svg?height=64&width=64"}
              alt="Album Art"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg text-gray-100 truncate">{currentTrack.name}</h3>
              <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
              <p className="text-gray-500 text-xs sm:text-sm truncate">{currentTrack.album}</p>
            </div>
            <Music className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 flex-shrink-0" />
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{formatDuration(currentTrack.currentTime)}</span>
              <span>{formatDuration(currentTrack.duration)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div
                className="bg-gradient-to-r from-green-400 to-blue-500 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${(currentTrack.currentTime / currentTrack.duration) * 100}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-800 rounded-full w-12 h-12"
              onClick={togglePlayPause}
            >
              {currentTrack.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-gray-400" />
            <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1" />
            <span className="text-sm text-gray-400 w-8">{volume[0]}</span>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Calendar */}
      <div className="md:col-span-2 lg:col-span-3 space-y-4 lg:space-y-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-800"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-100">
              {selectedDate.toLocaleDateString("en-US", { month: "long" })}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
              <div key={day} className="text-xs text-gray-500 p-2 font-medium">
                {day}
              </div>
            ))}

            {generateCalendarDays.map((day, index) => (
              <div
                key={index}
                className={`p-2 text-sm rounded-lg cursor-pointer transition-colors ${
                  day === null
                    ? ""
                    : day === currentTime.getDate() &&
                        selectedDate.getMonth() === currentTime.getMonth() &&
                        selectedDate.getFullYear() === currentTime.getFullYear()
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold"
                      : "hover:bg-gray-800 text-gray-300"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-800"
        >
          <h3 className="font-semibold text-gray-100 mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-2xl">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-100">{event.title}</p>
                  <p className="text-sm text-gray-400">
                    {event.date} at {event.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black to-gray-900/20" />

      <div className="relative z-10 p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0 mb-6 lg:mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <div className="flex items-center gap-3 bg-gray-900/80 backdrop-blur-xl rounded-3xl px-6 py-3 border border-gray-800">
              <Avatar className="h-12 w-12 border-2 border-gray-700">
                <AvatarImage src={currentUser?.avatar_url || "/placeholder.svg?height=48&width=48"} />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  {currentUser?.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-gray-400 text-sm">{getGreeting}</p>
                <p className="text-white font-semibold">{getCurrentDate}</p>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Premium Badge */}
            {currentUser?.role === "premium" && (
              <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-0">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
            
            {/* Demo Mode Badge */}
            {!user && (
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                Demo Mode
              </Badge>
            )}

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl bg-gray-900/80 backdrop-blur-xl text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Dashboard Preferences</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-gray-300">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={preferences.city}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter your city"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-gray-300">
                      Timezone
                    </Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => setPreferences((prev) => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={savePreferences} className="w-full bg-purple-600 hover:bg-purple-700">
                    Save Preferences
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-wrap items-center gap-2 bg-gray-900/80 backdrop-blur-xl rounded-2xl p-2 border border-gray-800 w-full lg:w-fit overflow-x-auto">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              onClick={() => setActiveTab("dashboard")}
              className={`rounded-xl ${activeTab === "dashboard" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Dashboard
            </Button>
            <Button
              variant={activeTab === "cloud" ? "default" : "ghost"}
              onClick={() => setActiveTab("cloud")}
              className={`rounded-xl ${activeTab === "cloud" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Cloud className="h-4 w-4 mr-2" />
              Cloud Storage
            </Button>
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              onClick={() => setActiveTab("chat")}
              className={`rounded-xl ${activeTab === "chat" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button
              variant={activeTab === "video" ? "default" : "ghost"}
              onClick={() => setActiveTab("video")}
              className={`rounded-xl ${activeTab === "video" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Video className="h-4 w-4 mr-2" />
              Video Call
            </Button>
            <Button
              variant={activeTab === "ai" ? "default" : "ghost"}
              onClick={() => setActiveTab("ai")}
              className={`rounded-xl ${activeTab === "ai" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
            <Button
              variant={activeTab === "premium" ? "default" : "ghost"}
              onClick={() => setActiveTab("premium")}
              className={`rounded-xl ${activeTab === "premium" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Crown className="h-4 w-4 mr-2" />
              Premium
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  )
}
