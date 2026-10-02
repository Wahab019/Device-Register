-- Migration: 002_status_workflow.sql
-- Updates the allowed statuses check constraint on public.device_records
-- to support the new workflow: pending, in_progress, awaiting_approval, ready_for_pickup, completed, cancelled

alter table public.device_records
  drop constraint if exists device_records_status_check;

alter table public.device_records
  add constraint device_records_status_check
  check (status in ('pending', 'in_progress', 'awaiting_approval', 'ready_for_pickup', 'completed', 'cancelled'));
