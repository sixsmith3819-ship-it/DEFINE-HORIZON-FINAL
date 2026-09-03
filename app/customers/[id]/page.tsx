'use server';

import { createServerClient } from '@/lib/supabase-server';
import { getCustomerDetail, getCustomerAuditLog, softDeleteCustomer, reactivateCustomer, assignCustomerToEmployee, addCustomerNote, deleteCustomerNote } from '@/lib/actions/customers';
import { Customer, CustomerDetail, CustomerInteraction, AuditLogEntry, CustomerStatus, CustomerType } from '@/lib/types/customer';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { checkPermission } from '@/lib/auth/permissions';

// Badge component for status
function StatusBadge({ status }: { status: CustomerStatus }) {
  return <span className={`badge text-xs ${status === 'active' ? 'badge-success' : 'badge-gray'}`}>{status === 'active' ? 'Active' : 'Inactive'}</span>
}

// Badge for customer type
function TypeBadge({ type }: { type: CustomerType }) {
  return <span className={`badge text-xs ${type === 'individual' ? 'badge-info' : 'badge-purple'}`}>{type === 'individual' ? 'Individual' : 'Business'}</span>
}

// Format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Get display name for a customer
function getCustomerDisplayName(customer: CustomerDetail): string {
  if (customer.customerType === 'individual') {
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  }
  return customer.businessName || '';
}

// Customer detail content component
async function CustomerDetailContent({ customerId }: { customerId: string }) {
  const client = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    return (
      <div className="dh-card rounded-xl px-4 py-3" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
        <h2 className="font-semibold text-lg mb-2">Authentication Error</h2>
        <p>You must be logged in to view this page.</p>
      </div>
    );
  }

  // Fetch customer detail
  const detailResult = await getCustomerDetail(customerId);

  if (!detailResult.success || detailResult.statusCode === 404) {
    return (
      <div className="dh-card rounded-xl px-4 py-6" style={{ background: '#fefce8', border: '1px solid #fde047' }}>
        <h2 className="font-semibold text-lg mb-2" style={{ color: '#854d0e' }}>Customer Not Found</h2>
        <p className="mb-4" style={{ color: '#a16207' }}>The customer you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        <Link href="/customers" className="text-sm font-medium" style={{ color: 'var(--dh-primary)' }}>
          ← Back to Customer List
        </Link>
      </div>
    );
  }

  if (!detailResult.success || detailResult.statusCode === 403) {
    return (
      <div className="dh-card rounded-xl px-4 py-6" style={{ background: '#fee2e2', border: '1px solid #fecaca' }}>
        <h2 className="font-semibold text-lg mb-2" style={{ color: '#991b1b' }}>Permission Denied</h2>
        <p className="mb-4" style={{ color: '#991b1b' }}>You don&apos;t have permission to view this customer.</p>
        <Link href="/customers" className="text-sm font-medium" style={{ color: 'var(--dh-primary)' }}>
          ← Back to Customer List
        </Link>
      </div>
    );
  }

  const customer = detailResult.customer;
  const interactions = detailResult.interactions || [];
  const auditLog = detailResult.auditLog || [];

  if (!customer) {
    return (
      <div className="dh-card rounded-xl px-4 py-6" style={{ background: '#fefce8', border: '1px solid #fde047' }}>
        <h2 className="font-semibold text-lg mb-2" style={{ color: '#854d0e' }}>Customer Not Found</h2>
        <p className="mb-4" style={{ color: '#a16207' }}>The customer you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        <Link href="/customers" className="text-sm font-medium" style={{ color: 'var(--dh-primary)' }}>
          ← Back to Customer List
        </Link>
      </div>
    );
  }

  // Determine if user is manager/admin for edit permissions
  const canEdit = await checkPermission(user.id, 'edit', { customerId });
  const canSoftDelete = await checkPermission(user.id, 'delete', { customerId });
  const canAssign = await checkPermission(user.id, 'assign', { customerId });
  const canAddNote = await checkPermission(user.id, 'add_note', { customerId, assignedEmployeeId: customer.assignedEmployeeId ?? undefined });
  const canViewAudit = await checkPermission(user.id, 'view_audit_log', {});

  // Get customer type for display
  const isIndividual = customer.customerType === 'individual';
  const isBusiness = customer.customerType === 'business';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with back link */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/customers" className="text-sm font-medium" style={{ color: 'var(--dh-primary)' }}>
          ← Back to Customers
        </Link>
      </div>

      {/* Customer Info Card */}
      <div className="dh-card p-8">
        {/* Customer Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getCustomerDisplayName(customer)}
            </h1>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={customer.status} />
              <TypeBadge type={customer.customerType} />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canEdit && (
              <Link
                href={`/customers/${customerId}/edit`}
                className="dh-btn-primary"
              >
                Edit
              </Link>
            )}
            {canSoftDelete && (
              <form
                action={async () => {
                  'use server';
                  const result = await softDeleteCustomer(customerId);
                  if (result.success) {
                    redirect('/customers');
                  }
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  {customer.status === 'active' ? 'Soft Delete' : 'Delete'}
                </button>
              </form>
            )}
            {customer.status === 'inactive' && canSoftDelete && (
              <form
                action={async () => {
                  'use server';
                  const result = await reactivateCustomer(customerId);
                  if (result.success) {
                    redirect(`/customers/${customerId}`);
                  }
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Reactivate
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Two column layout for customer details */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left column: Personal/Business Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{customer.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">{customer.address}</p>
                </div>
              </div>
            </div>

            {/* Individual specific fields */}
            {isIndividual && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">First Name</label>
                    <p className="text-gray-900">{customer.firstName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Name</label>
                    <p className="text-gray-900">{customer.lastName}</p>
                  </div>
                  {customer.dateOfBirth && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                      <p className="text-gray-900">
                        {new Date(customer.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business specific fields */}
            {isBusiness && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Business Name</label>
                    <p className="text-gray-900">{customer.businessName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contact Person</label>
                    <p className="text-gray-900">{customer.contactPerson}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration Number</label>
                    <p className="text-gray-900">{customer.businessRegistrationNumber}</p>
                  </div>
                  {customer.taxId && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tax ID</label>
                      <p className="text-gray-900">{customer.taxId}</p>
                    </div>
                  )}
                  {customer.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Website</label>
                      <p className="text-gray-900">
                        <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          {customer.website}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Metadata and Assignment */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Metadata</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created On</label>
                  <p className="text-gray-900">{formatDate(customer.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900">{formatDate(customer.updatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer ID</label>
                  <p className="text-gray-900 font-mono text-sm">{customer.id}</p>
                </div>
              </div>
            </div>

            {/* Assignment section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
              <div className="bg-gray-50 rounded p-4">
                {customer.assignedEmployeeId ? (
                  <p className="text-gray-900">
                    Assigned to: <span className="font-medium">{customer.assignedEmployeeId}</span>
                  </p>
                ) : (
                  <p className="text-gray-600">Not assigned to any employee</p>
                )}
                {canAssign && (
                  <p className="text-sm text-gray-600 mt-2">
                    Assignment controls would appear here for managers/admins
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactions/Notes Timeline Section */}
      <div className="dh-card p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Interaction History</h2>

        {/* Add note form */}
        {canAddNote && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Note</h3>
            <form
              action={async (formData) => {
                'use server';
                const content = formData.get('content') as string;
                if (content.trim()) {
                  const result = await addCustomerNote(customerId, content);
                  if (result.success) {
                    redirect(`/customers/${customerId}`);
                  }
                }
              }}
              className="space-y-3"
            >
              <textarea
                name="content"
                placeholder="Write a note about this customer..."
                className="dh-input"
                rows={3}
              />
              <button
                type="submit"
                className="dh-btn-primary"
              >
                Add Note
              </button>
            </form>
          </div>
        )}

        {/* Notes Timeline */}
        {interactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No interactions recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction: CustomerInteraction) => (
              <div
                key={interaction.id}
                className={`p-4 border rounded-lg ${
                  interaction.isDeleted ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600">
                      {interaction.createdBy} • {formatDate(interaction.createdAt)}
                    </p>
                    {interaction.isDeleted && (
                      <p className="text-xs text-red-600">Deleted by {interaction.deletedBy} on {formatDate(interaction.deletedAt || '')}</p>
                    )}
                  </div>
                  {!interaction.isDeleted && canAddNote && (
                    <div className="flex gap-2">
                      <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                      <button className="text-sm text-red-600 hover:text-red-800">Delete</button>
                    </div>
                  )}
                </div>
                <p className={`text-gray-900 ${interaction.isDeleted ? 'line-through opacity-50' : ''}`}>
                  {interaction.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log Section (Admin/Manager only) */}
      {canViewAudit && auditLog.length > 0 && (
        <div className="dh-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Trail</h2>
          <div className="space-y-4">
            {auditLog.map((entry: AuditLogEntry) => (
              <div key={entry.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">{entry.operationType}</p>
                    <p className="text-sm text-gray-600">
                      {entry.createdBy} • {formatDate(entry.createdAt)}
                    </p>
                  </div>
                </div>
                {entry.fieldName && (
                  <div className="bg-gray-50 rounded p-3 mt-3 text-sm">
                    <p className="font-mono text-gray-700">
                      <span className="font-semibold">{entry.fieldName}:</span>{' '}
                      <span className="text-red-600">
                        {entry.previousValue || '(empty)'}
                      </span>
                      {' → '}
                      <span className="text-green-600">
                        {entry.newValue || '(empty)'}
                      </span>
                    </p>
                  </div>
                )}
                {entry.details && (
                  <div className="bg-gray-50 rounded p-3 mt-3 text-sm">
                    <p className="text-gray-700">{JSON.stringify(entry.details, null, 2)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main page component
export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: customerId } = await params;

  return (
    <div className="p-6 min-h-screen" style={{ background: 'var(--dh-bg)' }}>
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto">
            <div className="dh-card p-8">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 skeleton" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <CustomerDetailContent customerId={customerId} />
      </Suspense>
    </div>
  );
}
