-- ============================================================
-- MANDI-CENTRIC OPERATOR OWNERSHIP
-- Exactly one active operator per procurement centre.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS ux_one_operator_per_mandi
ON public.profiles (mandi_id)
WHERE role = 'operator' AND mandi_id IS NOT NULL;
