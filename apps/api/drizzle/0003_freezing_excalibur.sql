CREATE TABLE `queued_cook_ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`queued_cook_id` integer NOT NULL,
	`ingredient_id` integer NOT NULL,
	`unit` text NOT NULL,
	`base_quantity` real NOT NULL,
	`required_quantity` real NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`queued_cook_id`) REFERENCES `queued_cooks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `queued_cook_ingredients_unique_idx` ON `queued_cook_ingredients` (`queued_cook_id`,`ingredient_id`,`unit`);--> statement-breakpoint
CREATE INDEX `queued_cook_ingredients_queued_cook_idx` ON `queued_cook_ingredients` (`queued_cook_id`);--> statement-breakpoint
CREATE INDEX `queued_cook_ingredients_ingredient_idx` ON `queued_cook_ingredients` (`ingredient_id`);--> statement-breakpoint
CREATE TABLE `queued_cooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`household_id` integer NOT NULL,
	`recipe_id` integer NOT NULL,
	`created_by` integer NOT NULL,
	`recipe_batch_size_snapshot` integer NOT NULL,
	`selected_batch_size` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `queued_cooks_household_idx` ON `queued_cooks` (`household_id`);--> statement-breakpoint
CREATE INDEX `queued_cooks_recipe_idx` ON `queued_cooks` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `queued_cooks_created_by_idx` ON `queued_cooks` (`created_by`);