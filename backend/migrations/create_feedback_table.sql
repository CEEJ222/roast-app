-- Create feedback table for storing user feedback
-- This replaces the ephemeral JSON file storage with persistent database storage

CREATE TABLE IF NOT EXISTS public.feedback (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    feedback_text TEXT NOT NULL,
    feature TEXT NOT NULL DEFAULT 'general_app',
    feedback_type TEXT NOT NULL DEFAULT 'general',
    status TEXT NOT NULL DEFAULT 'new',
    sentiment TEXT DEFAULT 'neutral',
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_feature_idx ON public.feedback(feature);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON public.feedback(status);
CREATE INDEX IF NOT EXISTS feedback_feedback_type_idx ON public.feedback(feedback_type);

-- Add full-text search index on feedback_text
CREATE INDEX IF NOT EXISTS feedback_text_search_idx ON public.feedback USING gin(to_tsvector('english', feedback_text));

-- Enable Row Level Security (RLS)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
    ON public.feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
    ON public.feedback
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
    ON public.feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
        )
    );

-- Policy: Admins can update feedback (e.g., change status)
CREATE POLICY "Admins can update feedback"
    ON public.feedback
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feedback_updated_at_trigger
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_feedback_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.feedback IS 'Stores user feedback submissions for product improvement';
COMMENT ON COLUMN public.feedback.id IS 'Unique identifier for feedback entry';
COMMENT ON COLUMN public.feedback.user_id IS 'Reference to user who submitted feedback';
COMMENT ON COLUMN public.feedback.user_email IS 'Email of user who submitted feedback';
COMMENT ON COLUMN public.feedback.feedback_text IS 'The actual feedback content';
COMMENT ON COLUMN public.feedback.feature IS 'Feature category (ai_copilot, general_app, etc.)';
COMMENT ON COLUMN public.feedback.feedback_type IS 'Type of feedback (general, bug, feature, improvement)';
COMMENT ON COLUMN public.feedback.status IS 'Processing status (new, reviewed, in_progress, resolved)';
COMMENT ON COLUMN public.feedback.sentiment IS 'Sentiment analysis (positive, negative, neutral)';
COMMENT ON COLUMN public.feedback.priority IS 'Priority level (low, medium, high, critical)';


