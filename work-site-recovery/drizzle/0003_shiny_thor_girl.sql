CREATE TABLE `anonymous_responses` (
	`session` text NOT NULL,
	`round` integer NOT NULL,
	`receipt` text NOT NULL,
	`answer` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session`, `round`, `receipt`)
);
--> statement-breakpoint
CREATE TABLE `audits` (
	`id` text PRIMARY KEY NOT NULL,
	`session` text,
	`owner` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`payload` text NOT NULL,
	`kind` text NOT NULL,
	`visibility` text NOT NULL,
	`version` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`session` text NOT NULL,
	`id` text NOT NULL,
	`player` text NOT NULL,
	`round` integer NOT NULL,
	`kind` text NOT NULL,
	`points` integer NOT NULL,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session`, `id`)
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`session` text NOT NULL,
	`round` integer NOT NULL,
	`actor` text NOT NULL,
	`data` text NOT NULL,
	`version` integer NOT NULL,
	PRIMARY KEY(`session`, `round`, `actor`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trainer_profiles` (
	`uid` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`enabled` integer NOT NULL,
	`report_owners` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `players` ADD `approval` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `language` text DEFAULT 'ar' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `settings` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `blueprint` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `runtime` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `anonymous_secret` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `survey` text;