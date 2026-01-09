CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "dish_votes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dish_votes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"dish_name" varchar(255) NOT NULL,
	"liked" integer NOT NULL,
	"context" varchar(50) DEFAULT 'meal_plan' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_link_tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "magic_link_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token" varchar(64) NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" text,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "magic_link_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "meal_plans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"week_start_date" varchar(10) NOT NULL,
	"meals" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_votes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "meal_votes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"meal_plan_id" integer NOT NULL,
	"meal_day" varchar(10) NOT NULL,
	"user_id" integer NOT NULL,
	"voter_name" varchar(100),
	"vote_type" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_preferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"family_name" varchar(100),
	"family_size" integer DEFAULT 2 NOT NULL,
	"cuisines" text,
	"flavors" text,
	"dietary_restrictions" text,
	"country" varchar(3) DEFAULT 'UAE',
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"units" varchar(10) DEFAULT 'metric' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"meat_frequency" integer DEFAULT 3 NOT NULL,
	"chicken_frequency" integer DEFAULT 3 NOT NULL,
	"fish_frequency" integer DEFAULT 3 NOT NULL,
	"vegetarian_frequency" integer DEFAULT 2 NOT NULL,
	"vegan_frequency" integer DEFAULT 1 NOT NULL,
	"spicy_frequency" integer DEFAULT 2 NOT NULL,
	"kid_friendly_frequency" integer DEFAULT 2 NOT NULL,
	"healthy_frequency" integer DEFAULT 3 NOT NULL,
	"taste_profile" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
