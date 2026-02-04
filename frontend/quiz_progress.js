/**
 * Quiz and Progress Features
 * This file contains quiz functionality and progress tracking integration
 */

// Quiz State
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};

// DOM Elements for Quiz
const quizModal = document.getElementById('quiz-modal');
const quizClose = document.getElementById('quiz-close');
const quizTitle = document.getElementById('quiz-title');
const quizProgress = document.getElementById('quiz-progress');
const quizBody = document.getElementById('quiz-body');

// DOM Elements for Progress
const headerLevel = document.getElementById('header-level');
const headerXP = document.getElementById('header-xp');
const headerXPBar = document.getElementById('header-xp-bar');

// Achievement Notification
const achievementNotification = document.getElementById('achievement-notification');

// ==================== QUIZ FUNCTIONS ====================

async function startQuiz(skills, difficulty = 'Beginner') {
    try {
        const response = await apiCall('/quiz/generate', 'POST', {
            skill: Array.isArray(skills) ? skills : [skills],
            difficulty: difficulty,
            num_questions: 10
        });

        if (response.success) {
            currentQuiz = response.quiz;
            currentQuestionIndex = 0;
            userAnswers = {};

            quizTitle.textContent = `${currentQuiz.skill} Quiz - ${difficulty}`;
            showQuizModal();
            displayQuestion();
        }
    } catch (error) {
        console.error('Error starting quiz:', error);
        alert('Failed to load quiz. Please try again.');
    }
}

function showQuizModal() {
    quizModal.classList.remove('hidden');
}

function hideQuizModal() {
    quizModal.classList.add('hidden');
    currentQuiz = null;
}

function displayQuestion() {
    if (!currentQuiz || currentQuestionIndex >= currentQuiz.questions.length) {
        return;
    }

    const question = currentQuiz.questions[currentQuestionIndex];
    const totalQuestions = currentQuiz.questions.length;

    quizProgress.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;

    const html = `
        <div class="quiz-question">
            <h4>${escapeHtml(question.question)}</h4>
            <div class="quiz-options">
                ${question.options.map((option, index) => `
                    <button class="quiz-option" data-index="${index}" onclick="selectAnswer(${index})">
                        ${escapeHtml(option)}
                    </button>
                `).join('')}
            </div>
        </div>
        <div class="quiz-actions">
            ${currentQuestionIndex > 0 ? '<button class="btn-secondary" onclick="previousQuestion()">Previous</button>' : ''}
            ${currentQuestionIndex < totalQuestions - 1
            ? '<button class="btn-primary" onclick="nextQuestion()">Next</button>'
            : '<button class="btn-primary btn-success" onclick="submitQuiz()">Submit Quiz</button>'
        }
        </div>
    `;

    quizBody.innerHTML = html;

    // Restore previous answer if exists
    if (userAnswers[question.id] !== undefined) {
        const buttons = quizBody.querySelectorAll('.quiz-option');
        buttons[userAnswers[question.id]].classList.add('selected');
    }
}

function selectAnswer(answerIndex) {
    const question = currentQuiz.questions[currentQuestionIndex];
    userAnswers[question.id] = answerIndex;

    // Update UI
    const buttons = quizBody.querySelectorAll('.quiz-option');
    buttons.forEach(btn => btn.classList.remove('selected'));
    buttons[answerIndex].classList.add('selected');
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

async function submitQuiz() {
    if (Object.keys(userAnswers).length < currentQuiz.questions.length) {
        if (!confirm('You haven\'t answered all questions. Submit anyway?')) {
            return;
        }
    }

    try {
        const response = await apiCall('/quiz/evaluate', 'POST', {
            quiz_id: currentQuiz.quiz_id,
            answers: userAnswers
        });

        if (response.success) {
            const results = response.results;
            displayQuizResults(results);

            // Update progress
            const progressResult = await ProgressStorage.completeQuiz(
                currentQuiz.quiz_id,
                currentQuiz.skill,
                results.score_percentage,
                results.score_percentage === 100
            );

            // Refresh progress display
            await updateProgressDisplay();
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        alert('Failed to submit quiz. Please try again.');
    }
}

function displayQuizResults(results) {
    const html = `
        <div class="quiz-results">
            <div class="quiz-score">${results.score_percentage}%</div>
            <p class="quiz-feedback">${results.feedback}</p>
            <div class="quiz-xp-earned">+${results.xp_earned} XP</div>
            
            <div class="quiz-details">
                <h4 style="margin-bottom: 1rem;">Detailed Results</h4>
                ${results.results.map(result => `
                    <div class="quiz-result-item ${result.is_correct ? 'correct' : 'incorrect'}">
                        <div class="quiz-result-question">${escapeHtml(result.question)}</div>
                        <div class="quiz-result-answer">
                            <strong>Your answer:</strong> ${escapeHtml(result.selected_option || 'Not answered')}
                            ${!result.is_correct ? `<br><strong>Correct answer:</strong> ${escapeHtml(result.correct_option)}` : ''}
                        </div>
                        <div class="quiz-result-explanation">${escapeHtml(result.explanation)}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="quiz-actions" style="margin-top: 2rem;">
                <button class="btn-primary" onclick="hideQuizModal()" style="flex: 2;">Finish & Close</button>
                <button class="btn-secondary" onclick="retakeQuiz()" style="flex: 1;">Retake Quiz</button>
            </div>
        </div>
    `;

    quizBody.innerHTML = html;
}

function retakeQuiz() {
    currentQuestionIndex = 0;
    userAnswers = {};
    displayQuestion();
}

// ==================== PROGRESS FUNCTIONS ====================

async function updateProgressDisplay() {
    const progress = ProgressStorage.loadProgress();
    const levelInfo = await ProgressStorage.calculateLevel(progress.total_xp);

    // Update header
    if (headerLevel) headerLevel.textContent = `Lvl ${levelInfo.current_level}`;
    if (headerXP) headerXP.textContent = `${progress.total_xp} XP`;

    // Calculate XP progress percentage
    if (headerXPBar) {
        const xpProgress = levelInfo.xp_for_next_level
            ? (levelInfo.xp_progress / (levelInfo.xp_for_next_level - levelInfo.xp_for_current_level)) * 100
            : 100;
        headerXPBar.style.width = `${Math.min(xpProgress, 100)}%`;
    }

    // Check for un-notified level ups
    const lastNotified = progress.last_notified_level || 1;
    if (levelInfo.current_level > lastNotified) {
        showLevelUpCelebration(levelInfo);

        // Update notification state
        progress.last_notified_level = levelInfo.current_level;
        ProgressStorage.saveProgress(progress);
    }

    // Update progress dashboard if visible
    updateProgressDashboard(progress, levelInfo);
}

function showLevelUpCelebration(levelInfo) {
    const levelUpModal = document.getElementById('level-up-modal');
    const levelUpTitle = document.getElementById('level-up-title');
    const levelUpBadge = document.getElementById('level-up-badge');

    if (levelUpModal && levelUpTitle && levelUpBadge) {
        levelUpTitle.textContent = levelInfo.current_title;
        levelUpBadge.textContent = levelInfo.current_level;
        levelUpModal.classList.remove('hidden');
    }
}

function hideLevelUpModal() {
    const levelUpModal = document.getElementById('level-up-modal');
    if (levelUpModal) {
        levelUpModal.classList.add('hidden');
    }
}

function updateProgressDashboard(progress, levelInfo) {
    // Update level display
    const currentLevel = document.getElementById('current-level');
    const levelTitle = document.getElementById('level-title');
    const xpFill = document.getElementById('xp-fill');
    const xpLabel = document.getElementById('xp-label');

    if (currentLevel) currentLevel.textContent = levelInfo.current_level;
    if (levelTitle) levelTitle.textContent = levelInfo.current_title;

    if (xpFill && xpLabel) {
        const xpProgress = levelInfo.xp_for_next_level
            ? (levelInfo.xp_progress / (levelInfo.xp_for_next_level - levelInfo.xp_for_current_level)) * 100
            : 100;
        xpFill.style.width = `${Math.min(xpProgress, 100)}%`;

        const nextLevelXP = levelInfo.xp_for_next_level || levelInfo.current_xp;
        xpLabel.textContent = `${levelInfo.xp_progress} / ${nextLevelXP - levelInfo.xp_for_current_level} XP`;
    }

    // Update stats
    document.getElementById('stat-courses').textContent = progress.courses_completed;
    document.getElementById('stat-quizzes').textContent = progress.quizzes_passed;
    document.getElementById('stat-streak').textContent = progress.streak_days;
    document.getElementById('stat-skills').textContent = progress.unique_skills;

    // Load achievements
    loadAchievements(progress);
}

async function loadAchievements(progress) {
    try {
        const response = await apiCall('/progress/achievements');
        if (response.success) {
            const achievementsGrid = document.getElementById('achievements-grid');
            if (!achievementsGrid) return;

            const html = response.achievements.map(achievement => {
                const isUnlocked = progress.unlocked_achievements.includes(achievement.id);
                return `
                    <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                        <span class="achievement-card-icon">${achievement.icon}</span>
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                        <span class="achievement-points">+${achievement.points} XP</span>
                    </div>
                `;
            }).join('');

            achievementsGrid.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading achievements:', error);
    }
}

function showAchievementNotification(achievement) {
    const icon = document.getElementById('achievement-icon');
    const name = document.getElementById('achievement-name');
    const desc = document.getElementById('achievement-desc');
    const xp = document.getElementById('achievement-xp');

    icon.textContent = achievement.icon;
    name.textContent = achievement.name;
    desc.textContent = achievement.description;
    xp.textContent = `+${achievement.points} XP`;

    achievementNotification.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        achievementNotification.classList.add('hidden');
    }, 5000);
}

// ==================== COURSE COMPLETION ====================

async function markCourseComplete(courseId, courseTitle, difficulty, skills) {
    try {
        const result = await ProgressStorage.completeCourse(courseId, courseTitle, difficulty, skills);

        if (result.already_completed) {
            alert('You have already completed this course!');
            return;
        }

        // Show XP notification
        alert(`Course completed! +${result.xp_result.xp_earned} XP earned!`);

        // Show achievement notifications
        if (result.new_achievements.newly_unlocked) {
            result.new_achievements.newly_unlocked.forEach(achievement => {
                setTimeout(() => showAchievementNotification(achievement), 500);
            });
        }

        // Update progress display
        await updateProgressDisplay();

        // Show level up notification if applicable
        if (result.xp_result.leveled_up) {
            setTimeout(() => {
                alert(`🎉 Level Up! You are now level ${result.xp_result.new_level.current_level} - ${result.xp_result.new_level.current_title}!`);
            }, 1000);
        }
    } catch (error) {
        console.error('Error marking course complete:', error);
        alert('Failed to mark course as complete.');
    }
}

// Make functions globally available
window.hideQuizModal = hideQuizModal;
window.hideLevelUpModal = hideLevelUpModal;
window.startQuiz = startQuiz;
window.selectAnswer = selectAnswer;
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.submitQuiz = submitQuiz;
window.retakeQuiz = retakeQuiz;
window.markCourseComplete = markCourseComplete;
window.updateProgressDisplay = updateProgressDisplay;
