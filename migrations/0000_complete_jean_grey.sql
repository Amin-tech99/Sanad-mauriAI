CREATE TABLE "approved_terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"arabic_term" text NOT NULL,
	"hassaniya_term" text NOT NULL,
	"context" text,
	"category" text,
	"frequency" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contextual_lexicon" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_word" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instruction_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"task_type" text NOT NULL,
	"instructions" text NOT NULL,
	"output_format" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "platform_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature_key" text NOT NULL,
	"feature_name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"dependencies" text[],
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "platform_features_feature_key_unique" UNIQUE("feature_key")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "style_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"guidelines" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "style_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'translator' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "word_alternative_style_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"alternative_id" integer NOT NULL,
	"style_tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "word_alternatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"lexicon_id" integer NOT NULL,
	"alternative_word" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "word_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"suggested_by" integer NOT NULL,
	"base_word" text NOT NULL,
	"alternative_word" text NOT NULL,
	"style_tag_id" integer NOT NULL,
	"work_item_id" integer,
	"context" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "work_item_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"packet_id" integer,
	"translator_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "work_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"packet_id" integer,
	"source_text" text NOT NULL,
	"target_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"assigned_to" integer,
	"reviewed_by" integer,
	"rejection_reason" text,
	"quality_score" integer,
	"sequence_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"submitted_at" timestamp,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "work_packets" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"template_id" integer,
	"unit_type" text NOT NULL,
	"style_tag_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
ALTER TABLE "instruction_templates" ADD CONSTRAINT "instruction_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_features" ADD CONSTRAINT "platform_features_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_alternative_style_tags" ADD CONSTRAINT "word_alternative_style_tags_alternative_id_word_alternatives_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."word_alternatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_alternative_style_tags" ADD CONSTRAINT "word_alternative_style_tags_style_tag_id_style_tags_id_fk" FOREIGN KEY ("style_tag_id") REFERENCES "public"."style_tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_alternatives" ADD CONSTRAINT "word_alternatives_lexicon_id_contextual_lexicon_id_fk" FOREIGN KEY ("lexicon_id") REFERENCES "public"."contextual_lexicon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_suggestions" ADD CONSTRAINT "word_suggestions_suggested_by_users_id_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_suggestions" ADD CONSTRAINT "word_suggestions_style_tag_id_style_tags_id_fk" FOREIGN KEY ("style_tag_id") REFERENCES "public"."style_tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_suggestions" ADD CONSTRAINT "word_suggestions_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_suggestions" ADD CONSTRAINT "word_suggestions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_assignments" ADD CONSTRAINT "work_item_assignments_packet_id_work_packets_id_fk" FOREIGN KEY ("packet_id") REFERENCES "public"."work_packets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_assignments" ADD CONSTRAINT "work_item_assignments_translator_id_users_id_fk" FOREIGN KEY ("translator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_packet_id_work_packets_id_fk" FOREIGN KEY ("packet_id") REFERENCES "public"."work_packets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_packets" ADD CONSTRAINT "work_packets_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_packets" ADD CONSTRAINT "work_packets_template_id_instruction_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."instruction_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_packets" ADD CONSTRAINT "work_packets_style_tag_id_style_tags_id_fk" FOREIGN KEY ("style_tag_id") REFERENCES "public"."style_tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_packets" ADD CONSTRAINT "work_packets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;