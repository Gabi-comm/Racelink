CREATE TABLE `account` (
	`id` varchar(36) NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp(3),
	`refresh_token_expires_at` timestamp(3),
	`scope` text,
	`password` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`event_id` int NOT NULL,
	`distance_id` int,
	`distance_label` varchar(20) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`tshirt_size` enum('XS','S','M','L','XL','XXL','XXXL') NOT NULL,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`bib_number` int,
	`attended` boolean NOT NULL DEFAULT false,
	`checked_in_at` timestamp(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_user_event_uq` UNIQUE(`user_id`,`event_id`),
	CONSTRAINT `bookings_event_bib_uq` UNIQUE(`event_id`,`bib_number`)
);
--> statement-breakpoint
CREATE TABLE `event_distances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int NOT NULL,
	`label` varchar(20) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`slots` int,
	CONSTRAINT `event_distances_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_distances_event_label_uq` UNIQUE(`event_id`,`label`),
	CONSTRAINT `event_distances_price_check` CHECK(`event_distances`.`price` >= 0)
);
--> statement-breakpoint
CREATE TABLE `event_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int NOT NULL,
	`title` varchar(150) NOT NULL,
	`file_key` varchar(255) NOT NULL,
	`uploaded_by` varchar(36),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `event_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_sizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` int NOT NULL,
	`size` enum('XS','S','M','L','XL','XXL','XXXL') NOT NULL,
	CONSTRAINT `event_sizes_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_sizes_event_size_uq` UNIQUE(`event_id`,`size`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(150) NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255) NOT NULL,
	`event_date` date NOT NULL,
	`start_time` time,
	`registration_closes` date,
	`capacity` int,
	`banner_key` varchar(255),
	`status` enum('draft','open','closed','cancelled') NOT NULL DEFAULT 'open',
	`organizer_id` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_capacity_check` CHECK(`events`.`capacity` IS NULL OR `events`.`capacity` > 0)
);
--> statement-breakpoint
CREATE TABLE `payment_proofs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`booking_id` int NOT NULL,
	`file_key` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reference_no` varchar(100),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`review_note` varchar(255),
	`reviewed_by` varchar(36),
	`reviewed_at` timestamp(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_proofs_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_proofs_amount_check` CHECK(`payment_proofs`.`amount` > 0)
);
--> statement-breakpoint
CREATE TABLE `runner_profiles` (
	`user_id` varchar(36) NOT NULL,
	`phone` varchar(30),
	`address` varchar(255),
	`gender` enum('Male','Female','Other'),
	`birthdate` date,
	`emergency_name` varchar(100),
	`emergency_phone` varchar(30),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `runner_profiles_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(36) NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	`impersonated_by` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`role` varchar(20) NOT NULL DEFAULT 'runner',
	`banned` boolean DEFAULT false,
	`ban_reason` text,
	`ban_expires` timestamp(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_distance_id_event_distances_id_fk` FOREIGN KEY (`distance_id`) REFERENCES `event_distances`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_distances` ADD CONSTRAINT `event_distances_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_documents` ADD CONSTRAINT `event_documents_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_documents` ADD CONSTRAINT `event_documents_uploaded_by_user_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_sizes` ADD CONSTRAINT `event_sizes_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_organizer_id_user_id_fk` FOREIGN KEY (`organizer_id`) REFERENCES `user`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_proofs` ADD CONSTRAINT `payment_proofs_booking_id_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_proofs` ADD CONSTRAINT `payment_proofs_reviewed_by_user_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `runner_profiles` ADD CONSTRAINT `runner_profiles_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `bookings_status_idx` ON `bookings` (`status`);--> statement-breakpoint
CREATE INDEX `event_documents_event_idx` ON `event_documents` (`event_id`);--> statement-breakpoint
CREATE INDEX `events_date_idx` ON `events` (`event_date`);--> statement-breakpoint
CREATE INDEX `events_organizer_idx` ON `events` (`organizer_id`);--> statement-breakpoint
CREATE INDEX `payment_proofs_booking_idx` ON `payment_proofs` (`booking_id`);--> statement-breakpoint
CREATE INDEX `payment_proofs_status_idx` ON `payment_proofs` (`status`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);