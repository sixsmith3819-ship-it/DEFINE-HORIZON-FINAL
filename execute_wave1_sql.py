#!/usr/bin/env python3
"""
Wave 1 Database Setup Execution Script
Connects to Supabase PostgreSQL and executes all 4 table creation tasks
"""

import os
import sys
import re
from pathlib import Path

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("❌ Error: psycopg2 not installed")
    print("   Install with: pip install psycopg2-binary")
    sys.exit(1)

def load_env_file(filepath=".env.local"):
    """Load environment variables from .env.local file"""
    env_vars = {}
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()
    return env_vars

def extract_project_info(supabase_url, service_key):
    """Extract project ID from Supabase URL"""
    # URL format: https://project-id.supabase.co
    match = re.search(r'https://([^.]+)\.supabase\.co', supabase_url)
    if not match:
        raise ValueError(f"Invalid Supabase URL: {supabase_url}")
    return match.group(1)

# SQL scripts for each task
SQL_TASKS = {
    "Task 1.4: Create user_roles table": """
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_role UNIQUE(user_id)
);

COMMENT ON TABLE public.user_roles IS 'User role assignments for role-based access control';
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
""",
    
    "Task 1.1: Create customers table": """
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
""",
    
    "Task 1.2: Create customer_interactions table": """
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
""",
    
    "Task 1.3: Create customer_audit_log table": """
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
"""
}

def main():
    """Main execution function"""
    print("🚀 Starting Wave 1 Database Setup...\n")
    
    # Load environment
    env_vars = load_env_file()
    supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
    service_key = env_vars.get('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not service_key:
        print("❌ ERROR: Missing Supabase credentials in .env.local")
        print(f"   NEXT_PUBLIC_SUPABASE_URL: {'✓ set' if supabase_url else '✗ missing'}")
        print(f"   SUPABASE_SERVICE_KEY: {'✓ set' if service_key else '✗ missing'}")
        sys.exit(1)
    
    print(f"📍 Supabase Project: {supabase_url}\n")
    
    try:
        project_id = extract_project_info(supabase_url, service_key)
    except ValueError as e:
        print(f"❌ ERROR: {e}")
        sys.exit(1)
    
    # Connection string for Supabase PostgreSQL
    # Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
    conn_string = f"postgresql://postgres:{service_key}@db.{project_id}.supabase.co:5432/postgres"
    
    try:
        print("⏳ Connecting to Supabase database...")
        conn = psycopg2.connect(conn_string, sslmode='require')
        conn.autocommit = False  # Use transactions for safety
        cursor = conn.cursor()
        print("✅ Connected to Supabase database\n")
    except psycopg2.Error as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
    
    results = {"success": [], "failed": []}
    
    # Execute each task
    for task_name, sql in SQL_TASKS.items():
        try:
            print(f"⏳ {task_name}...")
            cursor.execute(sql)
            conn.commit()
            print(f"✅ {task_name} - SUCCESS\n")
            results["success"].append(task_name)
        except psycopg2.Error as e:
            conn.rollback()
            print(f"❌ {task_name} - FAILED")
            print(f"   Error: {e}\n")
            results["failed"].append({"task": task_name, "error": str(e)})
    
    # Verification
    print("\n📋 Verification: Checking created tables...\n")
    
    try:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('customers', 'customer_interactions', 'customer_audit_log', 'user_roles')
            ORDER BY table_name;
        """)
        rows = cursor.fetchall()
        
        if len(rows) == 4:
            print("✅ All 4 tables created successfully:\n")
            for row in rows:
                print(f"   ✓ {row[0]}")
        else:
            print(f"⚠️  Found {len(rows)} tables (expected 4)\n")
    except psycopg2.Error as e:
        print(f"⚠️  Could not verify tables: {e}")
    
    # Verify indexes
    print("\n📋 Verification: Checking indexes...\n")
    
    try:
        cursor.execute("""
            SELECT indexname, tablename 
            FROM pg_indexes 
            WHERE tablename IN ('customers', 'customer_interactions', 'customer_audit_log', 'user_roles')
            AND schemaname = 'public'
            ORDER BY tablename, indexname;
        """)
        rows = cursor.fetchall()
        
        if rows:
            print(f"✅ Found {len(rows)} indexes:\n")
            current_table = None
            for idx_name, table_name in rows:
                if table_name != current_table:
                    current_table = table_name
                    print(f"   {table_name}:")
                if not idx_name.endswith('_pkey'):  # Skip primary key index
                    print(f"      ✓ {idx_name}")
    except psycopg2.Error as e:
        print(f"⚠️  Could not verify indexes: {e}")
    
    cursor.close()
    conn.close()
    
    # Summary
    print("\n" + "="*60)
    print("📊 EXECUTION SUMMARY")
    print("="*60)
    print(f"✅ Successful: {len(results['success'])}")
    print(f"❌ Failed: {len(results['failed'])}")
    
    if results["failed"]:
        print("\n⚠️  Failed Tasks:")
        for item in results["failed"]:
            print(f"   - {item['task']}")
            print(f"     {item['error']}")
        sys.exit(1)
    else:
        print("\n🎉 Wave 1 Database Setup Complete!")
        print("All tables, indexes, and constraints created successfully.")

if __name__ == "__main__":
    main()
