CREATE TABLE "module_leases_expiry_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"subtype" text NOT NULL,
	"level" text NOT NULL,
	"expires_at" text NOT NULL,
	"label" text NOT NULL,
	"message" text NOT NULL,
	"building_id" uuid,
	"unit_id" uuid,
	"lease_id" uuid,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_leases_expiry_alerts_subject" ON "module_leases_expiry_alerts" USING btree ("kind","subject_id");--> statement-breakpoint
CREATE INDEX "idx_leases_expiry_alerts_expires" ON "module_leases_expiry_alerts" USING btree ("expires_at");