export type Language = 'th' | 'en' | 'zh'

export type CoinStatus = 'available' | 'reserved' | 'sold'

export type UserRole = 'buyer' | 'seller' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  country?: string
  phone?: string
  line_id?: string
  wechat_id?: string
  verified_seller: boolean
  avatar_url?: string
  created_at: string
}

export interface Coin {
  id: string
  title_th: string
  title_en: string
  title_zh: string
  monk_name_th: string
  monk_name_en: string
  temple_th: string
  temple_en: string
  province?: string
  year_th: number   // พ.ศ.
  year_ce: number   // ค.ศ.
  material_th: string
  material_en: string
  size_mm?: number
  weight_gram?: number
  condition: 1 | 2 | 3 | 4 | 5
  price_thb: number
  images: string[]
  is_authenticated: boolean
  authenticated_by?: string
  status: CoinStatus
  seller_id: string
  seller?: User
  certificate?: Certificate
  description_th?: string
  description_en?: string
  view_count: number
  created_at: string
}

export interface Certificate {
  id: string
  coin_id: string
  expert_name: string
  expert_id: string
  notes?: string
  issued_at: string
  certificate_image_url?: string
}

export interface Order {
  id: string
  buyer_id: string
  coin_id: string
  seller_id: string
  amount_thb: number
  shipping_fee_thb: number
  escrow_fee_thb: number
  total_thb: number
  payment_status: 'pending' | 'paid' | 'released' | 'refunded'
  shipping_status: 'pending' | 'packed' | 'shipped' | 'delivered'
  tracking_number?: string
  shipping_address: ShippingAddress
  stripe_payment_id?: string
  coin?: Coin
  buyer?: User
  seller?: User
  created_at: string
}

export interface ShippingAddress {
  name: string
  address: string
  city: string
  country: string
  postal_code: string
  phone: string
}

export interface PriceHistory {
  id: string
  coin_type: string
  price_thb: number
  recorded_at: string
}
