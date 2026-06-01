CREATE TABLE `recipe_tag_assignments` (
	`recipe_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`recipe_id`, `tag_id`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `recipe_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipe_tag_assignments_tag_idx` ON `recipe_tag_assignments` (`tag_id`);--> statement-breakpoint
CREATE TABLE `recipe_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`household_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipe_tags_household_name_idx` ON `recipe_tags` (`household_id`,`name`);--> statement-breakpoint
CREATE INDEX `recipe_tags_household_idx` ON `recipe_tags` (`household_id`);--> statement-breakpoint
ALTER TABLE `recipes` ADD `source` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `prep_time` integer;--> statement-breakpoint
ALTER TABLE `recipes` ADD `cook_time` integer;