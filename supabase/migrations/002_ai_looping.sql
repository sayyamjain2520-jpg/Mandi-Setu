-- ============================================================
-- MANDI SETU AI LOOPING ENGINE
-- Migration: 002_ai_looping.sql
--
-- LOOP:
-- Predict → Observe Actual → Measure Error → Learn → Repeat
-- ============================================================


-- ============================================================
-- 1. AI PREDICTION CYCLES
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_prediction_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link this prediction to the exact queue event
    queue_entry_id UUID UNIQUE NOT NULL
        REFERENCES queue_entries(id) ON DELETE CASCADE,

    booking_id UUID UNIQUE NOT NULL
        REFERENCES bookings(id) ON DELETE CASCADE,

    centre_id UUID NOT NULL
        REFERENCES procurement_centres(id) ON DELETE CASCADE,

    -- --------------------------------------------------------
    -- INPUTS USED BY THE AI AT PREDICTION TIME
    -- --------------------------------------------------------

    farmers_ahead INT NOT NULL DEFAULT 0
        CHECK (farmers_ahead >= 0),

    number_of_vehicles INT NOT NULL DEFAULT 1
        CHECK (number_of_vehicles BETWEEN 1 AND 3),

    average_processing_minutes INT NOT NULL DEFAULT 8
        CHECK (average_processing_minutes > 0),

    active_processing_capacity INT NOT NULL DEFAULT 1
        CHECK (active_processing_capacity > 0),

    congestion_level TEXT NOT NULL DEFAULT 'low'
        CHECK (congestion_level IN ('low', 'medium', 'high')),

    -- --------------------------------------------------------
    -- AI PREDICTION
    -- --------------------------------------------------------

    predicted_wait_minutes INT NOT NULL
        CHECK (predicted_wait_minutes >= 0),

    model_version TEXT NOT NULL DEFAULT 'smart-arrival-v1',

    prediction_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (prediction_status IN ('pending', 'completed', 'ignored')),

    predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- --------------------------------------------------------
    -- OBSERVED REAL-WORLD RESULT
    --
    -- Actual wait =
    -- arrival_time → called_time
    -- --------------------------------------------------------

    actual_wait_minutes INT
        CHECK (actual_wait_minutes IS NULL OR actual_wait_minutes >= 0),

    observed_at TIMESTAMPTZ,

    -- --------------------------------------------------------
    -- ERROR / FEEDBACK
    --
    -- error = actual - predicted
    --
    -- Positive = actual wait was longer
    -- Negative = actual wait was shorter
    -- --------------------------------------------------------

    prediction_error_minutes INT,

    absolute_error_minutes INT
        CHECK (
            absolute_error_minutes IS NULL
            OR absolute_error_minutes >= 0
        ),

    -- --------------------------------------------------------
    -- LEARNING / ADAPTATION
    -- --------------------------------------------------------

    learning_adjustment_minutes INT NOT NULL DEFAULT 0,

    next_prediction_minutes INT
        CHECK (
            next_prediction_minutes IS NULL
            OR next_prediction_minutes >= 0
        ),

    learning_note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ai_prediction_cycles_centre
    ON ai_prediction_cycles(centre_id);

CREATE INDEX IF NOT EXISTS idx_ai_prediction_cycles_booking
    ON ai_prediction_cycles(booking_id);

CREATE INDEX IF NOT EXISTS idx_ai_prediction_cycles_status
    ON ai_prediction_cycles(prediction_status);

CREATE INDEX IF NOT EXISTS idx_ai_prediction_cycles_created
    ON ai_prediction_cycles(created_at DESC);


-- ============================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE ai_prediction_cycles ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 4. READ POLICY
--
-- Admins can see all AI cycles.
-- Farmers can see their own prediction cycles.
-- Operators can see cycles for their assigned centre.
-- ============================================================

CREATE POLICY "AI cycles readable by authorised users"
ON ai_prediction_cycles
FOR SELECT
USING (
    auth_user_role() = 'admin'

    OR EXISTS (
        SELECT 1
        FROM profiles p
        JOIN bookings b
            ON b.farmer_id = p.id
        WHERE b.id = ai_prediction_cycles.booking_id
          AND p.id = auth.uid()
    )

    OR (
        auth_user_role() = 'operator'
        AND centre_id = (
            SELECT p.mandi_id
            FROM profiles p
            WHERE p.id = auth.uid()
        )
    )
);


-- ============================================================
-- 5. INSERT POLICY
--
-- Prediction records are created by operator/admin workflow.
-- ============================================================

CREATE POLICY "Operators and admins create AI cycles"
ON ai_prediction_cycles
FOR INSERT
WITH CHECK (
    auth_user_role() IN ('operator', 'admin')
);


-- ============================================================
-- 6. UPDATE POLICY
--
-- Used later when the real-world result arrives and the
-- prediction is evaluated.
-- ============================================================

CREATE POLICY "Operators and admins update AI cycles"
ON ai_prediction_cycles
FOR UPDATE
USING (
    auth_user_role() IN ('operator', 'admin')
)
WITH CHECK (
    auth_user_role() IN ('operator', 'admin')
);


-- ============================================================
-- 7. REALTIME
-- ============================================================

ALTER TABLE ai_prediction_cycles REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) THEN

        ALTER PUBLICATION supabase_realtime
        ADD TABLE ai_prediction_cycles;

    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;


-- ============================================================
-- 8. OPTIONAL HELPER VIEW FOR ADMIN ANALYTICS
--
-- Gives us a clean summary of the LOOP.
-- ============================================================

CREATE OR REPLACE VIEW ai_loop_summary AS
SELECT
    centre_id,

    COUNT(*) AS total_predictions,

    COUNT(*) FILTER (
        WHERE prediction_status = 'completed'
    ) AS completed_predictions,

    ROUND(
        AVG(predicted_wait_minutes)
    )::INT AS avg_predicted_wait_minutes,

    ROUND(
        AVG(actual_wait_minutes)
    )::INT AS avg_actual_wait_minutes,

    ROUND(
        AVG(absolute_error_minutes)
    )::INT AS avg_absolute_error_minutes,

    ROUND(
        AVG(prediction_error_minutes)
    )::INT AS avg_prediction_error_minutes,

    ROUND(
        100.0 * COUNT(*) FILTER (
            WHERE prediction_status = 'completed'
        ) / NULLIF(COUNT(*), 0),
        1
    ) AS completion_rate

FROM ai_prediction_cycles
GROUP BY centre_id;


-- ============================================================
-- DONE
-- ============================================================