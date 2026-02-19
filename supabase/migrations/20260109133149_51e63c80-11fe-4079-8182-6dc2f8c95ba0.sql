-- Allow users to delete their own olympiad registrations (to cancel)
CREATE POLICY "Users can cancel their own registrations"
ON public.olympiad_registrations
FOR DELETE
USING (user_id = auth.uid());