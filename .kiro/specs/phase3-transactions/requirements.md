# Requirements Document: Financial Transaction Management Module

## Introduction

The Financial Transaction Management Module is the core business function of Define Horizon Company (DHS). It enables employees to record money transfer transactions for customers using various service providers. The system tracks inbound and outbound money flows, automatically calculates commissions based on transaction type (local or international), and provides comprehensive transaction management and analytics for business owners and administrators.

## Glossary

- **System**: The Horizon Business Management System - Financial Transaction Management Module
- **Transaction**: A money transfer operation processed by Define Horizon on behalf of a customer
- **Customer**: An individual or business who uses Define Horizon's money transfer services
- **Service Provider**: The financial service platform used to process the transaction (EcoCash, Mukuru, Mama Money, MOOVAR, WorldRemit)
- **Transaction Type**: Classification of transaction as either Local or International
- **Transaction Direction**: Flow of money - either Inbound (money coming into DHS) or Outbound (money going out from DHS)
- **Inbound Transaction**: Customer gives money to Define Horizon for processing
- **Outbound Transaction**: Define Horizon sends or pays out money on behalf of customer
- **Commission**: The fee charged by Define Horizon for processing the transaction
- **Local Transaction**: A money transfer within the same country (8% commission)
- **International Transaction**: A money transfer between different countries (10% commission)
- **Transaction Amount**: The base amount of money being transferred (before commission)
- **Total Amount**: Transaction amount plus commission
- **Transaction Status**: Current state of transaction (Pending, Completed, Cancelled)
- **Transaction Receipt**: Confirmation document provided to customer after transaction is recorded
- **Admin**: System administrator with full access to all transactions and analytics
- **Employee**: Staff member who records transactions for customers

## Requirements

### Requirement 1: Record Financial Transaction

**User Story:** As an employee, I want to record a financial transaction for a customer, so that I can process their money transfer request and track the transaction in the system.

#### Acceptance Criteria

1. WHEN an employee submits a valid transaction form, THE System SHALL create a new transaction record and store it in the database.
2. THE System SHALL require the following fields: Customer, Service Provider, Transaction Type, Transaction Direction, Amount, and Currency.
3. THE System SHALL automatically generate a unique Transaction ID when a new transaction is created.
4. THE System SHALL automatically set the transaction Date to the current date and time.
5. THE System SHALL record the Employee who created the transaction.
6. THE System SHALL automatically set the transaction Status to Pending when first created.
7. THE System SHALL allow optional Notes to be added to the transaction.
8. IF an employee attempts to submit a transaction without required fields, THEN THE System SHALL reject the submission and display specific validation error messages.

### Requirement 2: Service Provider Selection

**User Story:** As an employee, I want to select from available service providers, so that I can accurately record which platform will process the transaction.

#### Acceptance Criteria

1. THE System SHALL provide a dropdown list of exactly 5 service providers: EcoCash, Mukuru, Mama Money, MOOVAR, and WorldRemit.
2. WHEN creating a transaction, THE System SHALL require selection of exactly one service provider.
3. THE System SHALL store the selected service provider with the transaction record.
4. THE System SHALL NOT allow manual entry of service provider names.
5. THE System SHALL display service provider names in alphabetical order in the dropdown.

### Requirement 3: Transaction Type Selection

**User Story:** As an employee, I want to specify whether a transaction is local or international, so that the correct commission rate is applied.

#### Acceptance Criteria

1. THE System SHALL provide two transaction type options: Local and International.
2. WHEN creating a transaction, THE System SHALL require selection of exactly one transaction type.
3. THE System SHALL store the selected transaction type with the transaction record.
4. THE System SHALL use transaction type to determine commission calculation (Local = 8%, International = 10%).
5. THE System SHALL clearly label Local and International options in the user interface.

### Requirement 4: Transaction Direction Selection

**User Story:** As an employee, I want to specify whether money is coming in or going out, so that the cash flow direction is accurately tracked.

#### Acceptance Criteria

1. THE System SHALL provide two transaction direction options: Inbound and Outbound.
2. WHEN creating a transaction, THE System SHALL require selection of exactly one transaction direction.
3. THE System SHALL store the selected transaction direction with the transaction record.
4. THE System SHALL clearly distinguish between Inbound (money coming into Define Horizon) and Outbound (money going out from Define Horizon) in the user interface.
5. THE System SHALL use transaction direction for cash flow analytics and filtering.

### Requirement 5: Automatic Commission Calculation

**User Story:** As an employee, I want the system to automatically calculate commission, so that I don't make manual errors and the correct commission is charged every time.

#### Acceptance Criteria

1. WHEN transaction type is International, THE System SHALL calculate commission as Amount × 10%.
2. WHEN transaction type is Local, THE System SHALL calculate commission as Amount × 8%.
3. THE System SHALL automatically calculate Total Amount as Amount + Commission.
4. THE System SHALL display the calculated commission to the employee before transaction is saved.
5. THE System SHALL NOT allow employees to manually enter or override commission amounts.
6. THE System SHALL NOT allow administrators to manually override commission amounts.
7. THE System SHALL store commission rate (8% or 10%) with the transaction for audit purposes.
8. WHEN amount is updated, THE System SHALL immediately recalculate commission and total.

### Requirement 6: Customer Association

**User Story:** As an employee, I want to link transactions to existing customers, so that customer transaction history is maintained.

#### Acceptance Criteria

1. WHEN creating a transaction, THE System SHALL require selection of an existing customer from the customer database.
2. THE System SHALL display customer Full Name, ID Number, and Phone Number on the transaction form.
3. THE System SHALL auto-populate Customer Name, ID Number, and Phone Number fields when a customer is selected.
4. THE System SHALL store a reference to the customer record with each transaction.
5. THE System SHALL allow searching customers by name, ID number, or phone number during transaction creation.
6. IF customer does not exist, THE System SHALL provide a quick link to register a new customer.
7. THE System SHALL prevent transaction creation without a valid customer selection.

###

 Requirement 7: Transaction Amount Validation

**User Story:** As a system designer, I want transaction amounts to be validated, so that data integrity is maintained and errors are prevented.

#### Acceptance Criteria

1. WHEN an employee enters a transaction amount, THE System SHALL validate that the amount is greater than zero.
2. THE System SHALL validate that the amount contains only numeric digits and optional decimal point.
3. THE System SHALL validate that the amount has maximum two decimal places.
4. THE System SHALL reject negative amounts and display an error message.
5. THE System SHALL reject amounts with invalid format (e.g., letters, special characters) and display an error message.
6. THE System SHALL validate that currency is selected from supported currencies.
7. IF amount validation fails, THEN THE System SHALL prevent transaction submission and highlight the invalid field.

### Requirement 8: Transaction Status Management

**User Story:** As an administrator, I want to manage transaction status, so that I can track which transactions are pending, completed, or cancelled.

#### Acceptance Criteria

1. WHEN a transaction is first created, THE System SHALL set status to Pending.
2. THE System SHALL allow authorized users to change transaction status from Pending to Completed.
3. THE System SHALL allow authorized users to change transaction status from Pending to Cancelled.
4. THE System SHALL NOT allow changing status from Completed to any other status.
5. THE System SHALL NOT allow changing status from Cancelled to any other status.
6. WHEN status is changed to Cancelled, THE System SHALL require a reason/note.
7. THE System SHALL record the date and user who changed the transaction status.
8. THE System SHALL display status clearly using color-coded badges (Pending=Yellow, Completed=Green, Cancelled=Red).

### Requirement 9: Transaction Receipt/Confirmation

**User Story:** As an employee, I want to generate a transaction receipt after recording a transaction, so that I can provide confirmation to the customer.

#### Acceptance Criteria

1. WHEN a transaction is successfully saved, THE System SHALL display a confirmation page/modal with transaction details.
2. THE confirmation SHALL display: Transaction ID, Customer Name, Service Provider, Transaction Type, Transaction Direction, Amount, Commission, Total Amount, Processed By (employee name), and Date.
3. THE System SHALL provide a Print button on the confirmation page.
4. THE System SHALL format the receipt in a professional, customer-friendly layout.
5. THE System SHALL allow the employee to return to the dashboard after viewing the receipt.
6. THE System SHALL allow the employee to create a new transaction directly from the receipt page.

### Requirement 10: View All Transactions (Admin)

**User Story:** As an administrator, I want to view all transactions in the system, so that I can monitor all financial activity and ensure proper record-keeping.

#### Acceptance Criteria

1. WHEN an administrator accesses the transaction list, THE System SHALL display all transactions regardless of which employee recorded them.
2. THE System SHALL display transactions in a table with columns: Transaction ID, Date, Customer, ID Number, Service Provider, Amount, Transaction Type, Direction, Commission, Employee, and Status.
3. THE System SHALL display transactions in descending order by date (most recent first) by default.
4. THE System SHALL paginate transaction results showing 25 transactions per page.
5. THE System SHALL provide pagination controls to navigate between pages.
6. THE System SHALL display the total count of transactions matching current filters.
7. THE System SHALL allow clicking on a transaction row to view full transaction details.

### Requirement 11: View Employee Transactions (Employee)

**User Story:** As an employee, I want to view transactions I have recorded, so that I can track my work and verify transaction details.

#### Acceptance Criteria

1. WHEN an employee accesses the transaction list, THE System SHALL display only transactions recorded by that specific employee.
2. THE System SHALL NOT display transactions recorded by other employees to non-admin users.
3. THE System SHALL display employee transactions using the same table format as admin view.
4. THE System SHALL allow employees to view full details of their own transactions.
5. THE System SHALL prevent employees from editing or deleting completed transactions.

### Requirement 12: Transaction Search and Filtering

**User Story:** As a user, I want to search and filter transactions, so that I can quickly find specific transaction records.

#### Acceptance Criteria

1. THE System SHALL provide a search field that searches Transaction ID, Customer Name, and ID Number.
2. THE System SHALL provide a filter for Date Range (From Date - To Date).
3. THE System SHALL provide a filter for Service Provider (All, EcoCash, Mukuru, Mama Money, MOOVAR, WorldRemit).
4. THE System SHALL provide a filter for Transaction Type (All, Local, International).
5. THE System SHALL provide a filter for Transaction Direction (All, Inbound, Outbound).
6. THE System SHALL provide a filter for Employee (Admin only - All employees or specific employee).
7. THE System SHALL provide a filter for Status (All, Pending, Completed, Cancelled).
8. WHEN filters are applied, THE System SHALL update the transaction list immediately.
9. THE System SHALL display a count of filtered results.
10. THE System SHALL provide a Clear Filters button to reset all filters.
11. THE System SHALL maintain filter selections when navigating between pages.

### Requirement 13: Transaction Analytics (Admin Dashboard)

**User Story:** As an administrator, I want to see transaction analytics on my dashboard, so that I can monitor business performance and identify trends.

#### Acceptance Criteria

1. THE admin dashboard SHALL display Total Transactions count.
2. THE admin dashboard SHALL display Today's Transactions count.
3. THE admin dashboard SHALL display Inbound Transactions count and total amount.
4. THE admin dashboard SHALL display Outbound Transactions count and total amount.
5. THE admin dashboard SHALL display Total Amount Processed across all transactions.
6. THE admin dashboard SHALL display Total Commissions Earned.
7. THE admin dashboard SHALL display International Transaction count and amount.
8. THE admin dashboard SHALL display Local Transaction count and amount.
9. THE admin dashboard SHALL display a chart showing Transactions Per Day (last 7 days).
10. THE admin dashboard SHALL display a chart showing Inbound vs Outbound comparison.
11. THE admin dashboard SHALL display a chart showing International vs Local transaction comparison.
12. THE admin dashboard SHALL display a chart showing Service Provider Usage (transaction count per provider).
13. THE admin dashboard SHALL allow selecting different date ranges for analytics where practical.

### Requirement 14: Employee Transaction Analytics

**User Story:** As an employee, I want to see my transaction statistics, so that I can track my daily performance.

#### Acceptance Criteria

1. THE employee dashboard SHALL display Today's Transactions count (transactions recorded by that employee today).
2. THE employee dashboard SHALL display Total Amount Processed Today.
3. THE employee dashboard SHALL display Today's Commissions generated.
4. THE employee dashboard SHALL display a list of Recent Transactions (last 10 transactions recorded by that employee).
5. THE employee dashboard SHALL display customer count served today.
6. THE employee dashboard SHALL NOT display system-wide analytics or other employees' statistics.

### Requirement 15: Transaction Detail View

**User Story:** As a user, I want to view complete transaction details, so that I can review all information about a specific transaction.

#### Acceptance Criteria

1. WHEN a user clicks on a transaction, THE System SHALL display a detailed view with all transaction information.
2. THE detail view SHALL display: Transaction ID, Status, Date/Time, Customer Full Name, Customer ID Number, Customer Phone Number, Service Provider, Transaction Type, Transaction Direction, Amount, Currency, Commission Rate, Commission Amount, Total Amount, Processed By (employee name), and Notes.
3. THE detail view SHALL display status change history if status has been updated.
4. WHERE user is Admin, THE detail view SHALL provide buttons to change status (Pending→Completed, Pending→Cancelled).
5. THE detail view SHALL provide a Print button to print transaction details.
6. THE System SHALL provide a Back button to return to the transaction list.

### Requirement 16: Prevent Duplicate Transactions

**User Story:** As a system designer, I want to prevent duplicate transaction submissions, so that customers are not charged twice for the same transaction.

#### Acceptance Criteria

1. WHEN an employee submits a transaction form, THE System SHALL disable the Submit button after first click.
2. THE System SHALL display a loading indicator while the transaction is being saved.
3. THE System SHALL prevent multiple simultaneous submissions of the same transaction.
4. IF a transaction save fails due to network error, THE System SHALL re-enable the Submit button and display an error message.
5. THE System SHALL check for potential duplicates (same customer, same amount, same provider within 5 minutes) and display a warning.
6. IF a potential duplicate is detected, THE System SHALL ask for confirmation before proceeding.

### Requirement 17: Transaction Audit Trail

**User Story:** As an administrator, I want to track all changes to transactions, so that I can maintain accountability and audit financial records.

#### Acceptance Criteria

1. WHEN a transaction is created, THE System SHALL record the creation date, time, and creating employee.
2. WHEN a transaction status is changed, THE System SHALL record the change date, time, changing user, previous status, and new status.
3. WHEN transaction notes are added or updated, THE System SHALL record the update date, time, and updating user.
4. THE System SHALL maintain a complete audit log for each transaction showing all historical changes.
5. THE System SHALL allow administrators to view the audit trail for any transaction.
6. THE System SHALL NOT allow deletion of transaction records (preserve audit trail).
7. THE System SHALL record employee ID with each transaction for accountability.

### Requirement 18: Role-Based Access Control

**User Story:** As a system administrator, I want to control what actions employees can perform, so that financial data is protected and proper authorization is enforced.

#### Acceptance Criteria

1. WHERE user role is Admin, THE System SHALL allow creating transactions, viewing all transactions, updating transaction status, and viewing all analytics.
2. WHERE user role is Employee, THE System SHALL allow creating transactions, viewing own transactions, and viewing employee dashboard.
3. WHERE user role is Employee, THE System SHALL NOT allow viewing transactions recorded by other employees.
4. WHERE user role is Employee, THE System SHALL NOT allow changing transaction status.
5. WHERE user role is Employee, THE System SHALL NOT allow viewing system-wide analytics or financial summaries.
6. THE System SHALL enforce permissions at both the UI level (hide unauthorized features) and database level (Row Level Security).
7. THE System SHALL redirect unauthorized users to an access denied page if they attempt to access restricted functionality.

### Requirement 19: Commission Rate Configuration

**User Story:** As an administrator, I want commission rates to be configurable, so that rates can be updated if business requirements change.

#### Acceptance Criteria

1. THE System SHALL store commission rates in a configuration table: International Rate = 10%, Local Rate = 8%.
2. THE System SHALL use the configured rates for all commission calculations.
3. WHERE user role is Admin, THE System SHALL provide a settings page to view and update commission rates.
4. WHEN commission rates are updated, THE System SHALL apply new rates only to new transactions (not retroactively).
5. THE System SHALL validate that commission rates are between 0% and 100%.
6. THE System SHALL record the date and admin user who changes commission rates.
7. THE System SHALL display a confirmation dialog before saving commission rate changes.

### Requirement 20: Transaction Summary Report

**User Story:** As an administrator, I want to generate transaction summary reports, so that I can analyze financial performance over time.

#### Acceptance Criteria

1. THE System SHALL provide a report showing total transactions, total amount, and total commission for a selected date range.
2. THE System SHALL provide a report breaking down transactions by Service Provider.
3. THE System SHALL provide a report breaking down transactions by Transaction Type (Local vs International).
4. THE System SHALL provide a report breaking down transactions by Transaction Direction (Inbound vs Outbound).
5. THE System SHALL provide a report showing transactions by Employee.
6. THE System SHALL allow filtering reports by date range, service provider, transaction type, and direction.
7. THE System SHALL display report data in both table and chart formats.
8. THE System SHALL provide an Export button to download reports as CSV.
9. THE System SHALL calculate percentage breakdowns (e.g., International = 60%, Local = 40%).

### Requirement 21: Mobile Responsiveness

**User Story:** As an employee using a tablet, I want the transaction system to work on my device, so that I can record transactions while assisting customers at a service desk.

#### Acceptance Criteria

1. THE System SHALL display transaction forms correctly on tablet devices (768px width and above).
2. THE System SHALL display transaction tables in a responsive layout that adapts to screen width.
3. THE System SHALL provide touch-friendly buttons and inputs with adequate spacing.
4. WHEN viewing on smaller screens, THE System SHALL stack form fields vertically for better readability.
5. WHEN viewing transaction lists on tablets, THE System SHALL use card-based layout instead of wide tables where appropriate.
6. THE System SHALL maintain full functionality on tablet devices.

### Requirement 22: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and feedback, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a transaction save fails, THE System SHALL display a user-friendly error message explaining what went wrong.
2. WHEN form validation fails, THE System SHALL highlight invalid fields and display specific error messages next to each field.
3. WHEN a transaction is successfully saved, THE System SHALL display a success message with transaction ID.
4. WHEN loading data, THE System SHALL display a loading indicator to inform the user that processing is in progress.
5. IF a network error occurs, THE System SHALL display a message instructing the user to check their connection and retry.
6. THE System SHALL NOT display raw database error messages to end users.
7. THE System SHALL log detailed error information for administrator troubleshooting.

---

## Summary

This requirements document defines a simple, practical financial transaction management system for Define Horizon Company. The system enables employees to quickly record money transfer transactions with automatic commission calculation, while providing administrators with comprehensive analytics and oversight. The design prioritizes ease of use, data integrity, and role-based security without unnecessary complexity.