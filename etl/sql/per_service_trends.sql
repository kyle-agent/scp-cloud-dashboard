-- 12-month per-service trends (instances + revenue).
--
-- Required output columns:
--   service_key     TEXT
--   month_start     DATE
--   instance_count  INT
--   revenue_krw     NUMERIC
--
-- Used to populate `perService.<key>.instanceTrend` and `revenueTrend`.

WITH months AS (
    SELECT generate_series(
        date_trunc('month', CURRENT_DATE - interval '11 months'),
        date_trunc('month', CURRENT_DATE),
        interval '1 month'
    )::date AS month_start
)
SELECT
    sc.service_key                                AS service_key,
    m.month_start                                 AS month_start,
    COUNT(DISTINCT inst.instance_id) FILTER (
        WHERE inst.created_at <= m.month_start + interval '1 month'
          AND (inst.terminated_at IS NULL OR inst.terminated_at > m.month_start + interval '1 month')
    )                                             AS instance_count,
    COALESCE(SUM(bi.amount_krw) FILTER (
        WHERE bi.invoice_date >= m.month_start
          AND bi.invoice_date <  m.month_start + interval '1 month'
    ), 0)                                         AS revenue_krw
FROM service_catalog sc
CROSS JOIN months m
LEFT JOIN service_instance inst ON inst.service_key = sc.service_key
LEFT JOIN billing_invoice  bi   ON bi.service_key   = sc.service_key
GROUP BY sc.service_key, m.month_start
ORDER BY sc.service_key, m.month_start;
