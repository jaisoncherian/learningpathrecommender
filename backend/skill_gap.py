"""
Skill gap analysis module.
Identifies missing skills and suggests relevant courses.
"""

# Common skill aliases for better matching
SKILL_ALIASES = {
    'web dev': 'Web Development',
    'frontend': 'Frontend Development',
    'backend': 'Backend Development',
    'ml': 'Machine Learning',
    'ai': 'Artificial Intelligence',
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'python dev': 'Python',
    'db': 'Databases',
    'sql dev': 'SQL',
    'aws': 'Amazon Web Services (AWS)',
    'k8s': 'Kubernetes',
    'ds': 'Data Science',
    'stats': 'Statistics'
}

def normalize_text(text):
    """Normalize text for consistent matching."""
    return (text or '').lower().strip()

def is_skill_mentioned(skill, text):
    """
    Check if a skill (or its aliases) is mentioned in the text.
    Uses word boundary checks for better accuracy.
    """
    import re
    skill_lower = skill.lower()
    
    # Check exact skill name first
    if re.search(fr'\b{re.escape(skill_lower)}\b', text):
        return True
        
    # Check aliases
    for alias, full_name in SKILL_ALIASES.items():
        if full_name.lower() == skill_lower:
            if re.search(fr'\b{re.escape(alias.lower())}\b', text):
                return True
    
    return False

    return False

def get_roadmaps():
    """Load career roadmaps from the data file."""
    import json
    import os
    try:
        path = os.path.join(os.path.dirname(__file__), '..', 'data', 'roadmaps.json')
        with open(path, 'r') as f:
            return json.load(f)
    except Exception:
        return {}

def detect_goal(text):
    """Detect if the profile text mentions a specific career goal."""
    roadmaps = get_roadmaps()
    text_lower = text.lower()
    
    for goal, data in roadmaps.items():
        for keyword in data.get('keywords', []):
            if keyword.lower() in text_lower:
                return goal
    return None

def analyze_profile(courses, profile_text):
    """
    Analyze user profile to identify skill gaps.
    Prioritizes skills if a career goal is detected.
    """
    text = normalize_text(profile_text)
    goal = detect_goal(text)
    roadmaps = get_roadmaps()
    goal_skills = set()
    if goal:
        goal_skills = set([s.lower() for s in roadmaps[goal].get('required_skills', [])])
    
    # Count skill occurrences across all courses
    skill_counts = {}
    skill_to_courses = {}
    
    for course in courses:
        for skill in course.get('skills', []):
            skill_key = skill.strip()
            skill_lower = skill_key.lower()
            skill_counts[skill_lower] = skill_counts.get(skill_lower, 0) + 1
            
            if skill_lower not in skill_to_courses:
                skill_to_courses[skill_lower] = []
            skill_to_courses[skill_lower].append(course)
    
    # Identify gaps
    gaps = []
    
    # Sort skills: prioritize goal-related skills, then by frequency
    all_skills = list(skill_counts.keys())
    
    def sort_key(s_lower):
        is_goal_skill = 1 if s_lower in goal_skills else 0
        return (is_goal_skill, skill_counts[s_lower])
        
    sorted_skills = sorted(all_skills, key=sort_key, reverse=True)
    
    for skill_lower in sorted_skills:
        # Find original display name
        original_skill = skill_lower.title()
        found = False
        for c in courses:
            for s in c.get('skills', []):
                if s.lower() == skill_lower:
                    original_skill = s
                    found = True
                    break
            if found: break

        if not is_skill_mentioned(original_skill, text):
            # For non-goal skills, maybe only show them if they are common enough
            # or if no goal is specified.
            if goal and skill_lower not in goal_skills:
                # If we have a goal, maybe don't clutter the results with unrelated gaps
                # unless they are very important skills (frequency > 5).
                if skill_counts[skill_lower] < 3:
                    continue

            example_courses = skill_to_courses[skill_lower][:3]
            examples = [
                {
                    'id': c['id'],
                    'title': c['title'],
                    'difficulty': c.get('difficulty', 'Beginner'),
                    'url': c.get('url', '#')
                } 
                for c in example_courses
            ]
            
            gaps.append({
                'skill': original_skill,
                'count': skill_counts[skill_lower],
                'is_priority': skill_lower in goal_skills,
                'examples': examples
            })
    
    return {
        'gaps': gaps,
        'detected_goal': goal,
        'roadmap': roadmaps.get(goal) if goal else None
    }


def get_mentioned_skills(courses, profile_text):
    """Get skills mentioned in the profile using robust matching."""
    text = normalize_text(profile_text)
    mentioned = set()
    
    all_skills = set()
    for course in courses:
        for skill in course.get('skills', []):
            all_skills.add(skill)
    
    for skill in all_skills:
        if is_skill_mentioned(skill, text):
            mentioned.add(skill)
    
    return sorted(list(mentioned))


def calculate_skill_coverage(courses, profile_text):
    """Calculate percentage of unique available skills mentioned in profile."""
    text = normalize_text(profile_text)
    
    all_skills = set()
    for course in courses:
        for skill in course.get('skills', []):
            all_skills.add(skill)
    
    if not all_skills:
        return 0
        
    mentioned_unique_count = 0
    for skill in all_skills:
        if is_skill_mentioned(skill, text):
            mentioned_unique_count += 1
    
    coverage = (mentioned_unique_count / len(all_skills)) * 100
    return round(coverage, 2)
