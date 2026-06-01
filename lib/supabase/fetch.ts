// Helper para hacer fetches autenticados a Supabase desde el cliente
const SUPABASE_URL = 'https://jzmuwrmizggtsnkrgens.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXV3cm1pemdndHNua3JnZW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDgzMTgsImV4cCI6MjA5NTgyNDMxOH0.PJcjbArbCMa3RZZa-0jtMYj_nn5MRiE4Zt3ZJD2dHE8'

function getToken(): string {
  try {
    const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
    return session.access_token || SUPABASE_ANON_KEY
  } catch {
    return SUPABASE_ANON_KEY
  }
}

export async function sbFetch(table: string, params = ''): Promise<any[]> {
  const token = getToken()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  })
  return res.json()
}
