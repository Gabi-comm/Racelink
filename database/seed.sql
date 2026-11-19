-- sample data, password ng lahat: racelink123
-- run after migrations: npm run db:seed

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM payment_proofs;
DELETE FROM bookings;
DELETE FROM event_documents;
DELETE FROM event_sizes;
DELETE FROM event_distances;
DELETE FROM events;
DELETE FROM runner_profiles;
DELETE FROM session;
DELETE FROM account;
DELETE FROM verification;
DELETE FROM user;
SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE events AUTO_INCREMENT = 1;
ALTER TABLE event_distances AUTO_INCREMENT = 1;
ALTER TABLE event_sizes AUTO_INCREMENT = 1;
ALTER TABLE bookings AUTO_INCREMENT = 1;
ALTER TABLE payment_proofs AUTO_INCREMENT = 1;
ALTER TABLE event_documents AUTO_INCREMENT = 1;

SET @pw = 'b46f6ce6fe05249b5bc852320caaaff3:38d90c6876b7408eae2587f4e947e4095ed553a7dff92a2987f671fe82af9e1a9cf265d3c320506ea3648f9c3e72363890ad8b36262fcd73ee23543abc18509f';

-- users
INSERT INTO user (id, name, email, email_verified, role) VALUES
  ('seed-admin', 'Alex Reyes', 'admin@racelink.test', TRUE, 'admin'),
  ('seed-organizer', 'Jane Smith', 'organizer@racelink.test', TRUE, 'organizer'),
  ('seed-runner-1', 'Enzo Cruz', 'enzo@racelink.test', TRUE, 'runner'),
  ('seed-runner-2', 'Paris Santos', 'paris@racelink.test', TRUE, 'runner'),
  ('seed-runner-3', 'Miguel Tan', 'miguel@racelink.test', TRUE, 'runner');

INSERT INTO account (id, account_id, provider_id, user_id, password) VALUES
  ('seed-acc-admin', 'seed-admin', 'credential', 'seed-admin', @pw),
  ('seed-acc-organizer', 'seed-organizer', 'credential', 'seed-organizer', @pw),
  ('seed-acc-runner-1', 'seed-runner-1', 'credential', 'seed-runner-1', @pw),
  ('seed-acc-runner-2', 'seed-runner-2', 'credential', 'seed-runner-2', @pw),
  ('seed-acc-runner-3', 'seed-runner-3', 'credential', 'seed-runner-3', @pw);

INSERT INTO runner_profiles (user_id, phone, address, gender, birthdate, emergency_name, emergency_phone) VALUES
  ('seed-runner-1', '09171112222', 'Sampaloc, Manila', 'Male', '2002-05-14', 'Maria Cruz', '09173334444'),
  ('seed-runner-2', '09185556666', 'Quezon City', 'Female', '2001-11-02', 'Leo Santos', '09187778888'),
  ('seed-runner-3', '09199990000', 'Caloocan City', 'Male', '1999-08-21', 'Ana Tan', '09191231234');

-- events
INSERT INTO events (title, description, location, event_date, start_time, registration_closes, capacity, status, organizer_id) VALUES
  ('Caloocan City Run', 'A flat city course through Caloocan''s main roads, open to first-timers and seasoned runners.', 'Caloocan City', '2027-02-14', '05:00:00', '2027-02-07', 800, 'open', 'seed-organizer'),
  ('Manila Bay Sunset Run', 'Run along Roxas Boulevard as the sun sets over Manila Bay.', 'Roxas Blvd, Manila', '2027-03-21', '16:30:00', '2027-03-14', 600, 'open', 'seed-organizer'),
  ('BGC Night Dash', 'A night race through Bonifacio Global City with lighted checkpoints.', 'Taguig City', '2027-04-10', '19:00:00', '2027-04-03', 1000, 'open', 'seed-organizer'),
  ('Valenzuela Fun Run', 'A family-friendly fun run for all ages.', 'Valenzuela City', '2027-05-02', '05:30:00', '2027-04-25', 400, 'open', 'seed-organizer'),
  ('Tagaytay Ridge Climb', 'A hilly course with a view of Taal Volcano. For experienced runners.', 'Tagaytay, Cavite', '2027-06-19', '04:30:00', '2027-06-05', 300, 'draft', 'seed-organizer');

INSERT INTO event_distances (event_id, label, price, slots) VALUES
  (1, '3KM', 500.00, NULL), (1, '5KM', 650.00, NULL), (1, '10KM', 900.00, NULL),
  (2, '5KM', 550.00, NULL), (2, '10KM', 700.00, NULL),
  (3, '3KM', 400.00, NULL), (3, '5KM', 550.00, NULL), (3, '10KM', 750.00, 300),
  (4, '3KM', 300.00, NULL), (4, '5KM', 400.00, NULL),
  (5, '21KM', 1100.00, 150), (5, '10KM', 800.00, 150);

INSERT INTO event_sizes (event_id, size) VALUES
  (1, 'S'), (1, 'M'), (1, 'L'), (1, 'XL'),
  (2, 'S'), (2, 'M'), (2, 'L'), (2, 'XL'), (2, 'XXL'),
  (3, 'XS'), (3, 'S'), (3, 'M'), (3, 'L'), (3, 'XL'),
  (4, 'S'), (4, 'M'), (4, 'L'),
  (5, 'S'), (5, 'M'), (5, 'L'), (5, 'XL');

-- bookings, approved has a bib
INSERT INTO bookings (user_id, event_id, distance_id, distance_label, price, tshirt_size, status, bib_number) VALUES
  ('seed-runner-1', 1, 3, '10KM', 900.00, 'M', 'approved', 1001),
  ('seed-runner-2', 1, 2, '5KM', 650.00, 'S', 'pending', NULL),
  ('seed-runner-1', 2, 4, '5KM', 550.00, 'M', 'rejected', NULL),
  ('seed-runner-3', 3, 8, '10KM', 750.00, 'L', 'approved', 1001);

-- file keys are sample only, no real files in s3
INSERT INTO payment_proofs (booking_id, file_key, amount, reference_no, status, review_note, reviewed_by, reviewed_at) VALUES
  (1, 'payments/seed/booking-1.jpg', 900.00, 'GC-1001-2027', 'approved', NULL, 'seed-organizer', NOW(3)),
  (2, 'payments/seed/booking-2.jpg', 650.00, 'GC-1002-2027', 'pending', NULL, NULL, NULL),
  (3, 'payments/seed/booking-3.jpg', 500.00, 'GC-1003-2027', 'rejected', 'Amount is short by ₱50.', 'seed-organizer', NOW(3)),
  (4, 'payments/seed/booking-4.jpg', 750.00, 'GC-1004-2027', 'approved', NULL, 'seed-organizer', NOW(3));

-- how runners pay, shown on the register page
UPDATE events SET payment_method = 'gcash', payment_account_name = 'Jane Smith', payment_account_number = '0917 123 4567', payment_instructions = 'Put your full name and the race in the payment message.';
