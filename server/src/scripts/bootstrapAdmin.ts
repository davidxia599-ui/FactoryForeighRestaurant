import '../config/env'
import bcrypt from 'bcryptjs'
import sql from 'mssql'
import { getPool } from '../config/database'

const username = process.env.INITIAL_ADMIN_USERNAME?.trim()
const password = process.env.INITIAL_ADMIN_PASSWORD
const tenantIdValue = process.env.INITIAL_ADMIN_TENANT_ID

async function bootstrapAdmin() {
  if (!username || !password) {
    throw new Error('Set INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD in the local environment.')
  }
  if (username.length > 50) {
    throw new Error('INITIAL_ADMIN_USERNAME must be 50 characters or fewer.')
  }
  if (password.length < 6) {
    throw new Error('INITIAL_ADMIN_PASSWORD must be at least 6 characters.')
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('INITIAL_ADMIN_PASSWORD must be no more than 72 UTF-8 bytes.')
  }

  let tenantId: number | null = null
  if (tenantIdValue) {
    const parsedTenantId = Number(tenantIdValue)
    if (!Number.isSafeInteger(parsedTenantId) || parsedTenantId <= 0) {
      throw new Error('INITIAL_ADMIN_TENANT_ID must be a positive integer.')
    }
    tenantId = parsedTenantId
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const pool = await getPool()
  try {
    const request = pool.request()
      .input('username', sql.NVarChar(50), username)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .input('requestedTenantId', sql.Int, tenantId)

    const result = await request.query<{ id: number; tenant_id: number }>(`
      SET NOCOUNT ON;
      SET XACT_ABORT ON;

      BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM users WHERE username = @username)
          THROW 51000, 'An account with this username already exists.', 1;

        DECLARE @tenantCount INT = (SELECT COUNT(*) FROM tenants);
        DECLARE @tenantId INT;

        IF @requestedTenantId IS NOT NULL
        BEGIN
          SELECT @tenantId = id FROM tenants WHERE id = @requestedTenantId;
          IF @tenantId IS NULL
            THROW 51001, 'The selected tenant does not exist.', 1;
        END
        ELSE IF @tenantCount = 0
        BEGIN
          INSERT INTO tenants (name) VALUES (N'預設餐廳');
          SET @tenantId = SCOPE_IDENTITY();
        END
        ELSE IF @tenantCount = 1
        BEGIN
          SELECT TOP (1) @tenantId = id FROM tenants ORDER BY id;
        END
        ELSE
        BEGIN
          THROW 51002, 'Set INITIAL_ADMIN_TENANT_ID when the database has multiple tenants.', 1;
        END;

        INSERT INTO users (
          tenant_id,
          username,
          password_hash,
          role,
          can_view_dashboard,
          can_manage_purchases,
          can_manage_items,
          can_view_reports,
          can_manage_tenants,
          can_manage_users
        )
        OUTPUT INSERTED.id, INSERTED.tenant_id
        VALUES (
          @tenantId,
          @username,
          @passwordHash,
          'admin',
          1,
          1,
          1,
          1,
          1,
          1
        );

        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `)

    const created = result.recordset[0]
    console.log(`Created administrator "${username}" for tenant ${created.tenant_id}.`)
  } finally {
    await pool.close()
  }
}

bootstrapAdmin().catch((error: unknown) => {
  console.error('Could not create the initial administrator:', error)
  process.exitCode = 1
})
