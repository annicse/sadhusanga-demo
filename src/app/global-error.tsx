'use client'

/**
 * Last-resort error boundary: catches errors thrown by the root layout itself.
 * It must render its own <html> and <body> because the root layout is gone.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="en">
            <body style={{ margin: 0, background: '#09090b', color: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
                <main style={{ maxWidth: 480, margin: '15vh auto', padding: 24, textAlign: 'center' }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sadhusanga hit an unexpected error</h1>
                    <p style={{ color: '#a1a1aa', fontSize: 14 }}>
                        {error.message || 'Please reload the app.'}
                    </p>
                    {error.digest && (
                        <p style={{ color: '#52525b', fontSize: 11, fontFamily: 'monospace' }}>ref: {error.digest}</p>
                    )}
                    <button
                        onClick={reset}
                        style={{
                            marginTop: 16, padding: '8px 16px', borderRadius: 8,
                            border: '1px solid #3f3f46', background: '#18181b', color: '#fafafa', cursor: 'pointer',
                        }}
                    >
                        Try again
                    </button>
                </main>
            </body>
        </html>
    )
}
