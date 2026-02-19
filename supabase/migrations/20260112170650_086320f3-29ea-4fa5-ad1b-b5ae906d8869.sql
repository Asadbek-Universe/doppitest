-- Fix function search path
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.certificate_number := 'CERT-' || EXTRACT(YEAR FROM NOW()) || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;