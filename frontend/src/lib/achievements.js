export const ACHIEVEMENT_DEFINITIONS = [
  {
    code: 'first_study_session',
    title: 'First Study Session',
    description: 'Unlock when user logs first study session.',
    icon: 'BookOpen',
    category: 'Study Milestone',
    unlock_condition: 'study_sessions >= 1',
    isUnlocked: (stats) => stats.study_sessions >= 1,
  },
  {
    code: 'session_starter_10',
    title: 'Session Starter',
    description: 'Unlock when user logs 10 study sessions.',
    icon: 'BookOpen',
    category: 'Study Milestone',
    unlock_condition: 'study_sessions >= 10',
    isUnlocked: (stats) => stats.study_sessions >= 10,
  },
  {
    code: 'session_warrior_25',
    title: 'Session Warrior',
    description: 'Unlock when user logs 25 study sessions.',
    icon: 'BookOpen',
    category: 'Study Milestone',
    unlock_condition: 'study_sessions >= 25',
    isUnlocked: (stats) => stats.study_sessions >= 25,
  },
  {
    code: 'session_legend_50',
    title: 'Session Legend',
    description: 'Unlock when user logs 50 study sessions.',
    icon: 'Crown',
    category: 'Study Milestone',
    unlock_condition: 'study_sessions >= 50',
    isUnlocked: (stats) => stats.study_sessions >= 50,
  },
  {
    code: 'session_master_75',
    title: 'Session Master',
    description: 'Unlock when user logs 75 study sessions.',
    icon: 'BookOpen',
    category: 'Study Milestone',
    unlock_condition: 'study_sessions >= 75',
    isUnlocked: (stats) => stats.study_sessions >= 75,
  },
  {
    code: 'session_grandmaster_100',
    title: 'Session Grandmaster',
    description: 'Unlock when user logs 100 study sessions.',
    icon: 'Crown',
    category: 'Study Milestone',
    unlock_condition: 'study_sessions >= 100',
    isUnlocked: (stats) => stats.study_sessions >= 100,
  },
  {
    code: 'session_mythic_200',
    title: 'Session Mythic',
    description: 'Unlock when user logs 200 study sessions.',
    icon: 'Crown',
    category: 'Study Milestone',
    unlock_condition: 'study_sessions >= 200',
    isUnlocked: (stats) => stats.study_sessions >= 200,
  },
  {
    code: 'session_ultra_500',
    title: 'Session Ultra',
    description: 'Unlock when user logs 500 study sessions.',
    icon: 'Crown',
    category: 'Ultra Tier',
    unlock_condition: 'study_sessions >= 500',
    isUnlocked: (stats) => stats.study_sessions >= 500,
  },
  {
    code: 'study_streak_7',
    title: 'Study Streak',
    description: 'Unlock when user studies for 7 days continuously.',
    icon: 'Flame',
    category: 'Consistency',
    unlock_condition: 'streak_days >= 7',
    isUnlocked: (stats) => stats.streak_days >= 7,
  },
  {
    code: 'momentum_3',
    title: 'Momentum Builder',
    description: 'Unlock when user studies for 3 days in a row.',
    icon: 'Flame',
    category: 'Consistency',
    unlock_condition: 'streak_days >= 3',
    isUnlocked: (stats) => stats.streak_days >= 3,
  },
  {
    code: 'two_week_streak_14',
    title: 'Two Week Streak',
    description: 'Unlock when user studies for 14 days in a row.',
    icon: 'Flame',
    category: 'Consistency',
    unlock_condition: 'streak_days >= 14',
    isUnlocked: (stats) => stats.streak_days >= 14,
  },
  {
    code: 'three_week_streak_21',
    title: 'Three Week Streak',
    description: 'Unlock when user studies for 21 days in a row.',
    icon: 'Flame',
    category: 'Consistency',
    unlock_condition: 'streak_days >= 21',
    isUnlocked: (stats) => stats.streak_days >= 21,
  },
  {
    code: 'month_streak_30',
    title: 'Month Streak',
    description: 'Unlock when user studies for 30 days in a row.',
    icon: 'Flame',
    category: 'Consistency',
    unlock_condition: 'streak_days >= 30',
    isUnlocked: (stats) => stats.streak_days >= 30,
  },
  {
    code: 'streak_45',
    title: 'Consistency Elite',
    description: 'Unlock when user studies for 45 days in a row.',
    icon: 'Flame',
    category: 'Consistency',
    unlock_condition: 'streak_days >= 45',
    isUnlocked: (stats) => stats.streak_days >= 45,
  },
  {
    code: 'streak_60',
    title: 'Unbreakable Routine',
    description: 'Unlock when user studies for 60 days in a row.',
    icon: 'Flame',
    category: 'Consistency',
    unlock_condition: 'streak_days >= 60',
    isUnlocked: (stats) => stats.streak_days >= 60,
  },
  {
    code: 'streak_90',
    title: 'Streak Titan',
    description: 'Unlock when user studies for 90 days in a row.',
    icon: 'Crown',
    category: 'Consistency',
    unlock_condition: 'streak_days >= 90',
    isUnlocked: (stats) => stats.streak_days >= 90,
  },
  {
    code: 'streak_ultra_365',
    title: 'Year of Discipline',
    description: 'Unlock when user studies for 365 days in a row.',
    icon: 'Crown',
    category: 'Ultra Tier',
    unlock_condition: 'streak_days >= 365',
    isUnlocked: (stats) => stats.streak_days >= 365,
  },
  {
    code: 'goal_crusher_5',
    title: 'Goal Crusher',
    description: 'Unlock when user completes 5 goals.',
    icon: 'Target',
    category: 'Goals',
    unlock_condition: 'completed_goals >= 5',
    isUnlocked: (stats) => stats.completed_goals >= 5,
  },
  {
    code: 'goal_hunter_10',
    title: 'Goal Hunter',
    description: 'Unlock when user completes 10 goals.',
    icon: 'Target',
    category: 'Goals',
    unlock_condition: 'completed_goals >= 10',
    isUnlocked: (stats) => stats.completed_goals >= 10,
  },
  {
    code: 'goal_dominator_15',
    title: 'Goal Dominator',
    description: 'Unlock when user completes 15 goals.',
    icon: 'Target',
    category: 'Goals',
    unlock_condition: 'completed_goals >= 15',
    isUnlocked: (stats) => stats.completed_goals >= 15,
  },
  {
    code: 'goal_champion_30',
    title: 'Goal Champion',
    description: 'Unlock when user completes 30 goals.',
    icon: 'Target',
    category: 'Goals',
    unlock_condition: 'completed_goals >= 30',
    isUnlocked: (stats) => stats.completed_goals >= 30,
  },
  {
    code: 'goal_legend_50',
    title: 'Goal Legend',
    description: 'Unlock when user completes 50 goals.',
    icon: 'Crown',
    category: 'Goals',
    unlock_condition: 'completed_goals >= 50',
    isUnlocked: (stats) => stats.completed_goals >= 50,
  },
  {
    code: 'goal_immortal_100',
    title: 'Goal Immortal',
    description: 'Unlock when user completes 100 goals.',
    icon: 'Crown',
    category: 'Goals',
    unlock_condition: 'completed_goals >= 100',
    isUnlocked: (stats) => stats.completed_goals >= 100,
  },
  {
    code: 'goal_ultra_250',
    title: 'Goal Apex',
    description: 'Unlock when user completes 250 goals.',
    icon: 'Crown',
    category: 'Ultra Tier',
    unlock_condition: 'completed_goals >= 250',
    isUnlocked: (stats) => stats.completed_goals >= 250,
  },
  {
    code: 'focused_learner_10h',
    title: 'Focused Learner',
    description: 'Unlock when user studies 10 hours total.',
    icon: 'Clock',
    category: 'Study Time',
    unlock_condition: 'total_study_hours >= 10',
    isUnlocked: (stats) => stats.total_study_hours >= 10,
  },
  {
    code: 'deep_work_25h',
    title: 'Deep Work',
    description: 'Unlock when user studies 25 hours total.',
    icon: 'Clock',
    category: 'Study Time',
    unlock_condition: 'total_study_hours >= 25',
    isUnlocked: (stats) => stats.total_study_hours >= 25,
  },
  {
    code: 'marathon_learner_50h',
    title: 'Marathon Learner',
    description: 'Unlock when user studies 50 hours total.',
    icon: 'Clock',
    category: 'Study Time',
    unlock_condition: 'total_study_hours >= 50',
    isUnlocked: (stats) => stats.total_study_hours >= 50,
  },
  {
    code: 'endurance_75h',
    title: 'Endurance Learner',
    description: 'Unlock when user studies 75 hours total.',
    icon: 'Clock',
    category: 'Study Time',
    unlock_condition: 'total_study_hours >= 75',
    isUnlocked: (stats) => stats.total_study_hours >= 75,
  },
  {
    code: 'time_master_100h',
    title: 'Time Master',
    description: 'Unlock when user studies 100 hours total.',
    icon: 'Clock',
    category: 'Study Time',
    unlock_condition: 'total_study_hours >= 100',
    isUnlocked: (stats) => stats.total_study_hours >= 100,
  },
  {
    code: 'time_titan_200h',
    title: 'Time Titan',
    description: 'Unlock when user studies 200 hours total.',
    icon: 'Crown',
    category: 'Study Time',
    unlock_condition: 'total_study_hours >= 200',
    isUnlocked: (stats) => stats.total_study_hours >= 200,
  },
  {
    code: 'time_ultra_500h',
    title: 'Time Sovereign',
    description: 'Unlock when user studies 500 hours total.',
    icon: 'Crown',
    category: 'Ultra Tier',
    unlock_condition: 'total_study_hours >= 500',
    isUnlocked: (stats) => stats.total_study_hours >= 500,
  },
  {
    code: 'master_learner_25_goals',
    title: 'Master Learner',
    description: 'Unlock when user completes 25 goals.',
    icon: 'Crown',
    category: 'Mastery',
    unlock_condition: 'completed_goals >= 25',
    isUnlocked: (stats) => stats.completed_goals >= 25,
  },
  {
    code: 'resource_scout_5',
    title: 'Resource Scout',
    description: 'Unlock when user adds 5 learning resources.',
    icon: 'Library',
    category: 'Resources',
    unlock_condition: 'resources_added >= 5',
    isUnlocked: (stats) => stats.resources_added >= 5,
  },
  {
    code: 'resource_curator_10',
    title: 'Resource Curator',
    description: 'Unlock when user adds 10 learning resources.',
    icon: 'Library',
    category: 'Resources',
    unlock_condition: 'resources_added >= 10',
    isUnlocked: (stats) => stats.resources_added >= 10,
  },
  {
    code: 'resource_architect_30',
    title: 'Resource Architect',
    description: 'Unlock when user adds 30 learning resources.',
    icon: 'Library',
    category: 'Resources',
    unlock_condition: 'resources_added >= 30',
    isUnlocked: (stats) => stats.resources_added >= 30,
  },
  {
    code: 'resource_librarian_50',
    title: 'Resource Librarian',
    description: 'Unlock when user adds 50 learning resources.',
    icon: 'Library',
    category: 'Resources',
    unlock_condition: 'resources_added >= 50',
    isUnlocked: (stats) => stats.resources_added >= 50,
  },
  {
    code: 'resource_scholar_75',
    title: 'Resource Scholar',
    description: 'Unlock when user adds 75 learning resources.',
    icon: 'Library',
    category: 'Resources',
    unlock_condition: 'resources_added >= 75',
    isUnlocked: (stats) => stats.resources_added >= 75,
  },
  {
    code: 'resource_museum_100',
    title: 'Knowledge Museum',
    description: 'Unlock when user adds 100 learning resources.',
    icon: 'Crown',
    category: 'Resources',
    unlock_condition: 'resources_added >= 100',
    isUnlocked: (stats) => stats.resources_added >= 100,
  },
  {
    code: 'resource_ultra_250',
    title: 'Resource Empire',
    description: 'Unlock when user adds 250 learning resources.',
    icon: 'Crown',
    category: 'Ultra Tier',
    unlock_condition: 'resources_added >= 250',
    isUnlocked: (stats) => stats.resources_added >= 250,
  },
  {
    code: 'night_owl_5',
    title: 'Night Owl',
    description: 'Unlock when user studies after midnight 5 times.',
    icon: 'Moon',
    category: 'Hidden',
    unlock_condition: 'after_midnight_sessions >= 5',
    hidden: true,
    isUnlocked: (stats) => stats.after_midnight_sessions >= 5,
  },
  {
    code: 'consistency_champion_30',
    title: 'Consistency Champion',
    description: 'Unlock when user studies every day for 30 days.',
    icon: 'CalendarCheck',
    category: 'Hidden',
    unlock_condition: 'streak_days >= 30',
    hidden: true,
    isUnlocked: (stats) => stats.streak_days >= 30,
  },
  {
    code: 'knowledge_collector_20',
    title: 'Knowledge Collector',
    description: 'Unlock when user adds 20 learning resources.',
    icon: 'Library',
    category: 'Hidden',
    unlock_condition: 'resources_added >= 20',
    hidden: true,
    isUnlocked: (stats) => stats.resources_added >= 20,
  },
]

export function getStudyStreakDays(sessions) {
  const daySet = new Set(
    sessions.map((session) => {
      const d = new Date(session.start_time ?? session.created_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )

  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (daySet.has(cursor.getTime())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function getAfterMidnightStudyCount(sessions) {
  return sessions.reduce((count, session) => {
    const dt = new Date(session.start_time ?? session.created_at)
    const hour = dt.getHours()
    return hour >= 0 && hour < 5 ? count + 1 : count
  }, 0)
}

export function getAchievementStats({ sessions, completedGoals, resources = [] }) {
  const totalMinutes = sessions.reduce((sum, session) => sum + Number(session.duration ?? 0), 0)

  return {
    study_sessions: sessions.length,
    streak_days: getStudyStreakDays(sessions),
    completed_goals: completedGoals.length,
    total_study_hours: totalMinutes / 60,
    after_midnight_sessions: getAfterMidnightStudyCount(sessions),
    resources_added: resources.length,
  }
}

export function getAchievementProgress(code, stats) {
  switch (code) {
    case 'first_study_session':
      return {
        current: stats.study_sessions,
        target: 1,
        label: 'sessions',
      }
    case 'study_streak_7':
      return {
        current: stats.streak_days,
        target: 7,
        label: 'days',
      }
    case 'momentum_3':
      return {
        current: stats.streak_days,
        target: 3,
        label: 'days',
      }
    case 'two_week_streak_14':
      return {
        current: stats.streak_days,
        target: 14,
        label: 'days',
      }
    case 'three_week_streak_21':
      return {
        current: stats.streak_days,
        target: 21,
        label: 'days',
      }
    case 'month_streak_30':
      return {
        current: stats.streak_days,
        target: 30,
        label: 'days',
      }
    case 'streak_45':
      return {
        current: stats.streak_days,
        target: 45,
        label: 'days',
      }
    case 'streak_60':
      return {
        current: stats.streak_days,
        target: 60,
        label: 'days',
      }
    case 'streak_90':
      return {
        current: stats.streak_days,
        target: 90,
        label: 'days',
      }
    case 'streak_ultra_365':
      return {
        current: stats.streak_days,
        target: 365,
        label: 'days',
      }
    case 'goal_crusher_5':
      return {
        current: stats.completed_goals,
        target: 5,
        label: 'goals',
      }
    case 'goal_hunter_10':
      return {
        current: stats.completed_goals,
        target: 10,
        label: 'goals',
      }
    case 'goal_dominator_15':
      return {
        current: stats.completed_goals,
        target: 15,
        label: 'goals',
      }
    case 'goal_champion_30':
      return {
        current: stats.completed_goals,
        target: 30,
        label: 'goals',
      }
    case 'goal_legend_50':
      return {
        current: stats.completed_goals,
        target: 50,
        label: 'goals',
      }
    case 'goal_immortal_100':
      return {
        current: stats.completed_goals,
        target: 100,
        label: 'goals',
      }
    case 'goal_ultra_250':
      return {
        current: stats.completed_goals,
        target: 250,
        label: 'goals',
      }
    case 'focused_learner_10h':
      return {
        current: stats.total_study_hours,
        target: 10,
        label: 'study hours',
      }
    case 'deep_work_25h':
      return {
        current: stats.total_study_hours,
        target: 25,
        label: 'study hours',
      }
    case 'marathon_learner_50h':
      return {
        current: stats.total_study_hours,
        target: 50,
        label: 'study hours',
      }
    case 'endurance_75h':
      return {
        current: stats.total_study_hours,
        target: 75,
        label: 'study hours',
      }
    case 'time_master_100h':
      return {
        current: stats.total_study_hours,
        target: 100,
        label: 'study hours',
      }
    case 'time_titan_200h':
      return {
        current: stats.total_study_hours,
        target: 200,
        label: 'study hours',
      }
    case 'time_ultra_500h':
      return {
        current: stats.total_study_hours,
        target: 500,
        label: 'study hours',
      }
    case 'master_learner_25_goals':
      return {
        current: stats.completed_goals,
        target: 25,
        label: 'goals',
      }
    case 'session_starter_10':
      return {
        current: stats.study_sessions,
        target: 10,
        label: 'sessions',
      }
    case 'session_warrior_25':
      return {
        current: stats.study_sessions,
        target: 25,
        label: 'sessions',
      }
    case 'session_legend_50':
      return {
        current: stats.study_sessions,
        target: 50,
        label: 'sessions',
      }
    case 'session_master_75':
      return {
        current: stats.study_sessions,
        target: 75,
        label: 'sessions',
      }
    case 'session_grandmaster_100':
      return {
        current: stats.study_sessions,
        target: 100,
        label: 'sessions',
      }
    case 'session_mythic_200':
      return {
        current: stats.study_sessions,
        target: 200,
        label: 'sessions',
      }
    case 'session_ultra_500':
      return {
        current: stats.study_sessions,
        target: 500,
        label: 'sessions',
      }
    case 'resource_scout_5':
      return {
        current: stats.resources_added,
        target: 5,
        label: 'resources',
      }
    case 'resource_curator_10':
      return {
        current: stats.resources_added,
        target: 10,
        label: 'resources',
      }
    case 'resource_architect_30':
      return {
        current: stats.resources_added,
        target: 30,
        label: 'resources',
      }
    case 'resource_librarian_50':
      return {
        current: stats.resources_added,
        target: 50,
        label: 'resources',
      }
    case 'resource_scholar_75':
      return {
        current: stats.resources_added,
        target: 75,
        label: 'resources',
      }
    case 'resource_museum_100':
      return {
        current: stats.resources_added,
        target: 100,
        label: 'resources',
      }
    case 'resource_ultra_250':
      return {
        current: stats.resources_added,
        target: 250,
        label: 'resources',
      }
    case 'night_owl_5':
      return {
        current: stats.after_midnight_sessions,
        target: 5,
        label: 'late-night sessions',
      }
    case 'consistency_champion_30':
      return {
        current: stats.streak_days,
        target: 30,
        label: 'days',
      }
    case 'knowledge_collector_20':
      return {
        current: stats.resources_added,
        target: 20,
        label: 'resources',
      }
    default:
      return {
        current: 0,
        target: 1,
        label: 'progress',
      }
  }
}
