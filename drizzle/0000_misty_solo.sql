CREATE TYPE "public"."code_language" AS ENUM('javascript', 'typescript', 'jsx', 'tsx', 'sql', 'python', 'bash', 'json', 'html', 'css', 'go', 'rust', 'java', 'php', 'yaml', 'markdown', 'plaintext');--> statement-breakpoint
CREATE TYPE "public"."finding_kind" AS ENUM('issue', 'strength');--> statement-breakpoint
CREATE TYPE "public"."finding_severity" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TYPE "public"."roast_mode" AS ENUM('honest', 'roast');--> statement-breakpoint
CREATE TYPE "public"."roast_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."roast_visibility" AS ENUM('private', 'public', 'hidden');--> statement-breakpoint
CREATE TABLE "roast_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roast_id" uuid NOT NULL,
	"kind" "finding_kind" NOT NULL,
	"severity" "finding_severity" NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer NOT NULL,
	"line_start" integer,
	"line_end" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roast_findings_sort_order_non_negative_check" CHECK ("roast_findings"."sort_order" >= 0),
	CONSTRAINT "roast_findings_line_range_check" CHECK ("roast_findings"."line_end" is null or "roast_findings"."line_start" is null or "roast_findings"."line_end" >= "roast_findings"."line_start")
);
--> statement-breakpoint
CREATE TABLE "roasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_slug" varchar(64) NOT NULL,
	"original_code" text NOT NULL,
	"improved_code" text,
	"language" "code_language" NOT NULL,
	"mode" "roast_mode" DEFAULT 'roast' NOT NULL,
	"status" "roast_status" DEFAULT 'queued' NOT NULL,
	"visibility" "roast_visibility" DEFAULT 'public' NOT NULL,
	"score" numeric(3, 1),
	"verdict_label" text,
	"summary" text,
	"line_count" integer NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	CONSTRAINT "roasts_publicSlug_unique" UNIQUE("public_slug"),
	CONSTRAINT "roasts_score_range_check" CHECK ("roasts"."score" >= 0 and "roasts"."score" <= 10),
	CONSTRAINT "roasts_line_count_positive_check" CHECK ("roasts"."line_count" > 0)
);
--> statement-breakpoint
ALTER TABLE "roast_findings" ADD CONSTRAINT "roast_findings_roast_id_roasts_id_fk" FOREIGN KEY ("roast_id") REFERENCES "public"."roasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roast_findings_lookup_idx" ON "roast_findings" USING btree ("roast_id","sort_order");