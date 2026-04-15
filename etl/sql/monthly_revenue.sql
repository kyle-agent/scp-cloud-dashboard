-- Last 12 months of revenue for the trend chart.
--
-- Required output columns (12 rows, oldest → newest):
--   month_start   DATE
--   revenue_krw   NUMERIC
--
-- TODO: replace `billing_invoice` and `amount_krw` with real names.

SELECT
    date_trunc('month', invoice_date)::date AS month_start,
    SUM(amount_krw)                          AS revenue_krw
FROM billing_invoice
WHERE invoice_date >= (date_trunc('month', CURRENT_DATE) - interval '11 months')
  AND status = 'paid'
GROUP BY 1
ORDER BY 1;
