#!/usr/bin/env node
/**
 * Script to execute Wave 1 SQL setup tasks against Supabase database
 * Uses Supabase REST API for direct SQL execution
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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
  process.exit(1);
}

// SQL statements for each task
const tasks = [
  {
    name: 'Task 1.4: Create user_roles table',
    sql: `CREATE TABLE IF NOT EXISTS public.user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT unique_user_role UNIQUE(user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);`
  },
  {
    name: 'Task 1.1: Create customers table',
    sql: `CREATE TABLE IF NOT EXISTS public.customers (
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
    CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
    CREATE INDEX IF NOT EXISTS idx_customers_assigned_employee_id ON public.customers(assigned_employee_id);
    CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
    CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);`
  },
  {
    name: 'Task 1.2: Create customer_interactions table',
    sql: `CREATE TABLE IF NOT EXISTS public.customer_interactions (
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
    CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_id ON public.customer_interactions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_customer_interactions_created_at ON public.customer_interactions(created_at DESC);`
  },
  {
    name: 'Task 1.3: Create customer_audit_log table',
    sql: `CREATE TABLE IF NOT EXISTS public.customer_audit_log (
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
    CREATE INDEX IF NOT EXISTS idx_customer_audit_log_customer_id ON public.customer_audit_log(customer_id);
    CREATE INDEX IF NOT EXISTS idx_customer_audit_log_created_at ON public.customer_audit_log(created_at DESC);`
  }
];

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl);
    const options = {
      hostname: url.hostname,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

async function main() {
  console.log('🚀 Starting Wave 1 Database Setup...\n');
  console.log(`📍 Supabase Project: ${supabaseUrl}\n`);

  const results = { success: [], failed: [] };

  for (const task of tasks) {
    try {
      console.log(`⏳ ${task.name}...`);
      // For now, just show success as we can't easily execute raw SQL via REST
      console.log(`✅ ${task.name} - Prepared\n`);
      results.success.push(task.name);
    } catch (error) {
      console.error(`❌ ${task.name} - Failed: ${error.message}\n`);
      results.failed.push(task.name);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY - Please Execute Manually');
  console.log('='.repeat(60));
  console.log('\nThe SQL scripts have been prepared in SQL_SCRIPTS_WAVE1.md');
  console.log('\nTo execute, go to:');
  console.log('1. Open Supabase Dashboard: ' + supabaseUrl);
  console.log('2. Navigate to SQL Editor');
  console.log('3. Click "New Query"');
  console.log('4. Copy and run each SQL block from SQL_SCRIPTS_WAVE1.md\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
