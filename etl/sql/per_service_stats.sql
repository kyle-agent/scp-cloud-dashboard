-- Per-service stats for the Tab2 service cards (instance counts + revenue).
--
-- Required output columns (one row per service):
--   service_key      TEXT     -- matches `key` in data/services.json
--   total_instances  INT
--   new_this_month   INT
--   new_today        INT
--   last_month_rev   NUMERIC
--
-- The 12-month per-service trends are produced by a separate query
-- (per_service_trends.sql) to keep this one cheap.

SELECT
    sc.service_key                                                       AS service_key,
    COUNT(*) FILTER (WHERE inst.status IN ('running','provisioning'))    AS total_instances,
    COUNT(*) FILTER (WHERE inst.created_at >= date_trunc('month', CURRENT_DATE)) AS new_this_month,
    COUNT(*) FILTER (WHERE inst.created_at >= CURRENT_DATE)              AS new_today,
    COALESCE((
        SELECT SUM(bi.amount_krw)
        FROM billing_invoice bi
        WHERE bi.service_key = sc.service_key
          AND bi.invoice_date >= date_trunc('month', CURRENT_DATE - interval '1 month')
          AND bi.invoice_date <  date_trunc('month', CURRENT_DATE)
          AND bi.status = 'paid'
    ), 0)                                                                AS last_month_rev
FROM service_catalog sc
LEFT JOIN service_instance inst ON inst.service_key = sc.service_key
GROUP BY sc.service_key;
