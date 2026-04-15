-- Account headline numbers for the Tab2 SLA bar.
--
-- Required output columns (single row):
--   total_accounts        BIGINT
--   new_today             BIGINT
--   new_this_week         BIGINT
--   new_this_month        BIGINT
--
-- TODO: replace `accounts` and `created_at` with the real table/column names
-- used in the existing Superset dashboard.

SELECT
    COUNT(*)                                                            AS total_accounts,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)                  AS new_today,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE)) AS new_this_week,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) AS new_this_month
FROM accounts
WHERE status = 'active';
