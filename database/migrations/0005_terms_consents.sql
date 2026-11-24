CREATE TABLE `terms_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`version` varchar(20) NOT NULL,
	`accepted_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `terms_consents_id` PRIMARY KEY(`id`),
	CONSTRAINT `terms_consents_user_version_uq` UNIQUE(`user_id`,`version`)
);
--> statement-breakpoint
ALTER TABLE `terms_consents` ADD CONSTRAINT `terms_consents_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;