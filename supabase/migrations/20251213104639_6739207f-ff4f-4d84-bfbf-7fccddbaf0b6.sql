-- Create venue_layouts table for flexible seating configurations
CREATE TABLE public.venue_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  rows_config JSONB NOT NULL DEFAULT '[]', -- Array of {label: "A", seats: 10, curve_offset: 0}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seats table
CREATE TABLE public.seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  layout_id UUID REFERENCES public.venue_layouts(id) ON DELETE SET NULL,
  row_label TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  tier_id UUID REFERENCES public.ticket_tiers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(show_id, row_label, seat_number)
);

-- Add qr_code and checked_in fields to orders table
ALTER TABLE public.orders 
ADD COLUMN qr_code TEXT,
ADD COLUMN checked_in BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN seat_ids UUID[] DEFAULT '{}';

-- Enable RLS on venue_layouts
ALTER TABLE public.venue_layouts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on seats
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

-- Venue layouts policies
CREATE POLICY "Anyone can view venue layouts"
ON public.venue_layouts FOR SELECT
USING (true);

CREATE POLICY "Admins can insert venue layouts"
ON public.venue_layouts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update venue layouts"
ON public.venue_layouts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete venue layouts"
ON public.venue_layouts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seats policies
CREATE POLICY "Anyone can view seats"
ON public.seats FOR SELECT
USING (true);

CREATE POLICY "Admins can insert seats"
ON public.seats FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update seats"
ON public.seats FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete seats"
ON public.seats FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can update seats when purchasing (via order creation)
CREATE POLICY "Users can reserve seats during purchase"
ON public.seats FOR UPDATE
USING (auth.uid() IS NOT NULL AND status = 'available');

-- Create trigger for venue_layouts updated_at
CREATE TRIGGER update_venue_layouts_updated_at
BEFORE UPDATE ON public.venue_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for seats table
ALTER PUBLICATION supabase_realtime ADD TABLE public.seats;