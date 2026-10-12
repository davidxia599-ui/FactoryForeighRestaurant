import './env'

function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required.')
  }
  return jwtSecret
}

const jwtSecret: string = getJwtSecret()

export default jwtSecret
