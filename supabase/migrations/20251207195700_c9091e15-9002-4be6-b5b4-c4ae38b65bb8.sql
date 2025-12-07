
-- Create shows table
CREATE TABLE public.shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  location TEXT NOT NULL,
  venue TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  time TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Concert',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_tiers table
CREATE TABLE public.ticket_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('Regular', 'Golden', 'Platinum', 'VIP')),
  price NUMERIC NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  ticket_tier_id UUID NOT NULL REFERENCES public.ticket_tiers(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  reference TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Shows policies (public read, admin write)
CREATE POLICY "Anyone can view shows"
ON public.shows FOR SELECT
USING (true);

CREATE POLICY "Admins can insert shows"
ON public.shows FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shows"
ON public.shows FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete shows"
ON public.shows FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Ticket tiers policies (public read, admin write)
CREATE POLICY "Anyone can view ticket tiers"
ON public.ticket_tiers FOR SELECT
USING (true);

CREATE POLICY "Admins can insert ticket tiers"
ON public.ticket_tiers FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ticket tiers"
ON public.ticket_tiers FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ticket tiers"
ON public.ticket_tiers FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Orders policies
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_shows_updated_at
BEFORE UPDATE ON public.shows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_tiers_updated_at
BEFORE UPDATE ON public.ticket_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
