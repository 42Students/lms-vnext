-- Withdrawing an application overwrites applicationStatus with "WITHDRAWN", destroying the one
-- signal the anti-reapply guard in JobServiceImpl.applyToJob depends on (whether the prior
-- application ever reached an advanced/terminal status). This column preserves that prior
-- status specifically so a withdraw-then-reapply can still be blocked when it should be.
ALTER TABLE job_application
  ADD COLUMN status_before_withdrawal VARCHAR(30) NULL;
