-- Create waitlist table for sold-out shows
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, show_id)
);

-- Enable RLS on waitlist
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Waitlist RLS policies
CREATE POLICY "Users can view their own waitlist entries"
ON public.waitlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add themselves to waitlist"
ON public.waitlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves from waitlist"
ON public.waitlist FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all waitlist entries"
ON public.waitlist FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update waitlist entries"
ON public.waitlist FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
  min_purchase_amount NUMERIC DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Promo codes RLS policies
CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();