-- Add promo code tracking to orders
ALTER TABLE public.orders 
ADD COLUMN promo_code_id uuid REFERENCES public.promo_codes(id),
ADD COLUMN discount_amount numeric DEFAULT 0;

-- Create index for promo code usage queries
CREATE INDEX idx_orders_promo_code_id ON public.orders(promo_code_id);

-- Function to increment promo code usage
CREATE OR REPLACE FUNCTION public.increment_promo_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.promo_code_id IS NOT NULL AND NEW.payment_status = 'completed' THEN
    UPDATE public.promo_codes 
    SET current_uses = current_uses + 1 
    WHERE id = NEW.promo_code_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to increment promo code usage when order is completed
CREATE TRIGGER on_order_completed_increment_promo
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
WHEN (NEW.payment_status = 'completed' AND NEW.promo_code_id IS NOT NULL)
EXECUTE FUNCTION public.increment_promo_code_usage();

-- Function to check ticket availability and notify waitlist
CREATE OR REPLACE FUNCTION public.check_ticket_availability_notify()
RETURNS TRIGGER AS $$
DECLARE
  available_count integer;
BEGIN
  -- Calculate available tickets
  available_count := NEW.quantity - NEW.sold;
  
  -- If tickets just became available (was sold out, now has availability)
  IF OLD.quantity - OLD.sold <= 0 AND available_count > 0 THEN
    -- Call edge function via pg_net (will be handled by the application)
    PERFORM pg_notify('waitlist_notify', json_build_object(
      'show_id', NEW.show_id,
      'tier_id', NEW.id,
      'tier_name', NEW.name,
      'available', available_count
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for ticket availability changes
CREATE TRIGGER on_ticket_tier_availability_change
AFTER UPDATE ON public.ticket_tiers
FOR EACH ROW
EXECUTE FUNCTION public.check_ticket_availability_notify();