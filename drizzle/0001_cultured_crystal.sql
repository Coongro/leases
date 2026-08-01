CREATE TABLE "module_leases_index_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lease_id" uuid NOT NULL,
	"index_code" text NOT NULL,
	"status" text NOT NULL,
	"effective_date" text NOT NULL,
	"base_date" text,
	"index_value_from" numeric,
	"index_value_to" numeric,
	"rate_percent" numeric,
	"previous_rent" numeric NOT NULL,
	"new_rent" numeric NOT NULL,
	"applied_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_adjustments_lease" ON "module_leases_index_adjustments" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "idx_adjustments_status" ON "module_leases_index_adjustments" USING btree ("status");