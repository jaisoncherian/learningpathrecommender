const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const skillSelect = document.getElementById('skill-select');
const levelSelect = document.getElementById('level-select');
const recommendBtn = document.getElementById('recommend-btn');
const recommendationResults = document.getElementById('recommendation-results');
const recommendationError = document.getElementById('recommendation-error');
const profileInput = document.getElementById('profile-input');
const analyzeBtn = document.getElementById('analyze-btn');
const gapResults = document.getElementById('gap-results');
const gapError = document.getElementById('gap-error');
const coursesList = document.getElementById('courses-list');

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    loadSkills();
    loadCourses();
    setupEventListeners();
});

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Recommendation
    recommendBtn.addEventListener('click', generateRecommendation);

    // Skill Gap Analysis
    analyzeBtn.addEventListener('click', analyzeSkillGap);
}

function switchTab(tabName) {
    // Update tab buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab contents
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
}

// ==================== API CALLS ====================

async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ==================== SKILLS LOADING ====================

// Featured/Popular skills to highlight
const FEATURED_SKILLS = [
    'Python',
    'JavaScript',
    'React',
    'Web Development',
    'Machine Learning',
    'AWS',
    'Docker',
    'Node.js',
    'Data Science',
    'Angular',
    'Databases',
    'Cloud Computing',
    'TypeScript',
    'Vue.js',
    'Deep Learning',
    'TensorFlow',
    'Kubernetes',
    'Java',
    'C++',
    'SQL',
    'MongoDB',
    'Git',
    'REST APIs',
    'DevOps',
    'Blockchain',
    'Cybersecurity'
];

async function loadSkills() {
    try {
        const response = await apiCall('/skills');
        const skills = response.skills;

        // Separate featured and other skills
        const featured = skills.filter(s => FEATURED_SKILLS.includes(s)).sort();
        const others = skills.filter(s => !FEATURED_SKILLS.includes(s)).sort();

        // Populate featured skills buttons
        const featuredContainer = document.getElementById('featured-skills');
        if (featuredContainer) {
            featured.forEach(skill => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'featured-skill-btn';
                btn.textContent = skill;
                btn.addEventListener('click', () => {
                    skillSelect.value = skill;
                    generateRecommendation();
                });
                featuredContainer.appendChild(btn);
            });
        }

        // Populate skill select dropdown
        skillSelect.innerHTML = '<option value="">-- Choose a skill --</option>';
        
        // Add featured skills with group label
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

        // Add other skills with group label
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
        const courses = response.data;

        coursesList.innerHTML = '';
        courses.forEach(course => {
            const courseCard = createCourseGridCard(course);
            coursesList.appendChild(courseCard);
        });
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
}

function createCourseGridCard(course) {
    const card = document.createElement('div');
    card.className = 'course-grid-card';

    const difficultyClass = `badge-difficulty-${course.difficulty.toLowerCase()}`;

    card.innerHTML = `
        <div class="course-grid-header">
            <div class="course-grid-title">${escapeHtml(course.title)}</div>
            <div class="badge ${difficultyClass}">${course.difficulty}</div>
        </div>
        <div class="course-grid-body">
            <div class="course-grid-description">${escapeHtml(course.description || '')}</div>
            <div class="course-grid-time">⏱️ ${course.time}</div>
            <div class="course-grid-skills">
                ${course.skills.map(skill => `<span class="course-skill-tag">${escapeHtml(skill)}</span>`).join('')}
            </div>
        </div>
    `;

    return card;
}

// ==================== RECOMMENDATION ====================

async function generateRecommendation() {
    const skill = skillSelect.value.trim();
    const level = levelSelect.value;

    if (!skill) {
        showError(recommendationError, 'Please select a skill');
        return;
    }

    try {
        recommendBtn.disabled = true;
        recommendBtn.textContent = 'Generating...';
        recommendationError.classList.add('hidden');

        const response = await apiCall('/recommend', 'POST', {
            skill: skill,
            level: level
        });

        if (response.path.length === 0) {
            showError(recommendationError, `No courses found for "${skill}" at ${level} level`);
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
        recommendBtn.textContent = 'Generate Path';
    }
}

function displayRecommendationPath(data) {
    const { path, stats } = data;

    // Display stats
    const statsHtml = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${stats.total_courses}</div>
                <div class="stat-label">Courses</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.total_time}</div>
                <div class="stat-label">Total Time</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.average_difficulty}</div>
                <div class="stat-label">Avg Difficulty</div>
            </div>
        </div>
    `;
    document.getElementById('path-stats').innerHTML = statsHtml;

    // Display courses
    const pathHtml = path.map((course, index) => `
        <div class="course-card">
            <div class="course-header">
                <div>
                    <div class="course-title">${index + 1}. ${escapeHtml(course.title)}</div>
                    <div class="course-meta">
                        <span class="badge badge-difficulty-${course.difficulty.toLowerCase()}">${course.difficulty}</span>
                        <span>⏱️ ${course.time}</span>
                    </div>
                </div>
            </div>
            <div class="course-skills">
                ${course.skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
            </div>
        </div>
    `).join('');

    document.getElementById('path-list').innerHTML = pathHtml;
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
        analyzeBtn.textContent = 'Analyzing...';
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
        analyzeBtn.textContent = 'Analyze Gaps';
    }
}

function displaySkillGapAnalysis(data) {
    const { mentioned_skills, gaps, skill_coverage_percentage, total_skills_available } = data;

    // Coverage Box
    const coverageHtml = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${skill_coverage_percentage}%</div>
                <div class="stat-label">Skill Coverage</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${mentioned_skills.length}</div>
                <div class="stat-label">Skills Known</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${gaps.length}</div>
                <div class="stat-label">Gaps Found</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${total_skills_available}</div>
                <div class="stat-label">Available Skills</div>
            </div>
        </div>
    `;
    document.getElementById('coverage-box').innerHTML = coverageHtml;

    // Mentioned Skills
    if (mentioned_skills.length > 0) {
        const skillsHtml = `
            <h4>✓ Skills You Know</h4>
            <div class="skill-list">
                ${mentioned_skills.map(skill => `<span class="skill-badge">${escapeHtml(skill)}</span>`).join('')}
            </div>
        `;
        document.getElementById('mentioned-skills').innerHTML = skillsHtml;
    } else {
        document.getElementById('mentioned-skills').innerHTML = '';
    }

    // Gaps
    const gapsHtml = gaps.map(gap => `
        <div class="gap-card">
            <div>
                <div class="gap-skill">
                    ${escapeHtml(gap.skill)}
                    <span class="gap-count">${gap.count} courses</span>
                </div>
            </div>
            <div class="gap-examples">
                <h5>Example courses:</h5>
                ${gap.examples.map(example => `
                    <div class="example-item">
                        • <strong>${escapeHtml(example.title)}</strong>
                        <span class="badge badge-difficulty-${example.difficulty.toLowerCase()}">${example.difficulty}</span>
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

checkHealth();
