const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = process.env.PORT || 5000
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_SERVER_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY

// --- Supabase server client ---
const supabaseServer = SUPABASE_URL && SUPABASE_SERVER_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVER_KEY)
  : null

function requireSupabaseClient(req, res, next) {
  if (!SUPABASE_URL) {
    return res.status(503).json({
      error: 'Backend not configured: missing SUPABASE_URL. Add it to backend/.env or the workspace .env file.',
    })
  }

  if (!SUPABASE_SERVER_KEY) {
    return res.status(503).json({
      error: 'Backend not configured: missing SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY. Add one to backend/.env to enable API routes.',
    })
  }

  next()
}

function createRequestSupabaseClient(authHeader) {
  return createClient(SUPABASE_URL, SUPABASE_SERVER_KEY, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  })
}

// --- Middleware ---
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}))

// --- Auth middleware: validates Supabase JWT ---
async function requireAuth(req, res, next) {
  if (!supabaseServer) {
    return res.status(503).json({
      error: 'Backend auth is unavailable until SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY are configured.',
    })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' })
  }

  const requestSupabase = createRequestSupabaseClient(authHeader)
  const token = authHeader.slice(7)
  const { data: { user }, error } = await requestSupabase.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }

  req.user = user
  req.supabase = requestSupabase
  next()
}

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_SERVER_KEY),
    supabaseUrlPresent: Boolean(SUPABASE_URL),
    supabaseAuthMode: SUPABASE_SERVICE_ROLE_KEY ? 'service-role' : SUPABASE_ANON_KEY ? 'anon-jwt' : 'missing',
  })
})

// --- Study Sessions ---
app.get('/api/sessions', requireSupabaseClient, requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('start_time', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/sessions', requireSupabaseClient, requireAuth, async (req, res) => {
  const { topic, subject, start_time, end_time, duration, difficulty, notes } = req.body
  if (!topic || !start_time) return res.status(400).json({ error: 'topic and start_time are required.' })

  const { data, error } = await req.supabase
    .from('study_sessions')
    .insert({ user_id: req.user.id, topic, subject, start_time, end_time, duration, difficulty, notes })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

app.patch('/api/sessions/:id', requireSupabaseClient, requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('study_sessions')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Session not found.' })
  res.json(data)
})

app.delete('/api/sessions/:id', requireSupabaseClient, requireAuth, async (req, res) => {
  const { error } = await req.supabase
    .from('study_sessions')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

// --- Goals ---
app.get('/api/goals', requireSupabaseClient, requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('goals')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/goals', requireSupabaseClient, requireAuth, async (req, res) => {
  const { title, description, target_date, priority, progress } = req.body
  if (!title) return res.status(400).json({ error: 'title is required.' })

  const { data, error } = await req.supabase
    .from('goals')
    .insert({ user_id: req.user.id, title, description, target_date, priority, progress: progress ?? 0 })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

app.patch('/api/goals/:id', requireSupabaseClient, requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('goals')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Goal not found.' })
  res.json(data)
})

app.delete('/api/goals/:id', requireSupabaseClient, requireAuth, async (req, res) => {
  const { error } = await req.supabase
    .from('goals')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

// --- Skills ---
app.get('/api/skills', requireSupabaseClient, requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('skills')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/skills', requireSupabaseClient, requireAuth, async (req, res) => {
  const { name, category, proficiency, target_proficiency, color, hours_spent, difficulty } = req.body
  if (!name) return res.status(400).json({ error: 'name is required.' })

  const { data, error } = await req.supabase
    .from('skills')
    .insert({ user_id: req.user.id, name, category, proficiency: proficiency ?? 0, target_proficiency: target_proficiency ?? 100, color, hours_spent: hours_spent ?? 0, difficulty })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

app.patch('/api/skills/:id', requireSupabaseClient, requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('skills')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Skill not found.' })
  res.json(data)
})

app.delete('/api/skills/:id', requireSupabaseClient, requireAuth, async (req, res) => {
  const { error } = await req.supabase
    .from('skills')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

// --- Start ---
app.listen(PORT, () => {
  console.log(`StudyFlow API running on port ${PORT}`)

  if (!SUPABASE_URL) {
    console.warn('Missing SUPABASE_URL. Set backend/.env or workspace .env before using protected API routes.')
  }

  if (!SUPABASE_SERVER_KEY) {
    console.warn('Missing SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY. Protected API routes will return 503 until one is configured.')
  }
})
