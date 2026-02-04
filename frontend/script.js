// API_BASE_URL is now global from config.js

// DOM Elements
const tabButtons = document.querySelectorAll('.nav-link');
const tabPanels = document.querySelectorAll('.tab-panel');
const skillSelect = document.getElementById('skill-select');
const recommendBtn = document.getElementById('recommend-btn');
const recommendationResults = document.getElementById('recommendation-results');
const recommendationError = document.getElementById('recommendation-error');
const profileInput = document.getElementById('profile-input');
const analyzeBtn = document.getElementById('analyze-btn');
const gapResults = document.getElementById('gap-results');
const gapError = document.getElementById('gap-error');
const coursesList = document.getElementById('courses-list');

// Level Modal Elements
const levelModal = document.getElementById('level-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalClose = document.getElementById('modal-close');
const modalAction = document.getElementById('modal-action');

let currentSuggestedLevel = 'Intermediate';
let currentTargetSkill = '';
let allCoursesList = []; // Store full list for searching

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    loadSkills();
    loadCourses();
    setupEventListeners();
    checkHealth();

    // Initialize progress tracking
    if (typeof updateProgressDisplay === 'function') {
        updateProgressDisplay();
    }
});

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.currentTarget.getAttribute('data-tab');
            switchTab(tabName, e.currentTarget);
        });
    });

    // Recommendation
    recommendBtn.addEventListener('click', generateRecommendation);

    // Skill Gap Analysis
    analyzeBtn.addEventListener('click', analyzeSkillGap);

    // Catalog Search
    const catalogSearchInput = document.getElementById('catalog-search');
    if (catalogSearchInput) {
        catalogSearchInput.addEventListener('input', (e) => {
            filterCourses(e.target.value.toLowerCase());
        });
    }

    // Modal Events
    modalClose.addEventListener('click', hideModal);
    modalAction.addEventListener('click', handleModalAction);

    // Quiz Modal Events
    const quizCloseBtn = document.getElementById('quiz-close');
    if (quizCloseBtn && typeof hideQuizModal === 'function') {
        quizCloseBtn.addEventListener('click', hideQuizModal);
    }
}

function showModal(title, message, actionText, suggestedLevel) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalAction.textContent = actionText;
    currentSuggestedLevel = suggestedLevel;
    levelModal.classList.remove('hidden');
}

function hideModal() {
    levelModal.classList.add('hidden');
}

function handleModalAction() {
    hideModal();
    const radioToSelect = document.querySelector(`input[name="level"][value="${currentSuggestedLevel}"]`);
    if (radioToSelect) {
        radioToSelect.checked = true;
        generateRecommendation();
    }
}

function switchTab(tabName, clickedButton) {
    // Update tab buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');

    // Update tab panels
    tabPanels.forEach(panel => panel.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
}

// ==================== API CALLS ====================

// apiCall is now global from config.js

// ==================== SKILLS LOADING ====================

const FEATURED_SKILLS = [
    'Python', 'JavaScript', 'React', 'Web Development',
    'Machine Learning', 'AWS', 'Docker', 'Node.js'
];

async function loadSkills() {
    try {
        const response = await apiCall('/skills');
        const skills = response.skills;

        // Update header stat
        document.getElementById('total-skills-stat').textContent = skills.length;

        // Separate featured and other skills
        const featured = skills.filter(s => FEATURED_SKILLS.includes(s)).sort();
        const others = skills.filter(s => !FEATURED_SKILLS.includes(s)).sort();

        // Populate featured skills buttons
        const featuredContainer = document.getElementById('featured-skills');
        if (featuredContainer) {
            featuredContainer.innerHTML = '';
            featured.forEach(skill => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'featured-skill-btn';

                // Add specific class for unique designs
                const skillLower = skill.toLowerCase().replace(/\s+/g, '-');
                btn.classList.add(`skill-${skillLower}`);

                btn.innerHTML = `<span>${escapeHtml(skill)}</span>`;
                btn.addEventListener('click', () => {
                    skillSelect.value = skill;
                    // Removed automatic generation to ensure user clicks the primary button
                });
                featuredContainer.appendChild(btn);
            });
        }

        // Populate skill select dropdown
        skillSelect.innerHTML = '<option value="">-- Choose a skill --</option>';

        if (featured.length > 0) {
            const featuredGroup = document.createElement('optgroup');
            featuredGroup.label = '⭐ Popular Skills';
            featured.forEach(skill => {
                const option = document.createElement('option');
                option.value = skill;
                option.textContent = skill;
                featuredGroup.appendChild(option);
            });
            skillSelect.appendChild(featuredGroup);
        }

        if (others.length > 0) {
            const othersGroup = document.createElement('optgroup');
            othersGroup.label = 'All Other Skills';
            others.forEach(skill => {
                const option = document.createElement('option');
                option.value = skill;
                option.textContent = skill;
                othersGroup.appendChild(option);
            });
            skillSelect.appendChild(othersGroup);
        }
    } catch (error) {
        console.error('Failed to load skills:', error);
    }
}

// ==================== COURSES LOADING ====================

async function loadCourses() {
    try {
        const response = await apiCall('/courses');
        allCoursesList = response.data;

        // Update header stat
        document.getElementById('total-courses-stat').textContent = allCoursesList.length;

        renderCourseCatalog(allCoursesList);
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
}

function filterCourses(searchTerm) {
    const filtered = allCoursesList.filter(course => {
        const titleMatch = course.title.toLowerCase().includes(searchTerm);
        const descMatch = (course.description || '').toLowerCase().includes(searchTerm);
        const skillMatch = course.skills.some(s => s.toLowerCase().includes(searchTerm));
        const diffMatch = course.difficulty.toLowerCase().includes(searchTerm);

        return titleMatch || descMatch || skillMatch || diffMatch;
    });

    renderCourseCatalog(filtered);
}

function renderCourseCatalog(courses) {
    coursesList.innerHTML = '';

    if (courses.length === 0) {
        coursesList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; border: 2px dashed var(--border); border-radius: var(--radius-lg); color: var(--text-muted); background: var(--bg-darker);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🛰️</div>
                <h3>No coordinates matches.</h3>
                <p>Try searching for a different skill or pilot expertise level.</p>
            </div>
        `;
        return;
    }

    courses.forEach(course => {
        const courseCard = createCourseGridCard(course);
        coursesList.appendChild(courseCard);
    });
}

function createCourseGridCard(course) {
    const card = document.createElement('div');
    card.className = 'catalog-card';

    const difficultyClass = `diff-${course.difficulty.toLowerCase()}`;

    card.innerHTML = `
        <div class="course-header">
            <h4 class="course-title" style="margin:0">${escapeHtml(course.title)}</h4>
            <div class="badge-tag ${difficultyClass}">${course.difficulty}</div>
        </div>
        <div class="course-body">
            ${course.description ? `<p class="course-desc" style="color:var(--text-muted); font-size:0.95rem; margin: 1rem 0;">${escapeHtml(course.description)}</p>` : ''}
            <div class="course-metadata" style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom: 1.5rem;">
                <span class="badge-tag diff-intermediate">⏱️ ${course.time}</span>
                ${course.skills.map(skill => `<span class="badge-tag" style="background:var(--bg-darker); color:var(--text-muted)">${escapeHtml(skill)}</span>`).join('')}
            </div>
            <div class="course-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <a href="${course.url || '#'}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="flex: 1; padding: 0.75rem; font-size: 0.9rem; border-radius: 8px; min-width: 100px; text-align: center;">Explore ↗</a>
                <button class="btn-secondary btn-small" onclick="startQuiz(${JSON.stringify(course.skills).replace(/"/g, '&quot;')}, '${course.difficulty}')" style="padding: 0.75rem 1rem; font-size: 0.85rem;">📝 Quiz</button>
                <button class="btn-success btn-small" onclick="markCourseComplete('${course.id}', '${escapeHtml(course.title)}', '${course.difficulty}', ${JSON.stringify(course.skills)})" style="padding: 0.75rem 1rem; font-size: 0.85rem;">✓ Done</button>
            </div>
        </div>
    `;

    return card;
}

// ==================== RECOMMENDATION ====================

async function generateRecommendation() {
    const skill = skillSelect.value.trim();
    const levelRadio = document.querySelector('input[name="level"]:checked');
    const level = levelRadio ? levelRadio.value : 'Beginner';

    if (!skill) {
        showError(recommendationError, 'Please select a skill');
        return;
    }

    try {
        recommendBtn.disabled = true;
        recommendBtn.innerHTML = `
            <span class="spinner"></span>
            <span class="btn-text">Generating...</span>
        `;
        recommendationError.classList.add('hidden');

        const response = await apiCall('/recommend', 'POST', {
            skill: skill,
            level: level
        });

        if (response.path.length === 0) {
            // Check if skill exists at other levels
            try {
                const skillsResponse = await apiCall(`/courses/by-skill/${encodeURIComponent(skill)}`);
                const courses = skillsResponse.courses || [];

                if (courses.length > 0) {
                    // Skill exists but at different levels
                    const levels = [...new Set(courses.map(c => c.difficulty))];
                    let suggestion = 'Intermediate';
                    if (levels.includes('Intermediate')) suggestion = 'Intermediate';
                    else if (levels.includes('Advanced')) suggestion = 'Advanced';
                    else if (levels.includes('Beginner')) suggestion = 'Beginner'; // Should not happen if path was 0

                    showModal(
                        'Advanced Skill Detected',
                        `"${skill}" is a professional-grade skill. We found courses available for ${suggestion} level. Would you like to switch?`,
                        `Switch to ${suggestion}`,
                        suggestion
                    );
                } else {
                    showError(recommendationError, `No courses found for "${skill}"`);
                }
            } catch (e) {
                showError(recommendationError, `No courses found for "${skill}" at ${level} level`);
            }
            recommendationResults.classList.add('hidden');
        } else {
            displayRecommendationPath(response);
            recommendationResults.classList.remove('hidden');
        }
    } catch (error) {
        showError(recommendationError, error.message);
        recommendationResults.classList.add('hidden');
    } finally {
        recommendBtn.disabled = false;
        recommendBtn.innerHTML = `
            <span class="btn-text">Generate Learning Path</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }
}

function displayRecommendationPath(data) {
    const { path, stats } = data;

    // Display stats
    const statsHtml = `
        <div class="stat-box">
            <span class="stat-num">${stats.total_courses}</span>
            <span class="stat-desc">Modules</span>
        </div>
        <div class="stat-box">
            <span class="stat-num">${stats.total_time}</span>
            <span class="stat-desc">Duration</span>
        </div>
        <div class="stat-box">
            <span class="stat-num">${stats.average_difficulty}</span>
            <span class="stat-desc">Level</span>
        </div>
    `;
    document.getElementById('path-stats').innerHTML = statsHtml;

    // Display courses
    const pathHtml = path.map((course, index) => `
        <div class="path-card">
            <div class="step-marker">${index + 1}</div>
            <div class="path-info">
                <h4>${escapeHtml(course.title)}</h4>
                <div style="display:flex; gap:0.75rem; align-items:center; margin-bottom:1rem;">
                    <span class="badge-tag diff-${course.difficulty.toLowerCase()}">${course.difficulty}</span>
                    <span style="color:var(--text-muted); font-size:0.85rem; font-weight:600;">⏱️ ${course.time}</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${course.skills.map(skill => `<span class="badge-tag" style="background:var(--bg-darker); color:var(--text-muted)">${escapeHtml(skill)}</span>`).join('')}
                </div>
            </div>
            <a href="${course.url || '#'}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 0.75rem 1.5rem; font-size: 0.9rem; align-self: center; border-radius: 8px;">Start Module ↗</a>
        </div>
    `).join('');

    document.getElementById('path-list').innerHTML = pathHtml;

    // Render interactive graph
    if (typeof renderInteractivePath === 'function') {
        renderInteractivePath(path);

        // Reset to list view by default on new generation
        const listBtn = document.getElementById('view-list-btn');
        const graphBtn = document.getElementById('view-graph-btn');
        const pathList = document.getElementById('path-list');
        const pathVisualizer = document.getElementById('path-visualizer');

        if (listBtn && graphBtn) {
            listBtn.classList.add('active');
            graphBtn.classList.remove('active');
            pathList.classList.remove('hidden');
            pathVisualizer.classList.add('hidden');
        }
    }
}

// ==================== SKILL GAP ANALYSIS ====================

async function analyzeSkillGap() {
    const profile = profileInput.value.trim();

    if (!profile) {
        showError(gapError, 'Please describe your background');
        return;
    }

    try {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = `
            <span class="spinner"></span>
            <span class="btn-text">Analyzing...</span>
        `;
        gapError.classList.add('hidden');

        const response = await apiCall('/skill-gap', 'POST', {
            profile: profile
        });

        displaySkillGapAnalysis(response);
        gapResults.classList.remove('hidden');
    } catch (error) {
        showError(gapError, error.message);
        gapResults.classList.add('hidden');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `
            <span class="btn-text">Analyze Skill Gaps</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }
}

function displaySkillGapAnalysis(data) {
    const { mentioned_skills, gaps, coverage, total_skills_available, detected_goal, roadmap } = data;

    // Coverage Box
    const coverageHtml = `
        <div class="stats-grid">
            <div class="stat-box">
                <span class="stat-num">${coverage}%</span>
                <span class="stat-desc">Market Alignment</span>
            </div>
            <div class="stat-box">
                <span class="stat-num">${total_skills_available}</span>
                <span class="stat-desc">Growth Vectors</span>
            </div>
        </div>
    `;
    document.getElementById('coverage-box').innerHTML = coverageHtml;

    // Roadmap Header
    const resultsContainer = document.getElementById('gap-results');
    const roadmapHeader = resultsContainer.querySelector('.roadmap-info');
    if (roadmapHeader) roadmapHeader.remove();

    if (detected_goal) {
        const roadmapDiv = document.createElement('div');
        roadmapDiv.className = 'roadmap-info glass-card';
        roadmapDiv.innerHTML = `
            <div class="roadmap-meta">
                <span class="roadmap-tag">Targeting: ${detected_goal}</span>
                <h3>Career Roadmap Detected 🎯</h3>
                <p>We've tailored your analysis to help you become a <strong>${detected_goal}</strong>.</p>
            </div>
            <div class="roadmap-requirements">
                <small>Core Requirements:</small>
                <div class="requirement-tags">
                    ${roadmap.required_skills.map(s => `<span class="req-tag">${s}</span>`).join('')}
                </div>
            </div>
        `;
        resultsContainer.insertBefore(roadmapDiv, document.getElementById('coverage-box'));
    }

    // Mentioned Skills
    if (mentioned_skills.length > 0) {
        const skillsHtml = `
            <h5 class="config-label">✓ Skills Successfully Identified</h5>
            <div class="requirement-tags" style="margin-bottom: 2rem;">
                ${mentioned_skills.map(skill => `<span class="skill-badge">${escapeHtml(skill)}</span>`).join('')}
            </div>
        `;
        document.getElementById('mentioned-skills').innerHTML = skillsHtml;
    } else {
        document.getElementById('mentioned-skills').innerHTML = '';
    }

    // Gaps
    const gapsHtml = gaps.map(gap => `
        <div class="path-card" style="flex-direction: column; gap:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:1rem;">
                    <h4 style="margin:0">${escapeHtml(gap.skill)}</h4>
                    ${gap.is_priority ? '<span class="badge-tag diff-intermediate" style="background:var(--primary-glow)">Target Mastery</span>' : ''}
                </div>
                <span style="color:var(--text-muted); font-weight:600; font-size:0.9rem;">${gap.count} Professional Resources</span>
            </div>
            <div style="background: var(--bg-darker); padding: 1.5rem; border-radius: 12px;">
                <h5 class="label-title">Recommended Start Points</h5>
                ${gap.examples.map(example => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-top: 1px solid var(--border);">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <strong style="font-size:0.95rem;">• ${escapeHtml(example.title)}</strong>
                            <span class="badge-tag diff-${example.difficulty.toLowerCase()}">${example.difficulty}</span>
                        </div>
                        <a href="${example.url || '#'}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 0.4rem 1rem; font-size: 0.75rem; border-radius: 6px;">View ↗</a>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    document.getElementById('gaps-list').innerHTML = gapsHtml;
}

// ==================== UTILITY FUNCTIONS ====================

function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Health check on load
async function checkHealth() {
    try {
        const response = await apiCall('/health');
        console.log('✓ API is running:', response);
    } catch (error) {
        console.error('✗ API Connection Error:', error);
        console.warn('Make sure the Flask backend is running on http://localhost:5000');
    }
}
