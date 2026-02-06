"""
Learning path recommendation engine.
Generates personalized learning paths based on target skill and user level.
"""


def generate_path(courses, target_skill, level='Beginner', completed_courses=None):
    """
    Generate a learning path for a target skill.
    
    Args:
        courses: List of course dictionaries
        target_skill: Target skill to learn
        level: User's current skill level (Beginner, Intermediate, Advanced)
        completed_courses: List of course IDs already completed by user
    """
    if completed_courses is None:
        completed_courses = []

    level_order = {'Beginner': 0, 'Intermediate': 1, 'Advanced': 2}
    user_level = level_order.get(level, 0)
    
    # Find all courses teaching the target skill
    target_courses = [
        c for c in courses 
        if target_skill.lower() in [s.lower() for s in c.get('skills', [])]
    ]
    
    if not target_courses:
        return []
    
    def add_with_prerequisites(course, visited, output):
        """Recursively add course with its prerequisites."""
        course_id = course['id']
        
        # Skip if already visited or completed
        if course_id in visited or course_id in completed_courses:
            return
        
        # Add prerequisites first
        for prereq_id in course.get('prerequisites', []):
            # Skip prerequisites if they are already completed (assumed knowledge)
            if prereq_id in completed_courses:
                continue

            prereq_course = next(
                (c for c in courses if c['id'] == prereq_id), 
                None
            )
            if prereq_course:
                add_with_prerequisites(prereq_course, visited, output)
        
        visited.add(course_id)
        output.append(course)
    
    # Build learning path
    result = []
    visited = set()
    
    for course in target_courses:
        course_level = level_order.get(course.get('difficulty', 'Beginner'), 0)
        
        # Only include courses at or below user's level
        if course_level > user_level:
            continue
        
        # Skip if the target course itself is completed
        if course['id'] in completed_courses:
            continue
        
        add_with_prerequisites(course, visited, result)
    
    # Remove duplicates and format output
    final_path = []
    seen_ids = set()
    
    for course in result:
        course_id = course['id']
        if course_id not in seen_ids:
            final_path.append({
                'id': course_id,
                'title': course.get('title'),
                'difficulty': course.get('difficulty'),
                'time': course.get('time'),
                'skills': course.get('skills', []),
                'prerequisites': course.get('prerequisites', []),
                'url': course.get('url', '#')
            })
            seen_ids.add(course_id)
    
    return final_path


def get_course_dependencies(courses, course_id):
    """Get all dependencies (direct and transitive) for a course."""
    dependencies = []
    visited = set()
    
    def collect_deps(cid):
        if cid in visited:
            return
        visited.add(cid)
        
        course = next((c for c in courses if c['id'] == cid), None)
        if not course:
            return
        
        for prereq in course.get('prerequisites', []):
            collect_deps(prereq)
            if prereq not in dependencies:
                dependencies.append(prereq)
    
    collect_deps(course_id)
    return dependencies


def calculate_path_stats(path):
    """Calculate statistics for a learning path."""
    if not path:
        return {'total_courses': 0, 'total_time': '0h', 'difficulty_levels': []}
    
    total_hours = 0
    difficulties = []
    
    for course in path:
        time_str = course.get('time', '0h')
        hours = int(time_str.replace('h', '').strip())
        total_hours += hours
        difficulties.append(course.get('difficulty', 'Beginner'))
    
    return {
        'total_courses': len(path),
        'total_time': f"{total_hours}h",
        'difficulty_levels': difficulties,
        'average_difficulty': difficulties[len(difficulties)//2] if difficulties else 'N/A'
    }
