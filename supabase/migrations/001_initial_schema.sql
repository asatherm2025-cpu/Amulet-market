-- ============================================================
-- SIAM COIN — Initial Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  country       TEXT,
  phone         TEXT,
  line_id       TEXT,
  wechat_id     TEXT,
  avatar_url    TEXT,
  verified_seller BOOLEAN NOT NULL DEFAULT FALSE,
  rating        NUMERIC(3,2) DEFAULT 0,
  total_sales   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MONKS (เกจิอาจารย์)
-- ============================================================
CREATE TABLE public.monks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_th       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  temple_th     TEXT,
  temple_en     TEXT,
  province      TEXT,
  birth_year    INTEGER,
  death_year    INTEGER,   -- NULL = ยังมีชีวิตอยู่
  bio_th        TEXT,
  bio_en        TEXT,
  image_url     TEXT,
  is_famous     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COINS (เหรียญพระเครื่อง)
-- ============================================================
CREATE TABLE public.coins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_th        TEXT NOT NULL,
  title_en        TEXT NOT NULL,
  title_zh        TEXT,
  monk_id         UUID REFERENCES public.monks(id),
  monk_name_th    TEXT NOT NULL,
  monk_name_en    TEXT NOT NULL,
  temple_th       TEXT NOT NULL,
  temple_en       TEXT NOT NULL,
  province        TEXT,
  year_th         INTEGER NOT NULL,  -- พ.ศ.
  year_ce         INTEGER NOT NULL,  -- ค.ศ.
  material_th     TEXT NOT NULL,     -- เนื้อทองแดง, เนื้อเงิน ...
  material_en     TEXT NOT NULL,
  size_mm         NUMERIC(6,2),
  weight_gram     NUMERIC(6,2),
  condition       INTEGER NOT NULL CHECK (condition BETWEEN 1 AND 5),
  price_thb       NUMERIC(12,2) NOT NULL,
  images          TEXT[] NOT NULL DEFAULT '{}',
  is_authenticated BOOLEAN NOT NULL DEFAULT FALSE,
  authenticated_by UUID REFERENCES public.users(id),
  status          TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'reserved', 'sold')),
  description_th  TEXT,
  description_en  TEXT,
  description_zh  TEXT,
  seller_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  view_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CERTIFICATES (ใบรับรองของแท้)
-- ============================================================
CREATE TABLE public.certificates (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin_id               UUID NOT NULL REFERENCES public.coins(id) ON DELETE CASCADE,
  expert_name           TEXT NOT NULL,
  expert_id             UUID REFERENCES public.users(id),
  notes                 TEXT,
  certificate_image_url TEXT,
  issued_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRICE HISTORY (ประวัติราคา)
-- ============================================================
CREATE TABLE public.price_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin_id     UUID REFERENCES public.coins(id) ON DELETE SET NULL,
  coin_tag    TEXT NOT NULL,   -- เช่น "lp-thuat-wat-changhai"
  price_thb   NUMERIC(12,2) NOT NULL,
  source      TEXT,            -- auction / marketplace / manual
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDERS (คำสั่งซื้อ)
-- ============================================================
CREATE TABLE public.orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id            UUID NOT NULL REFERENCES public.users(id),
  coin_id             UUID NOT NULL REFERENCES public.coins(id),
  seller_id           UUID NOT NULL REFERENCES public.users(id),
  amount_thb          NUMERIC(12,2) NOT NULL,
  shipping_fee_thb    NUMERIC(12,2) NOT NULL DEFAULT 0,
  escrow_fee_thb      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_thb           NUMERIC(12,2) NOT NULL,
  payment_status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending','paid','released','refunded')),
  shipping_status     TEXT NOT NULL DEFAULT 'pending'
                      CHECK (shipping_status IN ('pending','packed','shipped','delivered')),
  tracking_number     TEXT,
  shipping_carrier    TEXT,
  shipping_address    JSONB NOT NULL,
  stripe_payment_id   TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WATCHLIST (รายการที่ติดตาม)
-- ============================================================
CREATE TABLE public.watchlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coin_id    UUID NOT NULL REFERENCES public.coins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, coin_id)
);

-- ============================================================
-- REVIEWS (รีวิวผู้ขาย)
-- ============================================================
CREATE TABLE public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id),
  reviewer_id UUID NOT NULL REFERENCES public.users(id),
  seller_id   UUID NOT NULL REFERENCES public.users(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_coins_seller_id     ON public.coins(seller_id);
CREATE INDEX idx_coins_status        ON public.coins(status);
CREATE INDEX idx_coins_monk_id       ON public.coins(monk_id);
CREATE INDEX idx_coins_year_th       ON public.coins(year_th);
CREATE INDEX idx_coins_price_thb     ON public.coins(price_thb);
CREATE INDEX idx_coins_is_authenticated ON public.coins(is_authenticated);
CREATE INDEX idx_coins_created_at    ON public.coins(created_at DESC);
CREATE INDEX idx_orders_buyer_id     ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_id    ON public.orders(seller_id);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_watchlist_user_id   ON public.watchlist(user_id);
CREATE INDEX idx_price_history_coin_tag ON public.price_history(coin_tag);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Coins
ALTER TABLE public.coins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view available coins"
  ON public.coins FOR SELECT USING (TRUE);
CREATE POLICY "Sellers can insert own coins"
  ON public.coins FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own coins"
  ON public.coins FOR UPDATE USING (auth.uid() = seller_id);

-- Certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view certificates"
  ON public.certificates FOR SELECT USING (TRUE);
CREATE POLICY "Verified sellers can insert certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND (verified_seller = TRUE OR role = 'admin')
    )
  );

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers and sellers can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update shipping status"
  ON public.orders FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Watchlist
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watchlist"
  ON public.watchlist FOR ALL USING (auth.uid() = user_id);

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Buyers can create reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Monks & Price History (public read)
ALTER TABLE public.monks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view monks" ON public.monks FOR SELECT USING (TRUE);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view price history" ON public.price_history FOR SELECT USING (TRUE);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_coins_updated_at
  BEFORE UPDATE ON public.coins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update seller rating after review
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET rating = (
    SELECT ROUND(AVG(rating)::NUMERIC, 2)
    FROM public.reviews
    WHERE seller_id = NEW.seller_id
  )
  WHERE id = NEW.seller_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_seller_rating
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_seller_rating();

-- Increment view count
CREATE OR REPLACE FUNCTION increment_view_count(coin_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.coins SET view_count = view_count + 1 WHERE id = coin_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
