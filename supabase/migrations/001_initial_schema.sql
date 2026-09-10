-- MANDI SETU AI: Production PostgreSQL / Supabase Schema Migration
-- Includes: Profiles, Mandis, Commodities, Time Slots, Bookings, Queues, Procurement, Notifications,
-- Triggers for Auth synchronization, Row Level Security (RLS), and Realtime Publications.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROCUREMENT CENTRES (Mandis / APMC Yards)
CREATE TABLE IF NOT EXISTS procurement_centres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    contact_phone TEXT,
    operational_status TEXT NOT NULL DEFAULT 'active' CHECK (operational_status IN ('active', 'inactive', 'closed')),
    daily_capacity_quintals NUMERIC(10,2) NOT NULL DEFAULT 5000.00,
    open_time TIME NOT NULL DEFAULT '08:00',
    close_time TIME NOT NULL DEFAULT '18:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER PROFILES (Linked directly to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'operator', 'admin')),
    full_name TEXT NOT NULL,
    phone_number TEXT,
    state TEXT DEFAULT 'Rajasthan',
    district TEXT DEFAULT 'Kota',
    kisan_id TEXT, -- Aadhaar / PM-KISAN / KCC identifier
    mandi_id UUID REFERENCES procurement_centres(id) ON DELETE SET NULL, -- Assigned Mandi for Operators
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMMODITIES & MSP
CREATE TABLE IF NOT EXISTS commodities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Cereals', 'Pulses', 'Oilseeds', 'Cash Crops', 'Millets')),
    variety TEXT,
    msp_price_per_quintal NUMERIC(10,2) NOT NULL,
    max_moisture_percentage NUMERIC(5,2) DEFAULT 12.0,
    unit TEXT DEFAULT 'Quintal',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TIME SLOTS
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity_farmers INT NOT NULL DEFAULT 25,
    booked_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_centre_slot UNIQUE (centre_id, slot_date, start_time)
);

-- 6. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number TEXT UNIQUE NOT NULL,
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
    commodity_id UUID NOT NULL REFERENCES commodities(id) ON DELETE RESTRICT,
    slot_date DATE NOT NULL,
    slot_time_start TIME NOT NULL,
    slot_time_end TIME NOT NULL,
    estimated_quantity_quintals NUMERIC(10,2) NOT NULL,
    vehicle_type TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (
        status IN ('confirmed', 'arrived', 'called', 'in_inspection', 'weighed', 'completed', 'cancelled', 'no_show')
    ),
    token_number TEXT NOT NULL,
    qr_code_data TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REAL-TIME QUEUE ENTRIES
CREATE TABLE IF NOT EXISTS queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
    token_number TEXT NOT NULL,
    current_stage TEXT NOT NULL DEFAULT 'waiting' CHECK (
        current_stage IN ('waiting', 'called_to_gate', 'gate_passed', 'quality_check', 'weighbridge', 'unloading', 'settled', 'no_show')
    ),
    priority_order INT NOT NULL,
    arrival_time TIMESTAMPTZ,
    called_time TIMESTAMPTZ,
    completed_time TIMESTAMPTZ,
    estimated_wait_minutes INT DEFAULT 15,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROCUREMENT & WEIGHMENT RECORDS
CREATE TABLE IF NOT EXISTS procurement_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    gross_weight_kg NUMERIC(10,2) NOT NULL,
    tare_weight_kg NUMERIC(10,2) NOT NULL,
    net_weight_kg NUMERIC(10,2) NOT NULL,
    moisture_percentage NUMERIC(5,2) NOT NULL,
    quality_grade TEXT NOT NULL DEFAULT 'Grade A',
    deduction_kg NUMERIC(10,2) DEFAULT 0,
    final_accepted_quintals NUMERIC(10,2) NOT NULL,
    rate_per_quintal NUMERIC(10,2) NOT NULL,
    total_payable_amount NUMERIC(12,2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'processing' CHECK (
        payment_status IN ('pending', 'processing', 'credited', 'rejected')
    ),
    payment_utr TEXT,
    operator_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN ('queue_call', 'slot_confirmed', 'gate_entry', 'weighment_done', 'payment_credited', 'system')
    ),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    sms_sent BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUTH TRIGGER: Automatically creates public.profiles when a user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        phone_number,
        role,
        state,
        district,
        kisan_id,
        mandi_id
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Mandi User'),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'farmer'),
        COALESCE(NEW.raw_user_meta_data->>'state', 'Rajasthan'),
        COALESCE(NEW.raw_user_meta_data->>'district', 'Kota'),
        NEW.raw_user_meta_data->>'kisan_id',
        CASE 
            WHEN NEW.raw_user_meta_data->>'mandi_id' IS NOT NULL AND NEW.raw_user_meta_data->>'mandi_id' != '' 
            THEN (NEW.raw_user_meta_data->>'mandi_id')::UUID 
            ELSE NULL 
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        role = EXCLUDED.role,
        state = EXCLUDED.state,
        district = EXCLUDED.district,
        kisan_id = EXCLUDED.kisan_id,
        mandi_id = EXCLUDED.mandi_id,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Role verification helper function (prevents policy recursion)
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(user_role, 'farmer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles Policies
CREATE POLICY "Users view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR auth_user_role() = 'admin');

CREATE POLICY "Users update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Procurement Centres Policies (Public read, Admin manage)
CREATE POLICY "Public read centres" ON procurement_centres
    FOR SELECT USING (true);

CREATE POLICY "Admin write centres" ON procurement_centres
    FOR ALL USING (auth_user_role() = 'admin');

-- Commodities Policies (Public read, Admin manage)
CREATE POLICY "Public read commodities" ON commodities
    FOR SELECT USING (true);

CREATE POLICY "Admin write commodities" ON commodities
    FOR ALL USING (auth_user_role() = 'admin');

-- Time slots Policies (Public read, Admin/Operator manage)
CREATE POLICY "Public read slots" ON time_slots
    FOR SELECT USING (true);

CREATE POLICY "Admin or Operator manage slots" ON time_slots
    FOR ALL USING (auth_user_role() IN ('admin', 'operator'));

-- Bookings Policies
CREATE POLICY "Farmer view own bookings" ON bookings
    FOR SELECT USING (
        farmer_id = auth.uid() 
        OR auth_user_role() = 'admin'
        OR (auth_user_role() = 'operator' AND centre_id = (SELECT mandi_id FROM profiles WHERE id = auth.uid()))
    );

CREATE POLICY "Farmer insert own bookings" ON bookings
    FOR INSERT WITH CHECK (farmer_id = auth.uid() OR auth_user_role() = 'admin');

CREATE POLICY "Manage bookings status" ON bookings
    FOR UPDATE USING (
        farmer_id = auth.uid()
        OR auth_user_role() IN ('operator', 'admin')
    );

-- Queue Entries Policies (Public read, Operator/Admin update)
CREATE POLICY "Public read queue" ON queue_entries
    FOR SELECT USING (true);

CREATE POLICY "Insert queue entry" ON queue_entries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Operator update queue" ON queue_entries
    FOR UPDATE USING (auth_user_role() IN ('operator', 'admin'));

-- Procurement Records Policies
CREATE POLICY "View procurement records" ON procurement_records
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM bookings WHERE bookings.id = procurement_records.booking_id AND bookings.farmer_id = auth.uid())
        OR auth_user_role() IN ('operator', 'admin')
    );

CREATE POLICY "Operator insert procurement" ON procurement_records
    FOR INSERT WITH CHECK (auth_user_role() IN ('operator', 'admin'));

CREATE POLICY "Operator update procurement" ON procurement_records
    FOR UPDATE USING (auth_user_role() IN ('operator', 'admin'));

-- Notifications Policies
CREATE POLICY "User view notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid() OR auth_user_role() = 'admin');

CREATE POLICY "Insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "User update notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- 12. REALTIME REPLICATION & REPLICA IDENTITY
ALTER TABLE queue_entries REPLICA IDENTITY FULL;
ALTER TABLE bookings REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE procurement_records REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
        ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        ALTER PUBLICATION supabase_realtime ADD TABLE procurement_records;
    END IF;
END $$;

-- 13. INITIAL SEED DATA (Populates default Mandis & MSP Commodities)
INSERT INTO procurement_centres (id, code, name, state, district, address, latitude, longitude, contact_phone, operational_status, daily_capacity_quintals, open_time, close_time)
VALUES
    ('a1b2c3d4-0001-4000-8000-000000000001', 'RJ-KOTA-01', 'Kota Bhamashah APMC Mega Yard', 'Rajasthan', 'Kota', 'Anantpura Industrial Area, Jhalawar Road, Kota - 324005', 25.1388, 75.8456, '+91 744 250123', 'active', 12000.00, '08:00', '18:30'),
    ('a1b2c3d4-0002-4000-8000-000000000002', 'MP-SEHORE-02', 'Sehore Krishi Upaj Mandi', 'Madhya Pradesh', 'Sehore', 'Bhopal-Indore Bypass Road, Sehore - 466001', 23.2032, 77.0844, '+91 7562 22456', 'active', 8500.00, '08:30', '18:00'),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'HR-KARNAL-03', 'Karnal Grain & Paddy APMC Market', 'Haryana', 'Karnal', 'New Grain Market, GT Road, Karnal - 132001', 29.6857, 76.9905, '+91 184 225678', 'active', 15000.00, '07:30', '19:00'),
    ('a1b2c3d4-0004-4000-8000-000000000004', 'TS-NZB-04', 'Nizamabad Agricultural Market Yard', 'Telangana', 'Nizamabad', 'APMC Complex, Station Road, Nizamabad - 503001', 18.6725, 78.0941, '+91 8462 23145', 'active', 9500.00, '08:00', '17:30')
ON CONFLICT (code) DO NOTHING;

INSERT INTO commodities (id, code, name, category, variety, msp_price_per_quintal, max_moisture_percentage, unit, is_active)
VALUES
    ('b1c2d3e4-0001-4000-8000-000000000001', 'WHEAT-FAQ', 'Wheat (FAQ Grade)', 'Cereals', 'Sharbati / Lokwan', 2275.00, 12.00, 'Quintal', true),
    ('b1c2d3e4-0002-4000-8000-000000000002', 'PADDY-GR-A', 'Paddy (Grade A Basmati)', 'Cereals', '1121 Sugandh', 2320.00, 14.00, 'Quintal', true),
    ('b1c2d3e4-0003-4000-8000-000000000003', 'MUSTARD-OIL', 'Mustard Seeds (High Oil)', 'Oilseeds', 'Pusa Bold', 5650.00, 8.00, 'Quintal', true),
    ('b1c2d3e4-0004-4000-8000-000000000004', 'CHANA-GRAM', 'Bengal Gram (Chana)', 'Pulses', 'Desi Bold', 5440.00, 10.00, 'Quintal', true),
    ('b1c2d3e4-0005-4000-8000-000000000005', 'SOYABEAN-Y', 'Soybean (Yellow)', 'Oilseeds', 'JS-335', 4892.00, 10.00, 'Quintal', true)
ON CONFLICT (code) DO NOTHING;

-- Seed default time slots for today
INSERT INTO time_slots (centre_id, slot_date, start_time, end_time, max_capacity_farmers, booked_count)
SELECT 
    id AS centre_id,
    CURRENT_DATE AS slot_date,
    tw.start_time,
    tw.end_time,
    25 AS max_capacity_farmers,
    0 AS booked_count
FROM procurement_centres
CROSS JOIN (
    VALUES 
        ('08:00'::TIME, '10:00'::TIME),
        ('10:00'::TIME, '12:00'::TIME),
        ('12:00'::TIME, '14:00'::TIME),
        ('14:00'::TIME, '16:00'::TIME),
        ('16:00'::TIME, '18:00'::TIME)
) AS tw(start_time, end_time)
ON CONFLICT (centre_id, slot_date, start_time) DO NOTHING;
