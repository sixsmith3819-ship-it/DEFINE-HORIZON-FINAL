-- ============================================================================
-- ADD COMPATIBILITY FOR ANNOUNCEMENTS MODULE
-- Adds missing 'message' column (maps to 'content')
-- ============================================================================

-- Add message column as an alias to content
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS message TEXT 
GENERATED ALWAYS AS (content) STORED;

-- Add index for message column
CREATE INDEX IF NOT EXISTS idx_announcements_message ON public.announcements(message);

-- Verify the change
SELECT 
  'Announcements Compatibility' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'announcements'
  AND column_name IN ('content', 'message')
ORDER BY column_name;

-- Show sample data
SELECT 
  'Sample Announcement' as check_type,
  title,
  content,
  message,
  status
FROM public.announcements
LIMIT 1;

SELECT 'Announcements module is now compatible!' as result;
