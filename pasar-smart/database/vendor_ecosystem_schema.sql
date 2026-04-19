-- Vendor Ecosystem Enhancement: AI Registration, Real-Time Status, Analytics, & Recommendations

-- 1. REAL-TIME STALL STATUS MANAGEMENT
CREATE TABLE IF NOT EXISTS stall_status (
    id TEXT NOT NULL PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    market_id TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
    assignment_id TEXT NOT NULL REFERENCES assignment(id) ON DELETE CASCADE,
    is_present BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'INACTIVE', -- ACTIVE, BUSY, SOLDOUT, CLOSED
    last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_stall_number TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    photo_url TEXT
);

-- 2. VENDOR MENU & PRODUCTS
CREATE TABLE IF NOT EXISTS vendor_menu (
    id TEXT NOT NULL PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. REAL-TIME SALES TRACKING
CREATE TABLE IF NOT EXISTS sale (
    id TEXT NOT NULL PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    market_id TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES vendor_menu(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    sale_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method TEXT, -- CASH, CARD, DIGITAL
    notes TEXT
);

-- 4. FLASH SALES & PROMOTIONS
CREATE TABLE IF NOT EXISTS flash_sale (
    id TEXT NOT NULL PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    market_id TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES vendor_menu(id) ON DELETE SET NULL,
    original_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    quantity INTEGER,
    quantity_sold INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. PASAR-DRIVE (MULTI-STALL ORDERS)
CREATE TABLE IF NOT EXISTS pasar_drive (
    id TEXT NOT NULL PRIMARY KEY,
    customer_id TEXT,
    market_id TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
    order_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estimated_pickup_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, READY, COMPLETED, CANCELLED
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'UNPAID'
);

CREATE TABLE IF NOT EXISTS pasar_drive_item (
    id TEXT NOT NULL PRIMARY KEY,
    drive_id TEXT NOT NULL REFERENCES pasar_drive(id) ON DELETE CASCADE,
    vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES vendor_menu(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- 6. DUIT PECAH (SMALL CHANGE REQUEST)
CREATE TABLE IF NOT EXISTS duit_pecah (
    id TEXT NOT NULL PRIMARY KEY,
    requester_vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    provider_vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    market_id TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
    request_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, COMPLETED, REJECTED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 7. AI CHAT HISTORY (FOR REGISTRATION & SUPPORT)
CREATE TABLE IF NOT EXISTS chat_message (
    id TEXT NOT NULL PRIMARY KEY,
    vendor_id TEXT REFERENCES vendor(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL, -- USER, ASSISTANT
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. VENDOR REGISTRATION STATE (FOR AI ONBOARDING)
CREATE TABLE IF NOT EXISTS registration_state (
    id TEXT NOT NULL PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    vendor_id TEXT REFERENCES vendor(id) ON DELETE CASCADE,
    extracted_data JSONB, -- Stores extracted vendor info from chat
    stage TEXT NOT NULL DEFAULT 'INITIAL', -- INITIAL, COLLECTING_INFO, CONFIRMING, COMPLETE
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. ANALYTICS & PERFORMANCE DATA
CREATE TABLE IF NOT EXISTS vendor_analytics (
    id TEXT NOT NULL PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    market_id TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_quantity_sold INTEGER NOT NULL DEFAULT 0,
    peak_hour_start INTEGER, -- 0-23 (hour of day)
    peak_hour_count INTEGER DEFAULT 0,
    customer_count INTEGER DEFAULT 0,
    avg_transaction_value DECIMAL(10,2),
    top_selling_item TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, market_id, date)
);

-- 10. AI RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS recommendation (
    id TEXT NOT NULL PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- PRICING, BUNDLING, POSITIONING, PRODUCT, TIMING
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    suggested_value JSONB,
    rationale TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    applied_at TIMESTAMPTZ,
    impact JSONB -- Stores expected impact metrics
);

-- 11. CUSTOMER PREFERENCES (FOR INSIGHTS)
CREATE TABLE IF NOT EXISTS customer_preference (
    id TEXT NOT NULL PRIMARY KEY,
    market_id TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 0,
    average_spent DECIMAL(10,2),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_stall_status_vendor_id ON stall_status(vendor_id);
CREATE INDEX IF NOT EXISTS idx_stall_status_market_id ON stall_status(market_id);
CREATE INDEX IF NOT EXISTS idx_stall_status_is_present ON stall_status(is_present);
CREATE INDEX IF NOT EXISTS idx_stall_status_last_updated ON stall_status(last_updated);

CREATE INDEX IF NOT EXISTS idx_sale_vendor_id ON sale(vendor_id);
CREATE INDEX IF NOT EXISTS idx_sale_market_id ON sale(market_id);
CREATE INDEX IF NOT EXISTS idx_sale_sale_time ON sale(sale_time);

CREATE INDEX IF NOT EXISTS idx_flash_sale_vendor_id ON flash_sale(vendor_id);
CREATE INDEX IF NOT EXISTS idx_flash_sale_is_active ON flash_sale(is_active);
CREATE INDEX IF NOT EXISTS idx_flash_sale_end_time ON flash_sale(end_time);

CREATE INDEX IF NOT EXISTS idx_vendor_analytics_vendor_id ON vendor_analytics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_analytics_date ON vendor_analytics(date);

CREATE INDEX IF NOT EXISTS idx_chat_message_vendor_id ON chat_message(vendor_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_session_id ON chat_message(session_id);

-- VIEWS FOR EASY QUERYING
CREATE OR REPLACE VIEW active_stalls AS
SELECT 
    ss.vendor_id,
    ss.market_id,
    v.nama_perniagaan,
    v.jenis_jualan,
    m.nama_pasar,
    ss.current_stall_number,
    ss.status,
    ss.latitude,
    ss.longitude,
    ss.last_updated
FROM stall_status ss
JOIN vendor v ON ss.vendor_id = v.id
JOIN market m ON ss.market_id = m.id
WHERE ss.is_present = TRUE
ORDER BY ss.last_updated DESC;

CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
    v.id as vendor_id,
    v.nama_perniagaan,
    m.id as market_id,
    m.nama_pasar,
    CURRENT_DATE as sale_date,
    COALESCE(SUM(s.total_amount), 0) as total_sales,
    COALESCE(SUM(s.quantity), 0) as total_quantity_sold,
    COUNT(DISTINCT DATE_TRUNC('hour', s.sale_time)) as hours_counting,
    COALESCE(AVG(s.total_amount), 0) as avg_transaction_value
FROM vendor v
LEFT JOIN market m ON true
LEFT JOIN sale s ON s.vendor_id = v.id 
    AND s.market_id = m.id
    AND DATE(s.sale_time) = CURRENT_DATE
GROUP BY v.id, v.nama_perniagaan, m.id, m.nama_pasar;
