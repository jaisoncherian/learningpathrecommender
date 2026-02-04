/**
 * Progress Storage Module
 * Manages user progress data in localStorage
 */

const STORAGE_KEY = 'pathpilot_user_progress';

// Initialize default user progress structure
function getDefaultProgress() {
    return {
        total_xp: 0,
        courses_completed: 0,
        quizzes_passed: 0,
        quizzes_attempted: 0,
        perfect_quizzes: 0,
        streak_days: 0,
        last_activity_date: null,
        unique_skills: 0,
        paths_generated: 0,
        early_completions: 0,
        late_completions: 0,
        unlocked_achievements: [],
        completed_courses: [],
        completed_quizzes: [],
        skills_learned: [],
        username: 'Pilot',
        last_notified_level: 1
    };
}

// Load user progress from localStorage
function loadProgress() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
    return getDefaultProgress();
}

// Save user progress to localStorage
function saveProgress(progress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        return true;
    } catch (error) {
        console.error('Error saving progress:', error);
        return false;
    }
}

// Update XP and check for level up
async function addXP(amount, source = 'unknown', existingProgress = null) {
    const progress = existingProgress || loadProgress();
    const oldXP = progress.total_xp;
    progress.total_xp += amount;

    if (!existingProgress) {
        saveProgress(progress);
    }

    // Check for level changes
    const oldLevel = await calculateLevel(oldXP);
    const newLevel = await calculateLevel(progress.total_xp);

    const leveledUp = newLevel.current_level > oldLevel.current_level;

    return {
        xp_earned: amount,
        total_xp: progress.total_xp,
        leveled_up: leveledUp,
        new_level: newLevel,
        source: source
    };
}

// Mark a course as completed
async function completeCourse(courseId, courseTitle, difficulty, skills) {
    const progress = loadProgress();

    // Check if already completed
    if (progress.completed_courses.includes(courseId)) {
        return { already_completed: true };
    }

    // Add to completed courses
    progress.completed_courses.push(courseId);
    progress.courses_completed++;

    // Update unique skills
    skills.forEach(skill => {
        if (!progress.skills_learned.includes(skill)) {
            progress.skills_learned.push(skill);
        }
    });
    progress.unique_skills = progress.skills_learned.length;

    // Check time of day for achievements
    const hour = new Date().getHours();
    if (hour < 9) {
        progress.early_completions++;
    } else if (hour >= 22) {
        progress.late_completions++;
    }

    // Update streak
    updateStreak(progress);

    // Calculate XP
    const xpResult = await addXP(50 * (difficulty === 'Advanced' ? 2 : difficulty === 'Intermediate' ? 1.5 : 1), 'course_complete', progress);

    saveProgress(progress);

    // Check for new achievements
    const achievements = await checkAchievements(progress);

    return {
        success: true,
        xp_result: xpResult,
        new_achievements: achievements.newly_unlocked,
        progress: progress
    };
}

// Mark a quiz as completed
async function completeQuiz(quizId, skill, score, isPerfect) {
    const progress = loadProgress();

    // Add to completed quizzes
    if (!progress.completed_quizzes.includes(quizId)) {
        progress.completed_quizzes.push(quizId);
    }

    // Increment attempted count
    progress.quizzes_attempted = (progress.quizzes_attempted || 0) + 1;

    if (score >= 60) {
        progress.quizzes_passed++;
    }

    if (isPerfect) {
        progress.perfect_quizzes++;
    }

    // Update streak
    updateStreak(progress);

    // Calculate XP
    const xpAmount = isPerfect ? 100 : (score >= 60 ? 30 : 10);
    const xpResult = await addXP(xpAmount, 'quiz_complete', progress);

    saveProgress(progress);

    // Check for new achievements
    const achievements = await checkAchievements(progress);

    return {
        success: true,
        xp_result: xpResult,
        new_achievements: achievements.newly_unlocked,
        progress: progress
    };
}

// Record path generation
function recordPathGeneration() {
    const progress = loadProgress();
    progress.paths_generated++;
    saveProgress(progress);
    return progress;
}

// Update streak tracking
function updateStreak(progress) {
    const today = new Date().toDateString();
    const lastActivity = progress.last_activity_date;

    if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const daysDiff = Math.floor((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
            // Consecutive day
            progress.streak_days++;
        } else if (daysDiff > 1) {
            // Streak broken
            progress.streak_days = 1;
        }
        // If same day, don't change streak
    } else {
        // First activity
        progress.streak_days = 1;
    }

    progress.last_activity_date = today;
}

// Calculate level from XP
async function calculateLevel(xp) {
    try {
        const data = await window.apiCall('/progress/level', 'POST', { xp: xp });
        return data.level_info;
    } catch (error) {
        console.error('Error calculating level:', error);
        return { current_level: 1, current_title: 'Novice' };
    }
}

// Check for newly unlocked achievements
async function checkAchievements(userStats) {
    try {
        const data = await window.apiCall('/progress/achievements/check', 'POST', { user_stats: userStats });

        // Update unlocked achievements in progress
        if (data.newly_unlocked && data.newly_unlocked.length > 0) {
            const progress = loadProgress();
            data.newly_unlocked.forEach(achievement => {
                if (!progress.unlocked_achievements.includes(achievement.id)) {
                    progress.unlocked_achievements.push(achievement.id);
                    // Add achievement points to XP
                    progress.total_xp += achievement.points;
                }
            });
            saveProgress(progress);
        }

        return data;
    } catch (error) {
        console.error('Error checking achievements:', error);
        return { newly_unlocked: [] };
    }
}

// Reset all progress (for testing)
function resetProgress() {
    const confirmed = confirm('Are you sure you want to reset all progress? This cannot be undone.');
    if (confirmed) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

// Export functions
window.ProgressStorage = {
    loadProgress,
    saveProgress,
    addXP,
    completeCourse,
    completeQuiz,
    recordPathGeneration,
    calculateLevel,
    checkAchievements,
    resetProgress
};
