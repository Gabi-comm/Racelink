ALTER TABLE `events` ADD `payment_method` enum('gcash','bank');--> statement-breakpoint
ALTER TABLE `events` ADD `payment_bank` varchar(100);--> statement-breakpoint
ALTER TABLE `events` ADD `payment_account_name` varchar(150);--> statement-breakpoint
ALTER TABLE `events` ADD `payment_account_number` varchar(50);