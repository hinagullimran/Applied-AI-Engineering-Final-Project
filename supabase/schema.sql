-- Supabase Schema for Catalyst: E-Commerce Intelligence Engine

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Products
-- Stores information about identified trending products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    trending_score NUMERIC DEFAULT 0.0,
    status TEXT DEFAULT 'discovered', -- e.g., 'discovered', 'validating', 'sourcing', 'launched'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Competitor_Reviews
-- Stores scraped unstructured review data, sentiment, and extracted insights
CREATE TABLE IF NOT EXISTS public.competitor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    competitor_product_name TEXT,
    review_text TEXT NOT NULL,
    sentiment_score NUMERIC, -- e.g., from -1.0 to 1.0
    physical_complaints TEXT[], -- Array of extracted physical complaints
    desired_features TEXT[], -- Array of extracted desired features
    market_gap_notes TEXT,
    processed BOOLEAN DEFAULT FALSE,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Sourcing_Leads
-- Stores potential suppliers/logistics options for validated products
CREATE TABLE IF NOT EXISTS public.sourcing_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    supplier_contact TEXT,
    supplier_url TEXT,
    estimated_cost NUMERIC,
    moq INTEGER, -- Minimum Order Quantity
    lead_time_days INTEGER,
    status TEXT DEFAULT 'contacted', -- e.g., 'contacted', 'negotiating', 'contracted'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist to avoid errors on re-run
DROP TRIGGER IF EXISTS update_products_modtime ON public.products;
DROP TRIGGER IF EXISTS update_sourcing_leads_modtime ON public.sourcing_leads;

-- Create triggers
CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sourcing_leads_modtime
    BEFORE UPDATE ON public.sourcing_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Set up Row Level Security (RLS) policies (Optional/Placeholder for future security setup)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_leads ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for development (tighten later with user auth policies)
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on competitor_reviews" ON public.competitor_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sourcing_leads" ON public.sourcing_leads FOR ALL USING (true) WITH CHECK (true);

