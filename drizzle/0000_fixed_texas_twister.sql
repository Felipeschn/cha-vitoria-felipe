CREATE TABLE `gift_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`reserved_at` text,
	`claim_token_hash` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gift_items_name_unique` ON `gift_items` (`name`);
--> statement-breakpoint
INSERT INTO `gift_items` (`name`, `sort_order`) VALUES ('Batedeira', 1);
--> statement-breakpoint
INSERT INTO `gift_items` (`name`, `sort_order`) VALUES ('Torradeira', 2);
--> statement-breakpoint
INSERT INTO `gift_items` (`name`, `sort_order`) VALUES ('Liquidificador', 3);
--> statement-breakpoint
INSERT INTO `gift_items` (`name`, `sort_order`) VALUES ('Cafeteira', 4);
