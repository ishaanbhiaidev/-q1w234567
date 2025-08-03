-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    permissions TEXT[] DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'voice', 'video')),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'ai')),
    file_url TEXT,
    file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    shared BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    due_date TIMESTAMP WITH TIME ZONE,
    color VARCHAR(20) DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_workspace_id ON channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_files_workspace_id ON files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for workspaces table
CREATE POLICY "Users can view workspaces they are members of" ON workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = workspaces.id 
            AND user_id = auth.uid()
        )
    );

-- RLS Policies for workspace_members table
CREATE POLICY "Users can view workspace members of their workspaces" ON workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm 
            WHERE wm.workspace_id = workspace_members.workspace_id 
            AND wm.user_id = auth.uid()
        )
    );

-- RLS Policies for channels table
CREATE POLICY "Users can view channels in their workspaces" ON channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = channels.workspace_id 
            AND user_id = auth.uid()
        )
    );

-- RLS Policies for messages table
CREATE POLICY "Users can view messages in channels they have access to" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM channels c
            JOIN workspace_members wm ON c.workspace_id = wm.workspace_id
            WHERE c.id = messages.channel_id 
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in channels they have access to" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM channels c
            JOIN workspace_members wm ON c.workspace_id = wm.workspace_id
            WHERE c.id = messages.channel_id 
            AND wm.user_id = auth.uid()
        )
    );

-- RLS Policies for files table
CREATE POLICY "Users can view files in their workspaces" ON files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = files.workspace_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload files to their workspaces" ON files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = files.workspace_id 
            AND user_id = auth.uid()
        )
    );

-- RLS Policies for projects table
CREATE POLICY "Users can view projects in their workspaces" ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = projects.workspace_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create projects in their workspaces" ON projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = projects.workspace_id 
            AND user_id = auth.uid()
        )
    );

-- Function to update user status
CREATE OR REPLACE FUNCTION update_user_status(new_status TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET status = new_status, updated_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
