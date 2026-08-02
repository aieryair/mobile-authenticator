export type OrderStatus = 'paid' | 'shipping' | 'completed' | 'cancelled';

export interface OrderItem {
  card_name: string;
  set_code: string;
  foil: boolean;
  condition: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;
  contact_phone: string;
  notes: string | null;
  courier_label: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  item_count: number;
  items: OrderItem[];
}
