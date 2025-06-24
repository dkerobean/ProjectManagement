// Temporary simple auth handlers for build testing
export const handlers = {
    GET: async () => new Response('Auth disabled for build', { status: 200 }),
    POST: async () => new Response('Auth disabled for build', { status: 200 }),
}

export const signIn = () => Promise.resolve()
export const signOut = () => Promise.resolve()
export const auth = () => Promise.resolve(null)
