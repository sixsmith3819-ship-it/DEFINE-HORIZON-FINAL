'use server';

import { createServerClient } from '@/lib/supabase-server';
import {
  Customer,
  CustomerDetail,
  CustomerFilters,
  CustomerFormData,
  SortField,
  PaginatedCustomers,
  AuditLogEntry,
  CustomerInteraction,
  CustomerStatus,
  FieldChange,
  IndividualCustomer,
  BusinessCustomer,
  CustomerType,
} from '@/lib/types/customer';
import { validateCustomerFormData, hasValidationErrors, getErrorMessages } from '@/lib/validation/customer-validation';
import { checkPermission } from '@/lib/auth/permissions';
import { createAuditLogEntry } from '@/lib/audit/audit-logger';

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

    // Get user role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    let query = supabase.from('customers').select('*', { count: 'exact' });

    // Apply role-based filtering
    if (userRole?.role === 'employee') {
      query = query.eq('assigned_employee_id', user.id);
    }

    // Apply search term filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      query = query.or(
        `first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,business_name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,phone.ilike.%${searchLower}%`
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
          orderByColumn = 'first_name';
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
      customers: (data || []).map(transformCustomerListData) as Customer[],
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
 * Fetch full customer details including interactions and audit log
 */
export async function getCustomerDetail(
  customerId: string
): Promise<{ success: boolean; customer?: CustomerDetail; interactions?: CustomerInteraction[]; auditLog?: AuditLogEntry[]; error?: string; statusCode?: number }> {
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
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Employees can only view assigned customers
    if (userRole?.role === 'employee' && customer.assigned_employee_id !== user.id) {
      return { success: false, error: 'Permission denied', statusCode: 403 };
    }

    // Fetch interactions
    const { data: interactions } = await supabase
      .from('customer_interactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    // Fetch audit log if user is Admin or Manager
    let auditLog: AuditLogEntry[] = [];
    if (userRole?.role === 'admin' || userRole?.role === 'manager') {
      const { data: auditData } = await supabase
        .from('customer_audit_log')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      auditLog = auditData || [];
    }

    return {
      success: true,
      customer: transformCustomerData(customer) as CustomerDetail,
      interactions: (interactions || []).map(transformInteractionData) as CustomerInteraction[],
      auditLog: (auditLog || []).map(transformAuditLogData) as AuditLogEntry[],
    };
  } catch (error) {
    console.error('Error in getCustomerDetail:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', statusCode: 500 };
  }
}

/**
 * Transform database customer record from snake_case to camelCase (for list view)
 */
function transformCustomerListData(dbCustomer: any): Customer {
  const base = {
    id: dbCustomer.id,
    customerType: dbCustomer.customer_type,
    status: dbCustomer.status,
    email: dbCustomer.email,
    phone: dbCustomer.phone,
    address: dbCustomer.address,
    assignedEmployeeId: dbCustomer.assigned_employee_id,
    createdAt: dbCustomer.created_at,
    createdBy: dbCustomer.created_by,
    updatedAt: dbCustomer.updated_at,
    updatedBy: dbCustomer.updated_by,
  };

  if (dbCustomer.customer_type === 'individual') {
    return {
      ...base,
      customerType: CustomerType.Individual,
      firstName: dbCustomer.first_name,
      lastName: dbCustomer.last_name,
      dateOfBirth: dbCustomer.date_of_birth,
    } as IndividualCustomer;
  } else {
    return {
      ...base,
      customerType: CustomerType.Business,
      businessName: dbCustomer.business_name,
      contactPerson: dbCustomer.contact_person,
      businessRegistrationNumber: dbCustomer.business_registration_number,
      taxId: dbCustomer.tax_id,
      website: dbCustomer.website,
    } as BusinessCustomer;
  }
}

/**
 * Transform database customer record from snake_case to camelCase
 */
function transformCustomerData(dbCustomer: any): CustomerDetail {
  return {
    id: dbCustomer.id,
    customerType: dbCustomer.customer_type,
    status: dbCustomer.status,
    email: dbCustomer.email,
    phone: dbCustomer.phone,
    address: dbCustomer.address,
    assignedEmployeeId: dbCustomer.assigned_employee_id,
    createdAt: dbCustomer.created_at,
    createdBy: dbCustomer.created_by,
    updatedAt: dbCustomer.updated_at,
    updatedBy: dbCustomer.updated_by,
    firstName: dbCustomer.first_name,
    lastName: dbCustomer.last_name,
    dateOfBirth: dbCustomer.date_of_birth,
    businessName: dbCustomer.business_name,
    contactPerson: dbCustomer.contact_person,
    businessRegistrationNumber: dbCustomer.business_registration_number,
    taxId: dbCustomer.tax_id,
    website: dbCustomer.website,
    interactions: [],
    auditLog: [],
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
    content: dbInteraction.content,
    isDeleted: dbInteraction.is_deleted,
    createdAt: dbInteraction.created_at,
    createdBy: dbInteraction.created_by,
    updatedAt: dbInteraction.updated_at,
    updatedBy: dbInteraction.updated_by,
    deletedAt: dbInteraction.deleted_at,
    deletedBy: dbInteraction.deleted_by,
  };
}

/**
 * Transform database audit log record from snake_case to camelCase
 */
function transformAuditLogData(dbAuditLog: any): AuditLogEntry {
  return {
    id: dbAuditLog.id,
    customerId: dbAuditLog.customer_id,
    operationType: dbAuditLog.operation_type,
    fieldName: dbAuditLog.field_name,
    previousValue: dbAuditLog.previous_value,
    newValue: dbAuditLog.new_value,
    details: dbAuditLog.details,
    createdAt: dbAuditLog.created_at,
    createdBy: dbAuditLog.created_by,
  };
}

/**
 * Fetch audit log for a specific customer (Admin/Manager only)
 */
export async function getCustomerAuditLog(
  customerId: string
): Promise<{ auditLog?: AuditLogEntry[]; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Check authorization
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin' && userRole?.role !== 'manager') {
      return { error: 'Permission denied' };
    }

    const { data: auditLog, error } = await supabase
      .from('customer_audit_log')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { auditLog: (auditLog || []) as AuditLogEntry[] };
  } catch (error) {
    console.error('Error in getCustomerAuditLog:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
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
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin' && userRole?.role !== 'manager') {
      return { success: false, error: 'Permission denied' };
    }

    // Validate input
    const errors = validateCustomerFormData(data);
    if (hasValidationErrors(errors)) {
      return { success: false, validationErrors: errors };
    }

    // Create customer
    const customerData = {
      customer_type: data.customerType,
      status: 'active',
      email: data.email,
      phone: data.phone,
      address: data.address,
      first_name: data.firstName || null,
      last_name: data.lastName || null,
      date_of_birth: data.dateOfBirth || null,
      business_name: data.businessName || null,
      contact_person: data.contactPerson || null,
      business_registration_number: data.businessRegistrationNumber || null,
      tax_id: data.taxId || null,
      website: data.website || null,
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

    // Create audit log entry
    await createAuditLogEntry(
      createdCustomer.id,
      OperationType.Create,
      user.id,
      undefined,
      { customerType: data.customerType }
    );

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
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin' && userRole?.role !== 'manager') {
      return { success: false, error: 'Permission denied' };
    }

    // Get current customer to track changes
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
    const changes: FieldChange[] = [];

    if (updates.firstName !== undefined && updates.firstName !== currentCustomer.first_name) {
      updateData.first_name = updates.firstName;
      changes.push({
        fieldName: 'first_name',
        previousValue: currentCustomer.first_name || '',
        newValue: updates.firstName || '',
      });
    }

    if (updates.lastName !== undefined && updates.lastName !== currentCustomer.last_name) {
      updateData.last_name = updates.lastName;
      changes.push({
        fieldName: 'last_name',
        previousValue: currentCustomer.last_name || '',
        newValue: updates.lastName || '',
      });
    }

    if (updates.email !== undefined && updates.email !== currentCustomer.email) {
      updateData.email = updates.email;
      changes.push({
        fieldName: 'email',
        previousValue: currentCustomer.email || '',
        newValue: updates.email || '',
      });
    }

    if (updates.phone !== undefined && updates.phone !== currentCustomer.phone) {
      updateData.phone = updates.phone;
      changes.push({
        fieldName: 'phone',
        previousValue: currentCustomer.phone || '',
        newValue: updates.phone || '',
      });
    }

    if (updates.address !== undefined && updates.address !== currentCustomer.address) {
      updateData.address = updates.address;
      changes.push({
        fieldName: 'address',
        previousValue: currentCustomer.address || '',
        newValue: updates.address || '',
      });
    }

    if (updates.businessName !== undefined && updates.businessName !== currentCustomer.business_name) {
      updateData.business_name = updates.businessName;
      changes.push({
        fieldName: 'business_name',
        previousValue: currentCustomer.business_name || '',
        newValue: updates.businessName || '',
      });
    }

    if (updates.contactPerson !== undefined && updates.contactPerson !== currentCustomer.contact_person) {
      updateData.contact_person = updates.contactPerson;
      changes.push({
        fieldName: 'contact_person',
        previousValue: currentCustomer.contact_person || '',
        newValue: updates.contactPerson || '',
      });
    }

    // Update customer
    const { error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create audit log entries for each change
    if (changes.length > 0) {
      for (const change of changes) {
        await createAuditLogEntry(
          customerId,
          OperationType.Update,
          user.id,
          [change],
          undefined
        );
      }
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
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin' && userRole?.role !== 'manager') {
      return { success: false, error: 'Permission denied' };
    }

    // Get current status
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('status')
      .eq('id', customerId)
      .single();

    if (fetchError || !customer) {
      return { success: false, error: 'Customer not found' };
    }

    // Update status to inactive
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        status: 'inactive',
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create audit log entry
    await createAuditLogEntry(
      customerId,
      OperationType.Delete,
      user.id,
      [
        {
          fieldName: 'status',
          previousValue: customer.status,
          newValue: 'inactive',
        },
      ],
      undefined
    );

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
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin' && userRole?.role !== 'manager') {
      return { success: false, error: 'Permission denied' };
    }

    // Update status to active
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        status: 'active',
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create audit log entry
    await createAuditLogEntry(
      customerId,
      OperationType.Reactivate,
      user.id,
      undefined,
      undefined
    );

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
  content: string
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
    if (!content || !content.trim()) {
      return { success: false, error: 'Note content cannot be empty' };
    }

    // Get customer to check assignment
    const { data: customer } = await supabase
      .from('customers')
      .select('assigned_employee_id')
      .eq('id', customerId)
      .single();

    // Check authorization
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role === 'employee' && customer?.assigned_employee_id !== user.id) {
      return { success: false, error: 'Permission denied' };
    }

    // Create interaction
    const { data: interaction, error: createError } = await supabase
      .from('customer_interactions')
      .insert({
        customer_id: customerId,
        interaction_type: 'note',
        content: content.trim(),
        is_deleted: false,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (createError || !interaction) {
      return { success: false, error: createError?.message || 'Failed to create note' };
    }

    // Create audit log entry
    await createAuditLogEntry(
      customerId,
      OperationType.Action,
      user.id,
      undefined,
      { action: 'added_note', noteId: interaction.id }
    );

    return { success: true, interactionId: interaction.id };
  } catch (error) {
    console.error('Error in addCustomerNote:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update a customer note
 */
export async function updateCustomerNote(
  interactionId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate content
    if (!newContent || !newContent.trim()) {
      return { success: false, error: 'Note content cannot be empty' };
    }

    // Get current interaction
    const { data: interaction, error: fetchError } = await supabase
      .from('customer_interactions')
      .select('*')
      .eq('id', interactionId)
      .single();

    if (fetchError || !interaction) {
      return { success: false, error: 'Note not found' };
    }

    // Check authorization
    const isOwner = interaction.created_by === user.id;
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = userRole?.role === 'admin';
    const isManager = userRole?.role === 'manager';

    if (!isOwner && !isAdmin && !isManager) {
      return { success: false, error: 'Permission denied' };
    }

    // Update interaction
    const { error: updateError } = await supabase
      .from('customer_interactions')
      .update({
        content: newContent.trim(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', interactionId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create audit log entry
    await createAuditLogEntry(
      interaction.customer_id,
      OperationType.Action,
      user.id,
      undefined,
      { action: 'updated_note', noteId: interactionId }
    );

    return { success: true };
  } catch (error) {
    console.error('Error in updateCustomerNote:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete a customer note (soft delete)
 */
export async function deleteCustomerNote(
  interactionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get current interaction
    const { data: interaction, error: fetchError } = await supabase
      .from('customer_interactions')
      .select('*')
      .eq('id', interactionId)
      .single();

    if (fetchError || !interaction) {
      return { success: false, error: 'Note not found' };
    }

    // Check authorization
    const isOwner = interaction.created_by === user.id;
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = userRole?.role === 'admin';
    const isManager = userRole?.role === 'manager';

    if (!isOwner && !isAdmin && !isManager) {
      return { success: false, error: 'Permission denied' };
    }

    // Soft delete interaction
    const { error: updateError } = await supabase
      .from('customer_interactions')
      .update({
        is_deleted: true,
        deleted_by: user.id,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', interactionId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create audit log entry
    await createAuditLogEntry(
      interaction.customer_id,
      OperationType.Action,
      user.id,
      undefined,
      { action: 'deleted_note', noteId: interactionId }
    );

    return { success: true };
  } catch (error) {
    console.error('Error in deleteCustomerNote:', error);
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
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin' && userRole?.role !== 'manager') {
      return { success: false, error: 'Permission denied' };
    }

    // Get current assignment
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('assigned_employee_id')
      .eq('id', customerId)
      .single();

    if (fetchError || !customer) {
      return { success: false, error: 'Customer not found' };
    }

    // Update assignment
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        assigned_employee_id: employeeId,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create audit log entry
    await createAuditLogEntry(
      customerId,
      OperationType.Assign,
      user.id,
      [
        {
          fieldName: 'assigned_employee_id',
          previousValue: customer.assigned_employee_id || '',
          newValue: employeeId,
        },
      ],
      undefined
    );

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
    const { data: userRoleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      return { error: 'Failed to get user role' };
    }

    const userRole = userRoleData?.role || 'employee';

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
