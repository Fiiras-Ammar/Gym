// Stub file - Supabase replaced by Django backend
// This file exists for backwards compatibility only
// All functionality now uses the Django API at @/lib/api

export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ error: new Error("Supabase disabled - use Django API") }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
    insert: async () => ({ error: new Error("Supabase disabled - use Django API") }),
    update: async () => ({ error: new Error("Supabase disabled - use Django API") }),
    delete: async () => ({ error: new Error("Supabase disabled - use Django API") }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ error: new Error("Supabase disabled - use Django API") }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
  functions: {
    invoke: async () => ({ error: new Error("Supabase disabled - use Django API") }),
  },
} as any;