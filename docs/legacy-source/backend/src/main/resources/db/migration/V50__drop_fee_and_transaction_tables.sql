-- Fee and transaction functionality has been removed from the system.
-- Drop all three tables. CASCADE handles any remaining FK references.
DROP TABLE IF EXISTS transaction_details;
DROP TABLE IF EXISTS student_fee_profiles;
DROP TABLE IF EXISTS fee_profiles;
