-- Create olympiad_certificates table for storing user achievements from olympiads
CREATE TABLE public.olympiad_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  olympiad_id UUID NOT NULL REFERENCES public.olympiads(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL DEFAULT 'participation', -- 'gold', 'silver', 'bronze', 'participation'
  rank INTEGER,
  score INTEGER,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certificate_number TEXT UNIQUE,
  UNIQUE(user_id, olympiad_id)
);

-- Enable Row Level Security
ALTER TABLE public.olympiad_certificates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own certificates" 
ON public.olympiad_certificates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Certificates are publicly viewable"
ON public.olympiad_certificates
FOR SELECT
USING (true);

CREATE POLICY "Centers can issue certificates for their olympiads" 
ON public.olympiad_certificates 
FOR INSERT 
WITH CHECK (
  olympiad_id IN (
    SELECT o.id FROM olympiads o
    WHERE o.center_id IN (
      SELECT ec.id FROM educational_centers ec
      WHERE ec.owner_id = auth.uid()
    )
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Centers can update certificates for their olympiads" 
ON public.olympiad_certificates 
FOR UPDATE 
USING (
  olympiad_id IN (
    SELECT o.id FROM olympiads o
    WHERE o.center_id IN (
      SELECT ec.id FROM educational_centers ec
      WHERE ec.owner_id = auth.uid()
    )
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Centers can delete certificates for their olympiads" 
ON public.olympiad_certificates 
FOR DELETE 
USING (
  olympiad_id IN (
    SELECT o.id FROM olympiads o
    WHERE o.center_id IN (
      SELECT ec.id FROM educational_centers ec
      WHERE ec.owner_id = auth.uid()
    )
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create index for faster lookups
CREATE INDEX idx_olympiad_certificates_user_id ON public.olympiad_certificates(user_id);
CREATE INDEX idx_olympiad_certificates_olympiad_id ON public.olympiad_certificates(olympiad_id);

-- Create function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.certificate_number := 'CERT-' || EXTRACT(YEAR FROM NOW()) || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic certificate number generation
CREATE TRIGGER set_certificate_number
BEFORE INSERT ON public.olympiad_certificates
FOR EACH ROW
EXECUTE FUNCTION generate_certificate_number();