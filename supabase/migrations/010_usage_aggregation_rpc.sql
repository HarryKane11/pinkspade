-- RPC function: aggregate monthly credit usage at the database level
-- Returns daily and model breakdowns as JSONB arrays ready for the frontend

CREATE OR REPLACE FUNCTION get_monthly_usage(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  daily JSONB;
  models JSONB;
  total_used BIGINT;
BEGIN
  -- Daily aggregation
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('date', day::text, 'credits', total)
    ORDER BY day
  ), '[]'::jsonb)
  INTO daily
  FROM (
    SELECT
      (created_at AT TIME ZONE 'UTC')::date AS day,
      SUM(ABS(amount)) AS total
    FROM credit_ledger
    WHERE user_id = p_user_id
      AND amount < 0
      AND created_at >= date_trunc('month', NOW())
    GROUP BY day
    ORDER BY day
  ) d;

  -- Model aggregation
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'model_id', model,
      'total_credits', total,
      'count', cnt
    )
  ), '[]'::jsonb)
  INTO models
  FROM (
    SELECT
      COALESCE(model_id, 'text') AS model,
      SUM(ABS(amount)) AS total,
      COUNT(*) AS cnt
    FROM credit_ledger
    WHERE user_id = p_user_id
      AND amount < 0
      AND created_at >= date_trunc('month', NOW())
    GROUP BY model
  ) m;

  -- Total used
  SELECT COALESCE(SUM(ABS(amount)), 0)
  INTO total_used
  FROM credit_ledger
  WHERE user_id = p_user_id
    AND amount < 0
    AND created_at >= date_trunc('month', NOW());

  RETURN jsonb_build_object(
    'totalUsed', total_used,
    'dailyUsage', daily,
    'modelUsage', models
  );
END;
$$;
