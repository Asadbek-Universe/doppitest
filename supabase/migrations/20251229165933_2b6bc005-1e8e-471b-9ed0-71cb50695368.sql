-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'center', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create educational_centers table
CREATE TABLE public.educational_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on educational_centers
ALTER TABLE public.educational_centers ENABLE ROW LEVEL SECURITY;

-- RLS policies for educational_centers
CREATE POLICY "Centers are viewable by everyone"
ON public.educational_centers
FOR SELECT
USING (true);

CREATE POLICY "Center owners can update their center"
ON public.educational_centers
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all centers"
ON public.educational_centers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Center role users can insert centers"
ON public.educational_centers
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'center') OR public.has_role(auth.uid(), 'admin'));

-- Add center_id to courses table
ALTER TABLE public.courses ADD COLUMN center_id UUID REFERENCES public.educational_centers(id) ON DELETE SET NULL;

-- Create policy for centers to manage their own courses
CREATE POLICY "Centers can insert their own courses"
ON public.courses
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  (public.has_role(auth.uid(), 'center') AND center_id IN (
    SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()
  ))
);

CREATE POLICY "Centers can update their own courses"
ON public.courses
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  (public.has_role(auth.uid(), 'center') AND center_id IN (
    SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()
  ))
);

CREATE POLICY "Centers can delete their own courses"
ON public.courses
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  (public.has_role(auth.uid(), 'center') AND center_id IN (
    SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()
  ))
);

-- Add center_id to tests table
ALTER TABLE public.tests ADD COLUMN center_id UUID REFERENCES public.educational_centers(id) ON DELETE SET NULL;

-- Create policies for tests management by centers
CREATE POLICY "Centers can insert their own tests"
ON public.tests
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  (public.has_role(auth.uid(), 'center') AND center_id IN (
    SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()
  ))
);

CREATE POLICY "Centers can update their own tests"
ON public.tests
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  (public.has_role(auth.uid(), 'center') AND center_id IN (
    SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()
  ))
);

CREATE POLICY "Centers can delete their own tests"
ON public.tests
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  (public.has_role(auth.uid(), 'center') AND center_id IN (
    SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()
  ))
);