import { z, ZodError } from 'zod'

export function validationError(error: unknown) {
  if (error instanceof ZodError) {
    return createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: z.treeifyError(error),
    })
  }

  return error
}

export function isDuplicatePlaceError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  return error.message.includes('UNIQUE constraint failed: pharmacies.google_place_id')
    || error.message.includes('SQLITE_CONSTRAINT')
}
