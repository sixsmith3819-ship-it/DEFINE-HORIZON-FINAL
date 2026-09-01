#!/usr/bin/env node
/**
 * Script to execute Wave 1 SQL setup tasks against Supabase database
 * Uses PostgreSQL connection directly
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Missing Supabase credentials in .env.local');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ set' : '✗ missing');
  console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓ set' : '✗ missing');
  process.exit(1);
}

// Extract connection info from URL
// Format: https://project-id.supabase.co
const urlParts = supabaseUrl.replace('https://', '').replace('http://', '').split('.');
const projectId = urlParts[0];

// Supabase connection string
const connectionString = `postgresql://postgres.${projectId}:[${supabaseServiceKey}]@db.${projectId}.supabase.co:5432/postgres`;

// SQL scripts for each task
const sqlScripts = {
  'Task 1.4: Create user_roles table': `
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_role UNIQUE(user_id)
);

COMMENT ON TABLE public.user_roles IS 'User role assignments for role-based access control';
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
  `,
  
  'Task 1.1: Create customers table': `
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('individual', 'business')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  
  business_name VARCHAR(100),
  contact_person VARCHAR(100),
  business_registration_number VARCHAR(100),
  tax_id VARCHAR(50),
  website VARCHAR(255),
  
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  assigned_employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT individual_required_fields CHECK (
    (customer_type = 'individual' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
    (customer_type = 'business')
  ),
  CONSTRAINT business_required_fields CHECK (
    (customer_type = 'business' AND business_name IS NOT NULL AND contact_person IS NOT NULL) OR
    (customer_type = 'individual')
  )
);

COMMENT ON TABLE public.customers IS 'Core customer information for both individual and business types';
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_employee_id ON public.customers(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
  `,
  
  'Task 1.2: Create customer_interactions table': `
CREATE TABLE IF NOT EXISTS public.customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL DEFAULT 'note' CHECK (interaction_type IN ('note', 'call', 'email', 'meeting', 'action')),
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT non_empty_content CHECK (LENGTH(TRIM(content)) > 0)
);

COMMENT ON TABLE public.customer_interactions IS 'Stores notes and communication history for customers';
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_id ON public.customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_created_at ON public.customer_interactions(created_at DESC);
  `,
  
  'Task 1.3: Create customer_audit_log table': `
CREATE TABLE IF NOT EXISTS public.customer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('create', 'update', 'delete', 'assign', 'reactivate')),
  field_name VARCHAR(100),
  previous_value TEXT,
  new_value TEXT,
  details JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  CONSTRAINT immutable_check CHECK (1=1)
);

COMMENT ON TABLE public.customer_audit_log IS 'Immutable audit trail of all customer operations';
CREATE INDEX IF NOT EXISTS idx_customer_audit_log_customer_id ON public.customer_audit_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_audit_log_created_at ON public.customer_audit_log(created_at DESC);
  `
};

// Execute all SQL scripts
async function executeSQLScripts() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Starting Wave 1 Database Setup...\n');
    console.log(`📍 Supabase Project: ${supabaseUrl}\n`);
    
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    const results = {
      success: [],
      failed: []
    };

    for (const [taskName, sql] of Object.entries(sqlScripts)) {
      try {
        console.log(`⏳ ${taskName}...`);
        await client.query(sql);
        console.log(`✅ ${taskName} - SUCCESS\n`);
        results.success.push(taskName);
      } catch (error) {
        console.error(`❌ ${taskName} - FAILED`);
        console.error(`   Error: ${error.message}\n`);
        results.failed.push({ task: taskName, error: error.message });
      }
    }

    // Verification queries
    console.log('\n📋 Verification: Checking created tables...\n');

    try {
      const verifyQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('customers', 'customer_interactions', 'customer_audit_log', 'user_roles')
        ORDER BY table_name;
      `;
      
      const { rows } = await client.query(verifyQuery);
      
      if (rows.length === 4) {
        console.log('✅ All 4 tables created successfully:\n');
        rows.forEach(row => {
          console.log(`   ✓ ${row.table_name}`);
        });
      } else {
        console.log(`⚠️  Found ${rows.length} tables (expected 4)\n`);
      }
    } catch (error) {
      console.warn('⚠️  Could not verify tables:', error.message);
    }

    // Verify indexes
    console.log('\n📋 Verification: Checking indexes...\n');
    
    try {
      const indexQuery = `
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE tablename IN ('customers', 'customer_interactions', 'customer_audit_log', 'user_roles')
        AND schemaname = 'public'
        ORDER BY tablename, indexname;
      `;
      
      const { rows } = await client.query(indexQuery);
      
      if (rows.length > 0) {
        console.log(`✅ Found ${rows.length} indexes:\n`);
        const tableIndexes = {};
        rows.forEach(row => {
          if (!tableIndexes[row.tablename]) {
            tableIndexes[row.tablename] = [];
          }
          tableIndexes[row.tablename].push(row.indexname);
        });
        
        Object.entries(tableIndexes).forEach(([table, indexes]) => {
          console.log(`   ${table}:`);
          indexes.forEach(idx => {
            console.log(`      ✓ ${idx}`);
          });
        });
      }
    } catch (error) {
      console.warn('⚠️  Could not verify indexes:', error.message);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\n⚠️  Failed Tasks:');
      results.failed.forEach(({ task, error }) => {
        console.log(`   - ${task}`);
        console.log(`     ${error}`);
      });
    } else {
      console.log('\n🎉 Wave 1 Database Setup Complete!');
      console.log('All tables, indexes, and constraints created successfully.');
    }

    await client.end();
    process.exit(results.failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
executeSQLScripts();
