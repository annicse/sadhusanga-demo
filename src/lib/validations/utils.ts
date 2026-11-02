import type { z } from 'zod'

/** Formats the first Zod issue as "field: message" for the existing `{ error }` UI contract. */
export function firstIssueMessage(error: z.ZodError): string {
    const issue = error.issues[0]
    const path = issue.path.join('.')
    return path ? `${path}: ${issue.message}` : issue.message
}

/** Per-field error map, handy for forms that want inline messages. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
    const out: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join('.') || '_form'
        if (!(key in out)) out[key] = issue.message
    }
    return out
}
