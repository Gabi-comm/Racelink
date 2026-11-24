CREATE TABLE `refund_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`booking_id` int NOT NULL,
	`reason` varchar(500) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('requested','processed') NOT NULL DEFAULT 'requested',
	`processed_by` varchar(36),
	`processed_at` timestamp(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `refund_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `refund_requests` ADD CONSTRAINT `refund_requests_booking_id_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refund_requests` ADD CONSTRAINT `refund_requests_processed_by_user_id_fk` FOREIGN KEY (`processed_by`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `refund_requests_booking_idx` ON `refund_requests` (`booking_id`);--> statement-breakpoint
CREATE INDEX `refund_requests_status_idx` ON `refund_requests` (`status`);