-- Premium codes table
CREATE TABLE IF NOT EXISTS premium_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by UUID REFERENCES users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_premium_codes_code ON premium_codes(code);
CREATE INDEX IF NOT EXISTS idx_premium_codes_is_used ON premium_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_premium_codes_used_by ON premium_codes(used_by);

-- Update users table to include role column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member';

-- Add index for user roles
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Files table for cloud storage
CREATE TABLE IF NOT EXISTS files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT NOT NULL,
    uploaded_by UUID REFERENCES users(id) NOT NULL,
    workspace_id VARCHAR(50) DEFAULT 'default',
    shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for files table
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_workspace_id ON files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_files_shared ON files(shared);

-- Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS policies for files
CREATE POLICY "Users can view their own files" ON files
    FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Users can insert their own files" ON files
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own files" ON files
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own files" ON files
    FOR DELETE USING (uploaded_by = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_premium_codes_updated_at BEFORE UPDATE ON premium_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user status
CREATE OR REPLACE FUNCTION update_user_status(new_status TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET status = new_status, updated_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample premium codes for testing
INSERT INTO premium_codes (code, expires_at) VALUES 
    ('PREM-2024-ABCD', NOW() + INTERVAL '30 days'),
    ('PREM-2024-EFGH', NOW() + INTERVAL '30 days'),
    ('PREM-2024-IJKL', NOW() + INTERVAL '30 days'),
    ('PREM-2024-MNOP', NOW() + INTERVAL '30 days'),
    ('PREM-2024-QRST', NOW() + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;
