/**
 * Permission Checking Utilities
 * Role-based access control for customer management operations
 */

import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/lib/types/customer';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Operation type definitions
 */
type Operation = 'create' | 'edit' | 'delete' | 'assign' | 'add_note' | 'view_audit_log';

/**
 * Resource object for permission checks
 */
interface Resource {
  customerId?: string;
  assignedEmployeeId?: string;
}

/**
 * Permission rules by role and operation
 */
const permissionMatrix: Record<UserRole, Set<Operation>> = {
  admin: new Set(['create', 'edit', 'delete', 'assign', 'add_note', 'view_audit_log']),
  manager: new Set(['create', 'edit', 'delete', 'assign', 'add_note', 'view_audit_log']),
  employee: new Set(['add_note', 'view_audit_log']),
};

/**
 * Gets the user's role from the database
 * @param userId User ID from auth
 * @returns User's role or null if not found
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    if (!data || !data.role) {
      return null;
    }

    // Validate that the role is a known role
    const validRoles: UserRole[] = ['admin', 'manager', 'employee'];
    if (validRoles.includes(data.role)) {
      return data.role as UserRole;
    }

    return null;
  } catch (error) {
    console.error('Exception in getUserRole:', error);
    return null;
  }
}

/**
 * Checks if a customer is assigned to a user
 * @param customerId Customer ID
 * @param userId User ID
 * @returns True if customer is assigned to user
 */
export async function isCustomerAssignedToUser(
  customerId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('assigned_employee_id')
      .eq('id', customerId)
      .single();

    if (error) {
      console.error('Error checking customer assignment:', error);
      return false;
    }

    if (!data) {
      return false;
    }

    return data.assigned_employee_id === userId;
  } catch (error) {
    console.error('Exception in isCustomerAssignedToUser:', error);
    return false;
  }
}

/**
 * Main permission checking function
 * Determines if a user can perform an operation on a resource
 * @param userId User ID from auth
 * @param operation Operation to perform
 * @param resource Optional resource object with customerId and assignedEmployeeId
 * @returns True if operation is allowed, false otherwise
 */
export async function checkPermission(
  userId: string,
  operation: Operation,
  resource?: Resource
): Promise<boolean> {
  try {
    // Get user's role
    const userRole = await getUserRole(userId);

    if (!userRole) {
      console.warn('User role not found for userId:', userId);
      return false;
    }

    // Check if role has permission for this operation
    const allowedOperations = permissionMatrix[userRole];
    if (!allowedOperations.has(operation)) {
      return false;
    }

    // For employee add_note operations, check if customer is assigned to them
    if (userRole === 'employee' && operation === 'add_note') {
      if (!resource?.customerId) {
        return false;
      }

      const isAssigned = await isCustomerAssignedToUser(resource.customerId, userId);
      if (!isAssigned) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Exception in checkPermission:', error);
    return false;
  }
}

/**
 * Check multiple permissions at once
 * @param userId User ID from auth
 * @param operations Array of operations to check
 * @param resource Optional resource object
 * @returns True if ALL operations are allowed
 */
export async function checkAllPermissions(
  userId: string,
  operations: Operation[],
  resource?: Resource
): Promise<boolean> {
  const results = await Promise.all(
    operations.map((op) => checkPermission(userId, op, resource))
  );

  return results.every((result) => result === true);
}

/**
 * Check if ANY of the operations are allowed
 * @param userId User ID from auth
 * @param operations Array of operations to check
 * @param resource Optional resource object
 * @returns True if ANY operation is allowed
 */
export async function checkAnyPermission(
  userId: string,
  operations: Operation[],
  resource?: Resource
): Promise<boolean> {
  const results = await Promise.all(
    operations.map((op) => checkPermission(userId, op, resource))
  );

  return results.some((result) => result === true);
}

/**
 * Get all allowed operations for a user
 * @param userId User ID from auth
 * @returns Array of allowed operations
 */
export async function getAllowedOperations(userId: string): Promise<Operation[]> {
  try {
    const userRole = await getUserRole(userId);

    if (!userRole) {
      return [];
    }

    const allowedOperations = permissionMatrix[userRole];
    return Array.from(allowedOperations);
  } catch (error) {
    console.error('Exception in getAllowedOperations:', error);
    return [];
  }
}

/**
 * Check if user has a specific role
 * @param userId User ID from auth
 * @param role Role to check for
 * @returns True if user has the specified role
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const userRole = await getUserRole(userId);
    return userRole === role;
  } catch (error) {
    console.error('Exception in hasRole:', error);
    return false;
  }
}

/**
 * Check if user is admin
 * @param userId User ID from auth
 * @returns True if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, 'admin');
}

/**
 * Check if user is manager
 * @param userId User ID from auth
 * @returns True if user is manager
 */
export async function isManager(userId: string): Promise<boolean> {
  return hasRole(userId, 'manager');
}

/**
 * Check if user is employee
 * @param userId User ID from auth
 * @returns True if user is employee
 */
export async function isEmployee(userId: string): Promise<boolean> {
  return hasRole(userId, 'employee');
}
