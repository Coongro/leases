CREATE TABLE "module_leases_guarantees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lease_id" uuid NOT NULL,
	"type" text NOT NULL,
	"guarantor_contact_id" uuid,
	"amount" numeric,
	"deposit_date" text,
	"bank_account" text,
	"insurance_company" text,
	"policy_number" text,
	"insurance_expiry" text,
	"property_deed_ref" text,
	"archived" boolean,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "module_leases_lease_tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lease_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"role" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "module_leases_leases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"tenant_contact_id" uuid NOT NULL,
	"status" text NOT NULL,
	"contract_type" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"termination_date" text,
	"rent_amount" numeric NOT NULL,
	"expenses_amount" numeric,
	"currency" text NOT NULL,
	"due_day" integer NOT NULL,
	"due_day_type" text NOT NULL,
	"adjustment_index" text,
	"adjustment_months" integer,
	"penalty_months" integer,
	"admin_fee_percent" numeric,
	"late_fee_percent" numeric,
	"deposit_amount" numeric,
	"deposit_status" text,
	"renewed_from_lease_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "idx_leases_unit" ON "module_leases_leases" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_leases_tenant" ON "module_leases_leases" USING btree ("tenant_contact_id");--> statement-breakpoint
CREATE INDEX "idx_leases_end_date" ON "module_leases_leases" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_leases_status" ON "module_leases_leases" USING btree ("status");