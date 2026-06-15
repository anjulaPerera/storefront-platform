-- 009_fix_audit_logs_actor_nullable.sql

ALTER TABLE audit_logs
ALTER COLUMN actor_user_id DROP NOT NULL;