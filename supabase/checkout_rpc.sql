-- Function to confirm order payment and grant access
-- This function should be called after a successful payment
-- It updates the order status and creates a record in product_access
-- SECURITY DEFINER allows it to be called by authenticated/anon users even if they don't have direct update/insert permissions

CREATE OR REPLACE FUNCTION public.confirm_order_payment(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Get order details
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Update order status
  UPDATE public.orders
  SET status = 'approved',
      updated_at = now()
  WHERE id = p_order_id;

  -- Grant access
  INSERT INTO public.product_access (customer_id, product_id, order_id)
  VALUES (v_order.customer_id, v_order.product_id, v_order.id)
  ON CONFLICT (customer_id, product_id) DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
