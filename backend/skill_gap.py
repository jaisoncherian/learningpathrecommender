"""
Skill gap analysis module.
Identifies missing skills and suggests relevant courses.
"""


def analyze_profile(courses, profile_text):
    """
    Analyze user profile to identify skill gaps.
    
    Args:
        courses: List of course dictionaries
        profile_text: User's profile/background description
    
    Returns:
        List of skill gaps with suggested courses
    """
    text = (profile_text or '').lower()
    
    # Count skill occurrences across all courses
    skill_counts = {}
    skill_to_courses = {}
    
    for course in courses:
        for skill in course.get('skills', []):
            skill_key = skill.lower()
            skill_counts[skill_key] = skill_counts.get(skill_key, 0) + 1
            
            if skill_key not in skill_to_courses:
                skill_to_courses[skill_key] = []
            skill_to_courses[skill_key].append(course)
    
    # Identify gaps (skills not mentioned in profile)
    gaps = []
    for skill in sorted(skill_counts.keys(), key=lambda k: -skill_counts[k]):
        if skill not in text:
            # Get top 3 courses teaching this skill
            example_courses = skill_to_courses[skill][:3]
            examples = [
                {
                    'id': c['id'],
                    'title': c['title'],
                    'difficulty': c.get('difficulty', 'Beginner')
                } 
                for c in example_courses
            ]
            
            gaps.append({
                'skill': skill.title(),
                'count': skill_counts[skill],
                'examples': examples
            })
    
    return gaps


def get_mentioned_skills(courses, profile_text):
    """Get skills mentioned in the profile."""
    text = (profile_text or '').lower()
    mentioned = []
    
    all_skills = set()
    for course in courses:
        for skill in course.get('skills', []):
            all_skills.add(skill.lower())
    
    for skill in all_skills:
        if skill in text:
            mentioned.append(skill.title())
    
    return mentioned


def calculate_skill_coverage(courses, profile_text):
    """Calculate what percentage of available skills are mentioned in profile."""
    text = (profile_text or '').lower()
    
    all_skills = set()
    mentioned_count = 0
    
    for course in courses:
        for skill in course.get('skills', []):
            skill_key = skill.lower()
            all_skills.add(skill_key)
            if skill_key in text:
                mentioned_count += 1
    
    total_skills = len(all_skills)
    if total_skills == 0:
        return 0
    
    coverage = (mentioned_count / total_skills) * 100
    return round(coverage, 2)
