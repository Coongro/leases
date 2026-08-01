CREATE TABLE "module_leases_lease_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lease_id" uuid NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"amount" numeric NOT NULL,
	"sign" numeric DEFAULT '1' NOT NULL,
	"valid_from" text,
	"valid_to" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "idx_lease_charges_lease" ON "module_leases_lease_charges" USING btree ("lease_id");