CREATE TABLE "module_leases_notice_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lease_id" uuid NOT NULL,
	"type" text NOT NULL,
	"channel" text NOT NULL,
	"sent_to" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"content_snapshot" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_notice_logs_lease" ON "module_leases_notice_logs" USING btree ("lease_id","sent_at");