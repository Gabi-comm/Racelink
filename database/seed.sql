-- sample data, password ng lahat: racelink123
-- run after migrations: npm run db:seed

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM race_requests;
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
ALTER TABLE race_requests AUTO_INCREMENT = 1;

SET @pw = 'b46f6ce6fe05249b5bc852320caaaff3:38d90c6876b7408eae2587f4e947e4095ed553a7dff92a2987f671fe82af9e1a9cf265d3c320506ea3648f9c3e72363890ad8b36262fcd73ee23543abc18509f';

-- users
INSERT INTO user (id, name, email, email_verified, role) VALUES
  ('seed-admin', 'Gabriel John Solomon', 'admin@racelink.test', TRUE, 'admin'),
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

-- more runners for dashboard charts (no login accounts)
INSERT INTO user (id, name, email, email_verified, role, created_at) VALUES
  ('seed-runner-4', 'Liza Garcia', 'liza.garcia@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 61 DAY),
  ('seed-runner-5', 'Carlo Reyes', 'carlo.reyes@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 32 DAY),
  ('seed-runner-6', 'Bea Lim', 'bea.lim@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 31 DAY),
  ('seed-runner-7', 'Rafael Mendoza', 'rafael.mendoza@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 27 DAY),
  ('seed-runner-8', 'Andrea Bautista', 'andrea.bautista@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 93 DAY),
  ('seed-runner-9', 'Joaquin Villanueva', 'joaquin.villanueva@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 57 DAY),
  ('seed-runner-10', 'Mika Ramos', 'mika.ramos@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 91 DAY),
  ('seed-runner-11', 'Paolo Aquino', 'paolo.aquino@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 90 DAY),
  ('seed-runner-12', 'Trisha Castillo', 'trisha.castillo@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 74 DAY),
  ('seed-runner-13', 'Nico Navarro', 'nico.navarro@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 51 DAY),
  ('seed-runner-14', 'Grace Flores', 'grace.flores@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 63 DAY),
  ('seed-runner-15', 'Ramon Torres', 'ramon.torres@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 73 DAY),
  ('seed-runner-16', 'Ella Dizon', 'ella.dizon@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 105 DAY),
  ('seed-runner-17', 'Victor Ocampo', 'victor.ocampo@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 94 DAY),
  ('seed-runner-18', 'Sofia Rivera', 'sofia.rivera@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 109 DAY),
  ('seed-runner-19', 'Daniel Gomez', 'daniel.gomez@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 56 DAY),
  ('seed-runner-20', 'Kat Pascual', 'kat.pascual@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 98 DAY),
  ('seed-runner-21', 'Jomar Salazar', 'jomar.salazar@racelink.test', TRUE, 'runner', NOW(3) - INTERVAL 114 DAY);

INSERT INTO runner_profiles (user_id, phone, address, gender, birthdate, emergency_name, emergency_phone) VALUES
  ('seed-runner-4', '09177624039', 'Metro Manila', 'Female', '1995-01-11', 'Contact Garcia', '09189990608'),
  ('seed-runner-5', '09171973060', 'Metro Manila', 'Male', '2004-09-13', 'Contact Reyes', '09181629072'),
  ('seed-runner-6', '09178015764', 'Metro Manila', 'Female', '1977-04-11', 'Contact Lim', '09188122250'),
  ('seed-runner-7', '09173077052', 'Metro Manila', 'Other', '2005-04-19', 'Contact Mendoza', '09182037872'),
  ('seed-runner-8', '09177655194', 'Metro Manila', 'Other', '1976-04-10', 'Contact Bautista', '09183234302'),
  ('seed-runner-9', '09173420198', 'Metro Manila', 'Female', '1992-02-19', 'Contact Villanueva', '09186175466'),
  ('seed-runner-10', '09172728987', 'Metro Manila', 'Female', '1993-04-15', 'Contact Ramos', '09182634613'),
  ('seed-runner-11', '09171999941', 'Metro Manila', 'Male', '1994-04-17', 'Contact Aquino', '09189920785'),
  ('seed-runner-12', '09178811503', 'Metro Manila', 'Male', '1993-08-15', 'Contact Castillo', '09186029255'),
  ('seed-runner-13', '09175095259', 'Metro Manila', 'Female', '1977-05-18', 'Contact Navarro', '09189306674'),
  ('seed-runner-14', '09175830794', 'Metro Manila', 'Female', '1994-02-11', 'Contact Flores', '09189588807'),
  ('seed-runner-15', '09176738744', 'Metro Manila', 'Female', '1979-08-16', 'Contact Torres', '09181657788'),
  ('seed-runner-16', '09176263809', 'Metro Manila', 'Male', '1985-06-19', 'Contact Dizon', '09189332820'),
  ('seed-runner-17', '09172153650', 'Metro Manila', 'Female', '2001-02-14', 'Contact Ocampo', '09188954050'),
  ('seed-runner-18', '09172017864', 'Metro Manila', 'Male', '1998-05-19', 'Contact Rivera', '09188476611'),
  ('seed-runner-19', '09176821782', 'Metro Manila', 'Female', '1975-08-15', 'Contact Gomez', '09183819383'),
  ('seed-runner-20', '09179282794', 'Metro Manila', 'Male', '1976-04-14', 'Contact Pascual', '09183169968'),
  ('seed-runner-21', '09177675615', 'Metro Manila', 'Female', '1987-08-11', 'Contact Salazar', '09183791163');

-- a finished race, for previous events and check-in stats
INSERT INTO events (title, description, location, event_date, start_time, registration_closes, capacity, status, organizer_id, requested_by, payment_method, payment_account_name, payment_account_number) VALUES
  ('Marikina River Run', 'An early morning loop along the Marikina River Park, flat and shaded.', 'Marikina City', '2026-10-11', '05:00:00', '2026-10-04', 300, 'closed', 'seed-organizer', 'Marikina Runners Club', 'gcash', 'Jane Smith', '0917 123 4567');

INSERT INTO event_distances (event_id, label, price, slots) VALUES
  (6, '5KM', 500.00, NULL), (6, '10KM', 750.00, NULL), (6, '21KM', 1200.00, 100);

INSERT INTO event_sizes (event_id, size) VALUES (6, 'S'), (6, 'M'), (6, 'L'), (6, 'XL');

INSERT INTO bookings (user_id, event_id, distance_id, distance_label, price, tshirt_size, status, bib_number, attended, checked_in_at, created_at) VALUES
  ('seed-runner-4', 4, 9, '3KM', 300.00, 'L', 'pending', NULL, FALSE, NULL, NOW(3) - INTERVAL 70 DAY),
  ('seed-runner-4', 3, 8, '10KM', 750.00, 'XS', 'approved', 1002, FALSE, NULL, NOW(3) - INTERVAL 45 DAY),
  ('seed-runner-5', 2, 4, '5KM', 550.00, 'L', 'approved', 1001, FALSE, NULL, NOW(3) - INTERVAL 29 DAY),
  ('seed-runner-6', 4, 9, '3KM', 300.00, 'M', 'approved', 1001, FALSE, NULL, NOW(3) - INTERVAL 0 DAY),
  ('seed-runner-7', 6, 15, '21KM', 1200.00, 'M', 'approved', 1001, TRUE, NOW(3) - INTERVAL 42 DAY, NOW(3) - INTERVAL 81 DAY),
  ('seed-runner-7', 3, 8, '10KM', 750.00, 'S', 'pending', NULL, FALSE, NULL, NOW(3) - INTERVAL 79 DAY),
  ('seed-runner-8', 6, 14, '10KM', 750.00, 'XXL', 'approved', 1002, TRUE, NOW(3) - INTERVAL 42 DAY, NOW(3) - INTERVAL 70 DAY),
  ('seed-runner-8', 4, 10, '5KM', 400.00, 'L', 'approved', 1002, FALSE, NULL, NOW(3) - INTERVAL 8 DAY),
  ('seed-runner-9', 2, 5, '10KM', 700.00, 'S', 'pending', NULL, FALSE, NULL, NOW(3) - INTERVAL 13 DAY),
  ('seed-runner-9', 1, 3, '10KM', 900.00, 'XL', 'approved', 1002, FALSE, NULL, NOW(3) - INTERVAL 12 DAY),
  ('seed-runner-10', 1, 3, '10KM', 900.00, 'XL', 'approved', 1003, FALSE, NULL, NOW(3) - INTERVAL 32 DAY),
  ('seed-runner-10', 6, 15, '21KM', 1200.00, 'M', 'approved', 1003, TRUE, NOW(3) - INTERVAL 42 DAY, NOW(3) - INTERVAL 68 DAY),
  ('seed-runner-10', 4, 10, '5KM', 400.00, 'XXL', 'rejected', NULL, FALSE, NULL, NOW(3) - INTERVAL 59 DAY),
  ('seed-runner-11', 3, 6, '3KM', 400.00, 'L', 'approved', 1003, FALSE, NULL, NOW(3) - INTERVAL 43 DAY),
  ('seed-runner-11', 1, 2, '5KM', 650.00, 'S', 'pending', NULL, FALSE, NULL, NOW(3) - INTERVAL 20 DAY),
  ('seed-runner-12', 6, 14, '10KM', 750.00, 'S', 'approved', 1004, TRUE, NOW(3) - INTERVAL 42 DAY, NOW(3) - INTERVAL 54 DAY),
  ('seed-runner-13', 3, 7, '5KM', 550.00, 'XL', 'approved', 1004, FALSE, NULL, NOW(3) - INTERVAL 21 DAY),
  ('seed-runner-13', 1, 1, '3KM', 500.00, 'XL', 'approved', 1004, FALSE, NULL, NOW(3) - INTERVAL 64 DAY),
  ('seed-runner-13', 6, 15, '21KM', 1200.00, 'L', 'approved', 1005, TRUE, NOW(3) - INTERVAL 42 DAY, NOW(3) - INTERVAL 59 DAY),
  ('seed-runner-14', 4, 9, '3KM', 300.00, 'XL', 'approved', 1003, FALSE, NULL, NOW(3) - INTERVAL 63 DAY),
  ('seed-runner-15', 1, 2, '5KM', 650.00, 'XL', 'approved', 1005, FALSE, NULL, NOW(3) - INTERVAL 77 DAY),
  ('seed-runner-15', 6, 14, '10KM', 750.00, 'XL', 'approved', 1006, FALSE, NULL, NOW(3) - INTERVAL 67 DAY),
  ('seed-runner-15', 2, 4, '5KM', 550.00, 'XXL', 'approved', 1002, FALSE, NULL, NOW(3) - INTERVAL 29 DAY),
  ('seed-runner-16', 3, 6, '3KM', 400.00, 'S', 'approved', 1005, FALSE, NULL, NOW(3) - INTERVAL 78 DAY),
  ('seed-runner-17', 3, 8, '10KM', 750.00, 'L', 'approved', 1006, FALSE, NULL, NOW(3) - INTERVAL 49 DAY),
  ('seed-runner-17', 1, 2, '5KM', 650.00, 'XL', 'pending', NULL, FALSE, NULL, NOW(3) - INTERVAL 55 DAY),
  ('seed-runner-18', 4, 10, '5KM', 400.00, 'M', 'approved', 1004, FALSE, NULL, NOW(3) - INTERVAL 10 DAY),
  ('seed-runner-19', 2, 4, '5KM', 550.00, 'M', 'approved', 1003, FALSE, NULL, NOW(3) - INTERVAL 59 DAY),
  ('seed-runner-20', 6, 14, '10KM', 750.00, 'M', 'approved', 1007, TRUE, NOW(3) - INTERVAL 42 DAY, NOW(3) - INTERVAL 54 DAY),
  ('seed-runner-20', 4, 9, '3KM', 300.00, 'M', 'approved', 1005, FALSE, NULL, NOW(3) - INTERVAL 13 DAY),
  ('seed-runner-20', 3, 7, '5KM', 550.00, 'L', 'rejected', NULL, FALSE, NULL, NOW(3) - INTERVAL 24 DAY),
  ('seed-runner-21', 3, 6, '3KM', 400.00, 'XL', 'approved', 1007, FALSE, NULL, NOW(3) - INTERVAL 30 DAY);

INSERT INTO payment_proofs (booking_id, file_key, amount, reference_no, status, review_note, reviewed_by, reviewed_at) VALUES
  (5, 'payments/seed/booking-5.jpg', 300.00, 'GC-2005-2026', 'pending', NULL, NULL, NULL),
  (6, 'payments/seed/booking-6.jpg', 750.00, 'GC-2006-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 44 DAY),
  (7, 'payments/seed/booking-7.jpg', 550.00, 'GC-2007-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 28 DAY),
  (8, 'payments/seed/booking-8.jpg', 300.00, 'GC-2008-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 0 DAY),
  (9, 'payments/seed/booking-9.jpg', 1200.00, 'GC-2009-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 80 DAY),
  (10, 'payments/seed/booking-10.jpg', 750.00, 'GC-2010-2026', 'pending', NULL, NULL, NULL),
  (11, 'payments/seed/booking-11.jpg', 750.00, 'GC-2011-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 69 DAY),
  (12, 'payments/seed/booking-12.jpg', 400.00, 'GC-2012-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 7 DAY),
  (13, 'payments/seed/booking-13.jpg', 700.00, 'GC-2013-2026', 'pending', NULL, NULL, NULL),
  (14, 'payments/seed/booking-14.jpg', 900.00, 'GC-2014-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 11 DAY),
  (15, 'payments/seed/booking-15.jpg', 900.00, 'GC-2015-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 31 DAY),
  (16, 'payments/seed/booking-16.jpg', 1200.00, 'GC-2016-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 67 DAY),
  (17, 'payments/seed/booking-17.jpg', 400.00, 'GC-2017-2026', 'rejected', 'Receipt is unreadable, please upload a clearer photo.', 'seed-organizer', NOW(3) - INTERVAL 58 DAY),
  (18, 'payments/seed/booking-18.jpg', 400.00, 'GC-2018-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 42 DAY),
  (19, 'payments/seed/booking-19.jpg', 650.00, 'GC-2019-2026', 'pending', NULL, NULL, NULL),
  (20, 'payments/seed/booking-20.jpg', 750.00, 'GC-2020-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 53 DAY),
  (21, 'payments/seed/booking-21.jpg', 550.00, 'GC-2021-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 20 DAY),
  (22, 'payments/seed/booking-22.jpg', 500.00, 'GC-2022-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 63 DAY),
  (23, 'payments/seed/booking-23.jpg', 1200.00, 'GC-2023-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 58 DAY),
  (24, 'payments/seed/booking-24.jpg', 300.00, 'GC-2024-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 62 DAY),
  (25, 'payments/seed/booking-25.jpg', 650.00, 'GC-2025-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 76 DAY),
  (26, 'payments/seed/booking-26.jpg', 750.00, 'GC-2026-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 66 DAY),
  (27, 'payments/seed/booking-27.jpg', 550.00, 'GC-2027-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 28 DAY),
  (28, 'payments/seed/booking-28.jpg', 400.00, 'GC-2028-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 77 DAY),
  (29, 'payments/seed/booking-29.jpg', 750.00, 'GC-2029-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 48 DAY),
  (30, 'payments/seed/booking-30.jpg', 650.00, 'GC-2030-2026', 'pending', NULL, NULL, NULL),
  (31, 'payments/seed/booking-31.jpg', 400.00, 'GC-2031-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 9 DAY),
  (32, 'payments/seed/booking-32.jpg', 550.00, 'GC-2032-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 58 DAY),
  (33, 'payments/seed/booking-33.jpg', 750.00, 'GC-2033-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 53 DAY),
  (34, 'payments/seed/booking-34.jpg', 300.00, 'GC-2034-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 12 DAY),
  (35, 'payments/seed/booking-35.jpg', 550.00, 'GC-2035-2026', 'rejected', 'Receipt is unreadable, please upload a clearer photo.', 'seed-organizer', NOW(3) - INTERVAL 23 DAY),
  (36, 'payments/seed/booking-36.jpg', 400.00, 'GC-2036-2026', 'approved', NULL, 'seed-organizer', NOW(3) - INTERVAL 29 DAY);

UPDATE events SET requested_by = 'Caloocan City Sports Office' WHERE id = 1;

-- race requests from organizations
INSERT INTO race_requests (organization, contact_name, email, phone, race_title, proposed_date, location, expected_runners, distances, message, status, created_at) VALUES
  ('UE Caloocan Student Council', 'Kyla Fernandez', 'kyla.fernandez@example.com', '09171234567', 'UE Warriors Fun Run', '2027-07-12', 'UE Caloocan campus and 5th Ave', 500, '3K, 5K', 'Fundraiser for the student scholarship fund. We can handle marshals and water stations.', 'pending', NOW(3) - INTERVAL 2 DAY),
  ('Pasig River Rehab Alliance', 'Marco dela Cruz', 'marco@pasigriver.example.org', NULL, 'Run for the River', '2027-08-23', 'Pasig River Esplanade', 1200, '5K, 10K, 21K', 'Awareness run for river cleanup. Looking for help with online registration and payments.', 'pending', NOW(3) - INTERVAL 5 DAY),
  ('Barangay 176 Bagong Silang', 'Rhea Manalo', 'rhea.manalo@example.com', '09181112233', 'Bagong Silang Family Run', '2027-01-30', 'Bagong Silang, Caloocan', 250, '3K', NULL, 'rejected', NOW(3) - INTERVAL 20 DAY);

UPDATE race_requests SET review_note = 'The date clashes with the Caloocan City Run. Send a new request with another date.', reviewed_by = 'seed-organizer', reviewed_at = NOW(3) - INTERVAL 18 DAY WHERE id = 3;
