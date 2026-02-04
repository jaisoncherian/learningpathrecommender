"""
Flask backend for Learning Path Recommender.
Main application with REST API endpoints.
"""

from flask import Flask, jsonify, request, send_from_directory
from recommender import generate_path, get_course_dependencies, calculate_path_stats
from skill_gap import analyze_profile, get_mentioned_skills, calculate_skill_coverage
from utils import load_courses, get_all_skills, get_courses_by_skill
from quiz_generator import generate_quiz, evaluate_quiz, get_available_skills, get_question_count
from progress_manager import calculate_level, check_achievements, calculate_xp_for_action, get_all_achievements
import os
import traceback

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend')
app.config['JSON_SORT_KEYS'] = False

# Load course data
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'courses.json')
COURSES = load_courses(DATA_FILE)


# ==================== UTILITY ROUTES ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'courses_loaded': len(COURSES),
        'message': 'Learning Path Recommender API is running'
    }), 200


# ==================== COURSE ROUTES ====================

@app.route('/api/courses', methods=['GET'])
def get_courses():
    """Get all available courses."""
    return jsonify({
        'success': True,
        'data': COURSES,
        'total': len(COURSES)
    }), 200


@app.route('/api/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    """Get a specific course by ID."""
    course = next((c for c in COURSES if c['id'] == course_id), None)
    if not course:
        return jsonify({
            'success': False,
            'error': 'Course not found'
        }), 404
    
    return jsonify({
        'success': True,
        'data': course
    }), 200


@app.route('/api/skills', methods=['GET'])
def get_skills():
    """Get all unique skills in the database."""
    skills = get_all_skills(COURSES)
    return jsonify({
        'success': True,
        'skills': skills,
        'total': len(skills)
    }), 200


@app.route('/api/courses/by-skill/<skill>', methods=['GET'])
def get_courses_for_skill(skill):
    """Get all courses teaching a specific skill."""
    courses = get_courses_by_skill(COURSES, skill)
    return jsonify({
        'success': True,
        'skill': skill,
        'courses': courses,
        'total': len(courses)
    }), 200


# ==================== RECOMMENDATION ROUTES ====================

@app.route('/api/recommend', methods=['POST'])
def recommend():
    """
    Generate a personalized learning path.
    
    Request body:
    {
        "skill": "target skill name",
        "level": "Beginner|Intermediate|Advanced"
    }
    """
    try:
        data = request.json or {}
        target_skill = data.get('skill', '').strip()
        level = data.get('level', 'Beginner').strip()
        
        if not target_skill:
            return jsonify({
                'success': False,
                'error': 'Skill parameter is required'
            }), 400
        
        if level not in ['Beginner', 'Intermediate', 'Advanced']:
            return jsonify({
                'success': False,
                'error': f'Invalid level. Must be one of: Beginner, Intermediate, Advanced'
            }), 400
        
        path = generate_path(COURSES, target_skill, level)
        stats = calculate_path_stats(path)
        
        return jsonify({
            'success': True,
            'skill': target_skill,
            'level': level,
            'path': path,
            'stats': stats
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


# ==================== SKILL GAP ROUTES ====================

@app.route('/api/skill-gap', methods=['POST'])
def skill_gap():
    """
    Analyze user profile for skill gaps.
    
    Request body:
    {
        "profile": "user's background/experience description"
    }
    """
    try:
        data = request.json or {}
        profile_text = data.get('profile', '').strip()
        
        if not profile_text:
            return jsonify({
                'success': False,
                'error': 'Profile text is required'
            }), 400
        
        # Analyze profile
        analysis_result = analyze_profile(COURSES, profile_text)
        gaps = analysis_result['gaps']
        mentioned_skills = get_mentioned_skills(COURSES, profile_text)
        coverage = calculate_skill_coverage(COURSES, profile_text)
        
        return jsonify({
            'success': True,
            'gaps': gaps,
            'mentioned_skills': mentioned_skills,
            'coverage': coverage,
            'total_skills_available': len(get_all_skills(COURSES)),
            'detected_goal': analysis_result.get('detected_goal'),
            'roadmap': analysis_result.get('roadmap')
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/course/<course_id>/dependencies', methods=['GET'])
def get_dependencies(course_id):
    """Get all prerequisites (direct and transitive) for a course."""
    course = next((c for c in COURSES if c['id'] == course_id), None)
    
    if not course:
        return jsonify({
            'success': False,
            'error': 'Course not found'
        }), 404
    
    dependencies = get_course_dependencies(COURSES, course_id)
    dep_courses = [c for c in COURSES if c['id'] in dependencies]
    
    return jsonify({
        'success': True,
        'course_id': course_id,
        'course_title': course['title'],
        'dependencies': dep_courses,
        'total': len(dependencies)
    }), 200


# ==================== QUIZ ROUTES ====================

@app.route('/api/quiz/generate', methods=['POST'])
def generate_quiz_endpoint():
    """
    Generate a quiz for a specific skill.
    
    Request body:
    {
        "skill": "skill name",
        "difficulty": "Beginner|Intermediate|Advanced",
        "num_questions": 5
    }
    """
    try:
        data = request.json or {}
        skill = data.get('skill', '')
        # Handle both string and list
        if isinstance(skill, str):
            skill = skill.strip()
        
        difficulty = data.get('difficulty', 'Beginner')
        if isinstance(difficulty, str):
            difficulty = difficulty.strip()
        num_questions = data.get('num_questions', 5)
        
        if not skill:
            return jsonify({
                'success': False,
                'error': 'Skill parameter is required'
            }), 400
        
        quiz = generate_quiz(skill, difficulty, num_questions)
        
        if quiz['total_questions'] == 0:
            return jsonify({
                'success': False,
                'error': f'No quiz questions available for {skill} at {difficulty} level'
            }), 404
        
        return jsonify({
            'success': True,
            'quiz': quiz
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/quiz/evaluate', methods=['POST'])
def evaluate_quiz_endpoint():
    """
    Evaluate quiz answers.
    
    Request body:
    {
        "quiz_id": "quiz identifier",
        "answers": {
            "q1": 0,
            "q2": 1,
            ...
        }
    }
    """
    try:
        data = request.json or {}
        quiz_id = data.get('quiz_id', '').strip()
        answers = data.get('answers', {})
        
        if not quiz_id or not answers:
            return jsonify({
                'success': False,
                'error': 'quiz_id and answers are required'
            }), 400
        
        results = evaluate_quiz(quiz_id, answers)
        
        return jsonify({
            'success': True,
            'results': results
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/quiz/skills', methods=['GET'])
def get_quiz_skills():
    """Get list of skills that have quiz questions available."""
    try:
        skills = get_available_skills()
        return jsonify({
            'success': True,
            'skills': skills,
            'total': len(skills)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/quiz/count/<skill>', methods=['GET'])
def get_quiz_count(skill):
    """Get count of available quiz questions for a skill."""
    try:
        difficulty = request.args.get('difficulty')
        count = get_question_count(skill, difficulty)
        
        return jsonify({
            'success': True,
            'skill': skill,
            'difficulty': difficulty,
            'count': count
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== PROGRESS & GAMIFICATION ROUTES ====================

@app.route('/api/progress/level', methods=['POST'])
def get_level():
    """
    Calculate user level based on XP.
    
    Request body:
    {
        "xp": 1500
    }
    """
    try:
        data = request.json or {}
        xp = data.get('xp', 0)
        
        level_info = calculate_level(xp)
        
        return jsonify({
            'success': True,
            'level_info': level_info
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/progress/achievements/check', methods=['POST'])
def check_user_achievements():
    """
    Check which achievements a user has unlocked.
    
    Request body:
    {
        "user_stats": {
            "courses_completed": 5,
            "quizzes_passed": 3,
            "perfect_quizzes": 1,
            "streak_days": 7,
            "unique_skills": 4,
            "paths_generated": 2,
            "early_completions": 0,
            "late_completions": 1,
            "unlocked_achievements": ["first_step", "quiz_novice"]
        }
    }
    """
    try:
        data = request.json or {}
        user_stats = data.get('user_stats', {})
        
        newly_unlocked = check_achievements(user_stats)
        
        return jsonify({
            'success': True,
            'newly_unlocked': newly_unlocked,
            'total_unlocked': len(newly_unlocked)
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/progress/achievements', methods=['GET'])
def get_achievements():
    """Get all available achievements."""
    try:
        achievements = get_all_achievements()
        
        return jsonify({
            'success': True,
            'achievements': achievements,
            'total': len(achievements)
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/progress/xp/calculate', methods=['POST'])
def calculate_xp():
    """
    Calculate XP for an action.
    
    Request body:
    {
        "action_type": "course_complete",
        "details": {
            "difficulty": "Intermediate"
        }
    }
    """
    try:
        data = request.json or {}
        action_type = data.get('action_type', '')
        details = data.get('details', {})
        
        xp = calculate_xp_for_action(action_type, details)
        
        return jsonify({
            'success': True,
            'action_type': action_type,
            'xp_earned': xp
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== FRONTEND ROUTES ====================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve frontend files."""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


# ==================== MAIN ====================

if __name__ == '__main__':
    print(f"Loading {len(COURSES)} courses from {DATA_FILE}")
    print("Starting Learning Path Recommender API...")
    print("Access the app at: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
