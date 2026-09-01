/**
 * Audit Logging Utilities
 * Functions for creating and managing audit log entries
 */

import { createClient } from '@supabase/supabase-js';
import { OperationType, AuditLogResult, FieldChange } from '@/lib/types/customer';

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Creates an audit log entry in the database
 * Handles single entries or multiple entries for field changes
 * @param customerId Customer ID
 * @param operation Operation type
 * @param userId User ID performing the operation
 * @param changes Optional array of field changes
 * @param details Optional additional details
 * @returns Success status and entry ID
 */
export async function createAuditLogEntry(
  customerId: string,
  operation: OperationType,
  userId: string,
  changes?: FieldChange[],
  details?: Record<string, any>
): Promise<AuditLogResult> {
  try {
    // If changes are provided, create one entry per field change
    if (changes && changes.length > 0) {
      const entries = changes.map((change) => ({
        customer_id: customerId,
        operation_type: operation,
        field_name: change.fieldName,
        previous_value: change.previousValue || null,
        new_value: change.newValue,
        details: details || null,
        created_by: userId,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('customer_audit_log')
        .insert(entries)
        .select('id');

      if (error) {
        console.error('Error creating audit log entries:', error);
        return {
          success: false,
          error: `Failed to create audit log: ${error.message}`,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'No entries were created',
        };
      }

      return {
        success: true,
        entryId: data[0].id,
      };
    }

    // Create single entry without field changes
    const { data, error } = await supabase
      .from('customer_audit_log')
      .insert({
        customer_id: customerId,
        operation_type: operation,
        field_name: null,
        previous_value: null,
        new_value: null,
        details: details || null,
        created_by: userId,
        created_at: new Date().toISOString(),
      })
      .select('id');

    if (error) {
      console.error('Error creating audit log entry:', error);
      return {
        success: false,
        error: `Failed to create audit log: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Entry was not created',
      };
    }

    return {
      success: true,
      entryId: data[0].id,
    };
  } catch (error) {
    console.error('Exception in createAuditLogEntry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Exception creating audit log: ${errorMessage}`,
    };
  }
}

/**
 * Logs customer creation
 * @param customerId Customer ID
 * @param userId User ID performing the operation
 * @param customerData Customer data that was created
 * @returns Success status
 */
export async function logCustomerCreation(
  customerId: string,
  userId: string,
  customerData: Record<string, any>
): Promise<AuditLogResult> {
  try {
    const result = await createAuditLogEntry(
      customerId,
      OperationType.Create,
      userId,
      undefined,
      {
        action: 'Customer created',
        customerData,
      }
    );

    return result;
  } catch (error) {
    console.error('Exception in logCustomerCreation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Exception logging customer creation: ${errorMessage}`,
    };
  }
}

/**
 * Logs customer updates
 * @param customerId Customer ID
 * @param userId User ID performing the operation
 * @param changes Array of field changes
 * @returns Success status
 */
export async function logCustomerUpdate(
  customerId: string,
  userId: string,
  changes: FieldChange[]
): Promise<AuditLogResult> {
  try {
    if (!changes || changes.length === 0) {
      return {
        success: true,
        error: 'No changes to log',
      };
    }

    const result = await createAuditLogEntry(
      customerId,
      OperationType.Update,
      userId,
      changes
    );

    return result;
  } catch (error) {
    console.error('Exception in logCustomerUpdate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Exception logging customer update: ${errorMessage}`,
    };
  }
}

/**
 * Logs customer soft delete
 * @param customerId Customer ID
 * @param userId User ID performing the operation
 * @param previousStatus Previous status before deletion
 * @returns Success status
 */
export async function logCustomerDelete(
  customerId: string,
  userId: string,
  previousStatus: string
): Promise<AuditLogResult> {
  try {
    const change: FieldChange = {
      fieldName: 'status',
      previousValue: previousStatus,
      newValue: 'inactive',
    };

    const result = await createAuditLogEntry(
      customerId,
      OperationType.Delete,
      userId,
      [change],
      {
        action: 'Customer soft deleted',
        previousStatus,
      }
    );

    return result;
  } catch (error) {
    console.error('Exception in logCustomerDelete:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Exception logging customer delete: ${errorMessage}`,
    };
  }
}

/**
 * Logs customer reactivation
 * @param customerId Customer ID
 * @param userId User ID performing the operation
 * @returns Success status
 */
export async function logCustomerReactivation(
  customerId: string,
  userId: string
): Promise<AuditLogResult> {
  try {
    const change: FieldChange = {
      fieldName: 'status',
      previousValue: 'inactive',
      newValue: 'active',
    };

    const result = await createAuditLogEntry(
      customerId,
      OperationType.Reactivate,
      userId,
      [change],
      {
        action: 'Customer reactivated',
      }
    );

    return result;
  } catch (error) {
    console.error('Exception in logCustomerReactivation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Exception logging customer reactivation: ${errorMessage}`,
    };
  }
}

/**
 * Logs customer assignment
 * @param customerId Customer ID
 * @param userId User ID performing the operation
 * @param previousEmployeeId Previous assigned employee ID (or null)
 * @param newEmployeeId New assigned employee ID
 * @returns Success status
 */
export async function logCustomerAssignment(
  customerId: string,
  userId: string,
  previousEmployeeId: string | null,
  newEmployeeId: string
): Promise<AuditLogResult> {
  try {
    const change: FieldChange = {
      fieldName: 'assigned_employee_id',
      previousValue: previousEmployeeId || 'unassigned',
      newValue: newEmployeeId,
    };

    const result = await createAuditLogEntry(
      customerId,
      OperationType.Assign,
      userId,
      [change],
      {
        action: 'Customer assigned to employee',
        previousEmployeeId,
        newEmployeeId,
      }
    );

    return result;
  } catch (error) {
    console.error('Exception in logCustomerAssignment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Exception logging customer assignment: ${errorMessage}`,
    };
  }
}

/**
 * Logs customer interaction (note, call, email, etc.)
 * @param customerId Customer ID
 * @param userId User ID performing the operation
 * @param interactionType Type of interaction
 * @param content Interaction content/details
 * @returns Success status and interaction ID
 */
export async function logCustomerInteraction(
  customerId: string,
  userId: string,
  interactionType: string,
  content: string
): Promise<{ success: boolean; interactionId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('customer_interactions')
      .insert({
        customer_id: customerId,
        interaction_type: interactionType,
        content,
        is_deleted: false,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id');

    if (error) {
      console.error('Error logging customer interaction:', error);
      return {
        success: false,
        error: `Failed to log interaction: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Interaction was not recorded',
      };
    }

    return {
      success: true,
      interactionId: data[0].id,
    };
  } catch (error) {
    console.error('Exception in logCustomerInteraction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Exception logging interaction: ${errorMessage}`,
    };
  }
}

/**
 * Retrieves audit log entries for a customer
 * @param customerId Customer ID
 * @param limit Maximum number of entries to retrieve
 * @returns Array of audit log entries or error
 */
export async function getCustomerAuditLog(
  customerId: string,
  limit: number = 100
): Promise<{
  success: boolean;
  entries?: any[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('customer_audit_log')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error retrieving audit log:', error);
      return {
        success: false,
        error: `Failed to retrieve audit log: ${error.message}`,
      };
    }

    return {
      success: true,
      entries: data || [],
    };
  } catch (error) {
    console.error('Exception in getCustomerAuditLog:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Exception retrieving audit log: ${errorMessage}`,
    };
  }
}
