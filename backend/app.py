"""
Flask backend for Learning Path Recommender.
Main application with REST API endpoints.
"""

from flask import Flask, jsonify, request, send_from_directory
from recommender import generate_path, get_course_dependencies, calculate_path_stats
from skill_gap import analyze_profile, get_mentioned_skills, calculate_skill_coverage
from utils import load_courses, get_all_skills, get_courses_by_skill
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
        
        gaps = analyze_profile(COURSES, profile_text)
        mentioned = get_mentioned_skills(COURSES, profile_text)
        coverage = calculate_skill_coverage(COURSES, profile_text)
        
        return jsonify({
            'success': True,
            'gaps': gaps,
            'mentioned_skills': mentioned,
            'skill_coverage_percentage': coverage,
            'total_skills_available': len(get_all_skills(COURSES))
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
