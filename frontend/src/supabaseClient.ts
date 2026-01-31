import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iuxapijvuydijgqvojkg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eGFwaWp2dXlkaWpncXZvamtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDA5ODEsImV4cCI6MjA4NTQxNjk4MX0.KkfBtWcbMPhqUpaVauZW_fKBpYHIsuRDvR79wscGA-k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
