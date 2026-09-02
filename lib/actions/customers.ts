'use server';

import { createServerClient } from '@/lib/supabase-server';
import {
  Customer,
  CustomerDetail,
  CustomerFilters,
  CustomerFormData,
  SortField,
  PaginatedCustomers,
  CustomerInteraction,
  CustomerType,
  ValidationErrors,
  OperationType,
} from '@/lib/types/customer';

/**
 * Fetch a paginated list of customers with search, filters, and sorting
 * Applies role-based filtering (employees only see assigned customers)
 */
export async function getCustomers(
  page: number = 1,
  pageSize: number = 25,
  searchTerm?: string,
  filters?: CustomerFilters,
  sortBy?: SortField
): Promise<PaginatedCustomers & { success?: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        customers: [],
        totalCount: 0,
        pageSize,
        currentPage: page,
        totalPages: 0,
        success: false,
        error: 'Unauthorized',
      };
    }

    // Get user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabase.from('customers').select('*', { count: 'exact' });

    // Apply role-based filtering
    if (profile?.role === 'employee') {
      query = query.eq('assigned_employee_id', user.id);
    }

    // Apply search term filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      query = query.or(
        `customer_name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,phone_number.ilike.%${searchLower}%,id_number.ilike.%${searchLower}%`
      );
    }

    // Apply status filter
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    // Apply customer type filter
    if (filters?.customerType) {
      query = query.eq('customer_type', filters.customerType);
    }

    // Apply date range filters
    if (filters?.createdAfter) {
      query = query.gte('created_at', filters.createdAfter);
    }
    if (filters?.createdBefore) {
      query = query.lte('created_at', filters.createdBefore);
    }

    // Apply sorting
    let orderByColumn = 'created_at';
    let orderDirection: 'asc' | 'desc' = 'desc';

    if (sortBy) {
      switch (sortBy.field) {
        case 'name':
          orderByColumn = 'customer_name';
          break;
        case 'email':
          orderByColumn = 'email';
          break;
        case 'createdAt':
          orderByColumn = 'created_at';
          break;
        case 'status':
          orderByColumn = 'status';
          break;
        default:
          orderByColumn = 'created_at';
      }
      orderDirection = sortBy.direction;
    }

    query = query.order(orderByColumn, { ascending: orderDirection === 'asc' });

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return {
        customers: [],
        totalCount: 0,
        pageSize,
        currentPage: page,
        totalPages: 0,
        success: false,
        error: error.message,
      };
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      customers: (data || []).map(transformCustomerData) as Customer[],
      totalCount: count || 0,
      pageSize,
      currentPage: page,
      totalPages,
      success: true,
    };
  } catch (error) {
    console.error('Error in getCustomers:', error);
    return {
      customers: [],
      totalCount: 0,
      pageSize,
      currentPage: page,
      totalPages: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch full customer details including interactions
 */
export async function getCustomerDetail(
  customerId: string
): Promise<{ success: boolean; customer?: CustomerDetail; interactions?: CustomerInteraction[]; error?: string; statusCode?: number }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized', statusCode: 401 };
    }

    // Get customer to check permissions
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return { success: false, error: 'Customer not found', statusCode: 404 };
    }

    // Check if user can view this customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Employees can only view assigned customers
    if (profile?.role === 'employee' && customer.assigned_employee_id !== user.id) {
      return { success: false, error: 'Permission denied', statusCode: 403 };
    }

    // Fetch interactions
    const { data: interactions } = await supabase
      .from('customer_interactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    const customerDetail: CustomerDetail = {
      ...transformCustomerData(customer),
      interactions: (interactions || []).map(transformInteractionData),
      auditLog: [], // Audit log removed as table doesn't exist in fresh DB
    };

    return {
      success: true,
      customer: customerDetail,
      interactions: customerDetail.interactions,
    };
  } catch (error) {
    console.error('Error in getCustomerDetail:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', statusCode: 500 };
  }
}

/**
 * Transform database customer record from snake_case to camelCase
 */
function transformCustomerData(dbCustomer: any): Customer {
  return {
    id: dbCustomer.id,
    customerType: dbCustomer.customer_type,
    customerName: dbCustomer.customer_name,
    status: dbCustomer.status,
    email: dbCustomer.email,
    phoneNumber: dbCustomer.phone_number,
    idNumber: dbCustomer.id_number,
    address: dbCustomer.address,
    assignedEmployeeId: dbCustomer.assigned_employee_id,
    notes: dbCustomer.notes,
    createdAt: dbCustomer.created_at,
    createdBy: dbCustomer.created_by,
    updatedAt: dbCustomer.updated_at,
    updatedBy: dbCustomer.updated_by,
  };
}

/**
 * Transform database interaction record from snake_case to camelCase
 */
function transformInteractionData(dbInteraction: any): CustomerInteraction {
  return {
    id: dbInteraction.id,
    customerId: dbInteraction.customer_id,
    interactionType: dbInteraction.interaction_type,
    notes: dbInteraction.notes,
    createdAt: dbInteraction.created_at,
    createdBy: dbInteraction.created_by,
  };
}

/**
 * Create a new customer
 */
export async function createCustomer(
  data: CustomerFormData
): Promise<{ success: boolean; customerId?: string; error?: string; validationErrors?: ValidationErrors }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Permission denied' };
    }

    // Validate input
    if (!data.customerName || data.customerName.trim() === '') {
      return { success: false, validationErrors: { customerName: 'Customer name is required' } };
    }
    if (!data.phoneNumber || data.phoneNumber.trim() === '') {
      return { success: false, validationErrors: { phoneNumber: 'Phone number is required' } };
    }

    // Create customer
    const customerData = {
      customer_type: data.customerType,
      customer_name: data.customerName,
      status: 'active',
      email: data.email || null,
      phone_number: data.phoneNumber,
      id_number: data.idNumber || null,
      address: data.address || null,
      notes: data.notes || null,
      created_by: user.id,
      updated_by: user.id,
    };

    const { data: createdCustomer, error: createError } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (createError || !createdCustomer) {
      return { success: false, error: createError?.message || 'Failed to create customer' };
    }

    return { success: true, customerId: createdCustomer.id };
  } catch (error) {
    console.error('Error in createCustomer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  customerId: string,
  updates: Partial<CustomerFormData>
): Promise<{ success: boolean; error?: string; validationErrors?: ValidationErrors }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Permission denied' };
    }

    // Get current customer
    const { data: currentCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (fetchError || !currentCustomer) {
      return { success: false, error: 'Customer not found' };
    }

    // Prepare update data
    const updateData: Record<string, any> = { updated_by: user.id };

    if (updates.customerName !== undefined) {
      updateData.customer_name = updates.customerName;
    }
    if (updates.email !== undefined) {
      updateData.email = updates.email || null;
    }
    if (updates.phoneNumber !== undefined) {
      updateData.phone_number = updates.phoneNumber;
    }
    if (updates.idNumber !== undefined) {
      updateData.id_number = updates.idNumber || null;
    }
    if (updates.address !== undefined) {
      updateData.address = updates.address || null;
    }
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes || null;
    }

    // Update customer
    const { error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Soft delete a customer (mark as inactive)
 */
export async function softDeleteCustomer(
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Permission denied' };
    }

    // Update status to inactive
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        status: 'inactive',
        updated_by: user.id,
      })
      .eq('id', customerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in softDeleteCustomer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Reactivate a customer (mark as active)
 */
export async function reactivateCustomer(
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Permission denied' };
    }

    // Update status to active
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        status: 'active',
        updated_by: user.id,
      })
      .eq('id', customerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in reactivateCustomer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Add a note to a customer's interaction history
 */
export async function addCustomerNote(
  customerId: string,
  notes: string,
  interactionType: string = 'note'
): Promise<{ success: boolean; interactionId?: string; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate content
    if (!notes || !notes.trim()) {
      return { success: false, error: 'Note content cannot be empty' };
    }

    // Get customer to check assignment
    const { data: customer } = await supabase
      .from('customers')
      .select('assigned_employee_id')
      .eq('id', customerId)
      .single();

    // Check authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'employee' && customer?.assigned_employee_id !== user.id) {
      return { success: false, error: 'Permission denied' };
    }

    // Create interaction
    const { data: interaction, error: createError } = await supabase
      .from('customer_interactions')
      .insert({
        customer_id: customerId,
        interaction_type: interactionType,
        notes: notes.trim(),
        created_by: user.id,
      })
      .select()
      .single();

    if (createError || !interaction) {
      return { success: false, error: createError?.message || 'Failed to create note' };
    }

    return { success: true, interactionId: interaction.id };
  } catch (error) {
    console.error('Error in addCustomerNote:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Assign a customer to an employee
 */
export async function assignCustomerToEmployee(
  customerId: string,
  employeeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Permission denied' };
    }

    // Update assignment
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        assigned_employee_id: employeeId,
        updated_by: user.id,
      })
      .eq('id', customerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in assignCustomerToEmployee:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get status counts for all customers (for filter options)
 */
export async function getCustomerStatusCounts(): Promise<
  { active: number; inactive: number } | { error: string }
> {
  try {
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    // Get user role
    const { data: profile, error: roleError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError) {
      return { error: 'Failed to get user role' };
    }

    const userRole = profile?.role || 'employee';

    // Build base query based on role
    let baseQuery = supabase.from('customers').select('status', { count: 'exact', head: true });
    
    if (userRole === 'employee') {
      baseQuery = baseQuery.eq('assigned_employee_id', user.id);
    }

    // Count active customers
    const { count: activeCount } = await baseQuery.eq('status', 'active');

    // Count inactive customers
    let inactiveQuery = supabase.from('customers').select('status', { count: 'exact', head: true });
    if (userRole === 'employee') {
      inactiveQuery = inactiveQuery.eq('assigned_employee_id', user.id);
    }
    const { count: inactiveCount } = await inactiveQuery.eq('status', 'inactive');

    return {
      active: activeCount || 0,
      inactive: inactiveCount || 0,
    };
  } catch (error) {
    console.error('Error getting status counts:', error);
    return { error: 'Failed to get status counts' };
  }
}
