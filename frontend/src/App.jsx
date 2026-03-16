import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Dashboard from './pages/app/Dashboard'
import StudyTracker from './pages/app/StudyTracker'
import Goals from './pages/app/Goals'
import DailyChallenges from './pages/app/DailyChallenges'
import Analytics from './pages/app/Analytics'
import CalendarPage from './pages/app/CalendarPage'
import Notes from './pages/app/Notes'
import Resources from './pages/app/Resources'
import Faq from './pages/app/Faq'
import Settings from './pages/app/Settings'
import TopicMastery from './pages/app/TopicMastery'
import Achievements from './pages/app/Achievements'
import Habits from './pages/app/Habits'
import ResetPassword from './pages/auth/ResetPassword'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tracker" element={<StudyTracker />} />
        <Route path="goals" element={<Goals />} />
        <Route path="challenges" element={<DailyChallenges />} />
        <Route path="mastery" element={<TopicMastery />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="habits" element={<Habits />} />
        <Route path="notes" element={<Notes />} />
        <Route path="resources" element={<Resources />} />
        <Route path="faq" element={<Faq />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/achievements" element={<Navigate to="/app/achievements" replace />} />
      <Route path="/challenges" element={<Navigate to="/app/challenges" replace />} />
      <Route path="/daily-challenges" element={<Navigate to="/app/challenges" replace />} />
      <Route path="/app/daily-challenges" element={<Navigate to="/app/challenges" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
