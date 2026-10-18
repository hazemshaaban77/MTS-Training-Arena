ALTER TABLE `players` ADD `employee_key` text;--> statement-breakpoint
ALTER TABLE `players` ADD `employee_id` text;--> statement-breakpoint
ALTER TABLE `players` ADD `recovery_hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `players_session_employee` ON `players` (`session`,`employee_key`);