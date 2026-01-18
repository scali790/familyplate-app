CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"family_id" uuid,
	"event_name" varchar(255) NOT NULL,
	"properties" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"env" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "kpi_daily_snapshot" (
	"day" date PRIMARY KEY NOT NULL,
	"kpi_key" varchar(255) PRIMARY KEY NOT NULL,
	"value" numeric NOT NULL,
	"breakdown" jsonb
);
