
-- Create storage bucket for project attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-attachments', 'project-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for project-attachments bucket
CREATE POLICY "Authenticated users can upload project attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-attachments');

CREATE POLICY "Authenticated users can read project attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-attachments');

CREATE POLICY "Authenticated users can delete own project attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-attachments');
