DROP INDEX "cook_events_recipe_idx";--> statement-breakpoint
DROP INDEX "cook_events_user_idx";--> statement-breakpoint
DROP INDEX "household_invites_token_unique";--> statement-breakpoint
DROP INDEX "household_invites_code_unique";--> statement-breakpoint
DROP INDEX "ingredients_household_idx";--> statement-breakpoint
DROP INDEX "ingredients_household_active_idx";--> statement-breakpoint
DROP INDEX "password_reset_tokens_token_unique";--> statement-breakpoint
DROP INDEX "recipe_ingredients_recipe_idx";--> statement-breakpoint
DROP INDEX "recipe_ingredients_ingredient_idx";--> statement-breakpoint
DROP INDEX "recipe_instructions_step_idx";--> statement-breakpoint
DROP INDEX "recipe_instructions_recipe_idx";--> statement-breakpoint
DROP INDEX "recipes_household_idx";--> statement-breakpoint
DROP INDEX "recipes_household_active_idx";--> statement-breakpoint
DROP INDEX "shopping_categories_household_name_idx";--> statement-breakpoint
DROP INDEX "shopping_categories_household_idx";--> statement-breakpoint
DROP INDEX "shopping_list_items_consolidation_idx";--> statement-breakpoint
DROP INDEX "shopping_list_items_household_idx";--> statement-breakpoint
DROP INDEX "user_households_household_idx";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `ingredients` ALTER COLUMN "calories" TO "calories" real;--> statement-breakpoint
CREATE INDEX `cook_events_recipe_idx` ON `cook_events` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `cook_events_user_idx` ON `cook_events` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `household_invites_token_unique` ON `household_invites` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `household_invites_code_unique` ON `household_invites` (`code`);--> statement-breakpoint
CREATE INDEX `ingredients_household_idx` ON `ingredients` (`household_id`);--> statement-breakpoint
CREATE INDEX `ingredients_household_active_idx` ON `ingredients` (`household_id`,`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_unique` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `recipe_ingredients_recipe_idx` ON `recipe_ingredients` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_ingredients_ingredient_idx` ON `recipe_ingredients` (`ingredient_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `recipe_instructions_step_idx` ON `recipe_instructions` (`recipe_id`,`step_number`);--> statement-breakpoint
CREATE INDEX `recipe_instructions_recipe_idx` ON `recipe_instructions` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipes_household_idx` ON `recipes` (`household_id`);--> statement-breakpoint
CREATE INDEX `recipes_household_active_idx` ON `recipes` (`household_id`,`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `shopping_categories_household_name_idx` ON `shopping_categories` (`household_id`,`name`);--> statement-breakpoint
CREATE INDEX `shopping_categories_household_idx` ON `shopping_categories` (`household_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `shopping_list_items_consolidation_idx` ON `shopping_list_items` (`household_id`,`ingredient_id`,`unit`);--> statement-breakpoint
CREATE INDEX `shopping_list_items_household_idx` ON `shopping_list_items` (`household_id`);--> statement-breakpoint
CREATE INDEX `user_households_household_idx` ON `user_households` (`household_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `ingredients` ALTER COLUMN "protein" TO "protein" real;--> statement-breakpoint
ALTER TABLE `ingredients` ALTER COLUMN "carbs" TO "carbs" real;--> statement-breakpoint
ALTER TABLE `ingredients` ALTER COLUMN "fat" TO "fat" real;