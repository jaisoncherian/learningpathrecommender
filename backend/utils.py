import json
import os


def load_courses(filepath):
    """Load courses from JSON file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {filepath} not found")
        return []
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {filepath}")
        return []


def save_courses(filepath, courses):
    """Save courses to JSON file."""
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(courses, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving courses: {e}")
        return False


def find_course_by_id(courses, course_id):
    """Find a course by its ID."""
    for course in courses:
        if course.get('id') == course_id:
            return course
    return None


def get_courses_by_skill(courses, skill):
    """Get all courses that teach a specific skill."""
    return [c for c in courses if skill.lower() in [s.lower() for s in c.get('skills', [])]]


def get_all_skills(courses):
    """Get list of all unique skills in the course database."""
    skills = set()
    for course in courses:
        for skill in course.get('skills', []):
            skills.add(skill)
    return sorted(list(skills))
