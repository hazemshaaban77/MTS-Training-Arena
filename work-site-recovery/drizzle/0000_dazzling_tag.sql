CREATE TABLE `answers` (
	`session` text NOT NULL,
	`round` integer NOT NULL,
	`player` text NOT NULL,
	`answer` text NOT NULL,
	`points` integer NOT NULL,
	`correct` integer,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session`, `round`, `player`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`session` text NOT NULL,
	`id` text NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`team` text,
	`eligible_from` integer NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`session`, `id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`code` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`language` text NOT NULL,
	`teams` integer NOT NULL,
	`activities` text NOT NULL,
	`status` text NOT NULL,
	`current` integer NOT NULL,
	`revision` integer NOT NULL,
	`started_at` integer,
	`deadline` integer,
	`paused` integer NOT NULL,
	`remaining` integer NOT NULL,
	`reveal` integer,
	`created_at` integer NOT NULL
);
