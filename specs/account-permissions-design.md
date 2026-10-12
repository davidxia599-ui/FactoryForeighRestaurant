# Account management and permissions

## Scope

- Administrators can create user accounts and assign module permissions.
- New accounts start with every module permission disabled.
- Existing accounts retain access to the existing business modules; account management is disabled for existing non-admin users.
- Any signed-in user can change their own password after confirming the current password.

## Component map

- `SettingsView.vue`: composes profile, tenant/language settings, password change, and admin-only account management.
- `PasswordChangeForm.vue`: collects current/new/confirmation passwords and emits a validated change request.
- `UserManagement.vue`: loads account data and coordinates account creation and permission updates.
- `UserCreateForm.vue`: collects a username, initial password, and initial module permissions.
- `UserPermissionList.vue`: displays accounts and emits explicit permission updates.

## Permission model

The six module permissions are dashboard, purchases, items, reports, tenants, and users. Administrators bypass module checks. Backend route middleware reads current role and permission flags from SQL Server for every protected operation, so a permission change takes effect immediately. UI navigation and controls reflect the same permission model but are not an authorization boundary.

Dashboard reads are permitted by the dashboard permission; item/category reads needed by dashboard or purchase workflows are allowed to those modules. Tenant listing remains available to authenticated users for existing tenant selection; creating/updating tenants requires the tenant-management permission.

## Security

- Account administration endpoints require an authenticated administrator or an explicitly authorized account manager.
- Account creation validates username, password length, tenant, and boolean permission values; SQL values use parameters.
- Account responses never contain password hashes.
- Password changes require the authenticated user's current password and store only a bcrypt hash.
- Permission changes are logged without secrets.

## Validation

- Build client and server.
- Verify database migration is idempotent and legacy users receive preserved/default permissions.
- Verify unauthorized API calls return 403, administrators can manage accounts, permissions take effect immediately, and users can only change their own password with a valid current password.
