import '../config/env'
import bcrypt from 'bcryptjs'
import sql from 'mssql'
import { getPool } from '../config/database'

const username = (process.env.INITIAL_ADMIN_USERNAME || 'admin').trim()
const password = process.env.INITIAL_ADMIN_PASSWORD

async function setAdminPassword() {
  if (!username || username.length > 50) {
    throw new Error('INITIAL_ADMIN_USERNAME must be between 1 and 50 characters.')
  }
  if (!password || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Set INITIAL_ADMIN_PASSWORD to a password of at least 6 characters and no more than 72 UTF-8 bytes.')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const pool = await getPool()

  try {
    const result = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .query<{ id: number }>(`
        SET NOCOUNT ON;
        SET XACT_ABORT ON;

        BEGIN TRY
          BEGIN TRANSACTION;

          DECLARE @accountCount INT = (
            SELECT COUNT(*)
            FROM users WITH (UPDLOCK, HOLDLOCK)
            WHERE username = @username
          );

          IF @accountCount = 0
            THROW 51003, 'The requested account does not exist.', 1;
          IF @accountCount > 1
            THROW 51004, 'The username matches multiple accounts; password was not changed.', 1;

          UPDATE users
          SET password_hash = @passwordHash
          OUTPUT INSERTED.id
          WHERE username = @username;

          COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
          THROW;
        END CATCH;
      `)

    if (result.recordset.length !== 1) {
      throw new Error('Password update did not affect exactly one account.')
    }

    console.log(`Password initialized for "${username}".`)
  } finally {
    await pool.close()
  }
}

setAdminPassword().catch((error: unknown) => {
  console.error('Could not initialize the administrator password:', error)
  process.exitCode = 1
})
