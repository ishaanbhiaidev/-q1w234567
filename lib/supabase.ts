import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  status: "online" | "away" | "busy" | "offline"
  role: "member" | "premium" | "admin"
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  content: string
  channel_id: string
  user_id: string
  message_type: "text" | "file" | "system" | "ai"
  file_url?: string
  file_name?: string
  created_at: string
  updated_at: string
  user?: User
}

export interface Channel {
  id: string
  name: string
  type: "text" | "voice" | "video"
  workspace_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: "owner" | "admin" | "member"
  permissions: string[]
  joined_at: string
}

export interface FileRecord {
  id: string
  name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_by: string
  workspace_id: string
  shared: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  workspace_id: string
  created_by: string
  status: "active" | "completed" | "paused"
  progress: number
  due_date?: string
  color: string
  created_at: string
  updated_at: string
}

export interface PremiumCode {
  id: string
  code: string
  is_used: boolean
  used_by?: string
  used_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}
