-- Revenue rolled up by service category for the last completed month.
--
-- Required output columns:
--   category      TEXT       -- must match catalog category in data/services.json
--   revenue_krw   NUMERIC
--   service_count INT
--
-- TODO: confirm join path. The expected shape is
--   billing_invoice → service_catalog → category

SELECT
    sc.category                  AS category,
    SUM(bi.amount_krw)           AS revenue_krw,
    COUNT(DISTINCT sc.service_key) AS service_count
FROM billing_invoice bi
JOIN service_catalog sc ON sc.service_key = bi.service_key
WHERE bi.invoice_date >= date_trunc('month', CURRENT_DATE - interval '1 month')
  AND bi.invoice_date <  date_trunc('month', CURRENT_DATE)
  AND bi.status = 'paid'
GROUP BY sc.category
ORDER BY revenue_krw DESC;
