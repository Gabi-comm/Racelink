CREATE TABLE `race_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization` varchar(150) NOT NULL,
	`contact_name` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(30),
	`race_title` varchar(150) NOT NULL,
	`proposed_date` date NOT NULL,
	`location` varchar(255) NOT NULL,
	`expected_runners` int,
	`distances` varchar(150),
	`message` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`review_note` varchar(255),
	`reviewed_by` varchar(36),
	`reviewed_at` timestamp(3),
	`event_id` int,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `race_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `events` ADD `requested_by` varchar(150);--> statement-breakpoint
ALTER TABLE `events` ADD `request_id` int;--> statement-breakpoint
ALTER TABLE `race_requests` ADD CONSTRAINT `race_requests_reviewed_by_user_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `race_requests` ADD CONSTRAINT `race_requests_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `race_requests_status_idx` ON `race_requests` (`status`);--> statement-breakpoint
CREATE INDEX `race_requests_created_idx` ON `race_requests` (`created_at`);