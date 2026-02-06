"""
Progress tracking and gamification module.
Manages user progress, XP, achievements, and level progression.
"""

import json
import os
from datetime import datetime


def load_achievements():
    """Load achievement definitions from the data file."""
    path = os.path.join(os.path.dirname(__file__), '..', 'data', 'achievements.json')
    with open(path, 'r') as f:
        return json.load(f)


def calculate_level(xp):
    """Calculate user level based on total XP (Linear: 100 XP per level)."""
    achievements_data = load_achievements()
    levels = achievements_data['levels']
    
    # Linear Formula
    # Level 1: 0-99 XP
    # Level 2: 100-199 XP
    current_level = (xp // 100) + 1
    xp_for_current_level = (current_level - 1) * 100
    xp_for_next_level = current_level * 100
    
    # Find title
    # Default to the highest title if level exceeds defined levels
    current_title = "Master"
    for level_data in levels:
        if level_data['level'] == current_level:
            current_title = level_data['title']
            break
        if level_data['level'] < current_level:
            current_title = level_data['title'] # Keep taking the highest so far

    return {
        'current_level': current_level,
        'current_title': current_title,
        'current_xp': xp,
        'xp_for_current_level': xp_for_current_level,
        'xp_for_next_level': xp_for_next_level,
        'xp_progress': xp - xp_for_current_level,
        'xp_needed': xp_for_next_level - xp
    }


def check_achievements(user_stats):
    """
    Check which achievements the user has unlocked.
    
    Args:
        user_stats: Dictionary with user statistics
            - courses_completed: int
            - quizzes_passed: int
            - perfect_quizzes: int
            - streak_days: int
            - unique_skills: int
            - paths_generated: int
            - early_completions: int
            - late_completions: int
            - unlocked_achievements: list of achievement IDs
    
    Returns:
        List of newly unlocked achievements
    """
    achievements_data = load_achievements()
    all_achievements = achievements_data['achievements']
    
    unlocked = user_stats.get('unlocked_achievements', [])
    newly_unlocked = []
    
    for achievement in all_achievements:
        # Skip if already unlocked
        if achievement['id'] in unlocked:
            continue
        
        condition = achievement['condition']
        condition_type = condition['type']
        required_value = condition['value']
        
        # Check condition
        is_unlocked = False
        
        if condition_type == 'courses_completed':
            is_unlocked = user_stats.get('courses_completed', 0) >= required_value
        elif condition_type == 'quizzes_passed':
            is_unlocked = user_stats.get('quizzes_passed', 0) >= required_value
        elif condition_type == 'quizzes_attempted':
            is_unlocked = user_stats.get('quizzes_attempted', 0) >= required_value
        elif condition_type == 'perfect_quiz':
            is_unlocked = user_stats.get('perfect_quizzes', 0) >= required_value
        elif condition_type == 'streak_days':
            is_unlocked = user_stats.get('streak_days', 0) >= required_value
        elif condition_type == 'unique_skills':
            is_unlocked = user_stats.get('unique_skills', 0) >= required_value
        elif condition_type == 'paths_generated':
            is_unlocked = user_stats.get('paths_generated', 0) >= required_value
        elif condition_type == 'early_completion':
            is_unlocked = user_stats.get('early_completions', 0) >= required_value
        elif condition_type == 'late_completion':
            is_unlocked = user_stats.get('late_completions', 0) >= required_value
        
        if is_unlocked:
            newly_unlocked.append({
                'id': achievement['id'],
                'name': achievement['name'],
                'description': achievement['description'],
                'icon': achievement['icon'],
                'points': achievement['points']
            })
    
    return newly_unlocked


def calculate_xp_for_action(action_type, details=None):
    """
    Calculate XP earned for a specific action.
    
    Args:
        action_type: Type of action (course_complete, quiz_pass, etc.)
        details: Additional details about the action
    
    Returns:
        XP amount
    """
    xp_values = {
        'course_complete': 50,
        'quiz_pass': 30,
        'quiz_perfect': 100,
        'path_generate': 10,
        'daily_login': 5,
        'streak_bonus': 20,
        'course_enroll': 10,
        'new_high_score': 20
    }
    
    base_xp = xp_values.get(action_type, 0)
    
    # Add difficulty multipliers
    if details and 'difficulty' in details:
        difficulty = details['difficulty']
        if difficulty == 'Intermediate':
            base_xp = int(base_xp * 1.5)
        elif difficulty == 'Advanced':
            base_xp = int(base_xp * 2)
    
    return base_xp


def get_all_achievements():
    """Get all available achievements."""
    achievements_data = load_achievements()
    return achievements_data['achievements']


def get_leaderboard_stats(user_stats):
    """
    Calculate stats for leaderboard display.
    
    Args:
        user_stats: User statistics dictionary
    
    Returns:
        Dictionary with formatted leaderboard stats
    """
    level_info = calculate_level(user_stats.get('total_xp', 0))
    
    return {
        'username': user_stats.get('username', 'Anonymous'),
        'level': level_info['current_level'],
        'title': level_info['current_title'],
        'total_xp': user_stats.get('total_xp', 0),
        'courses_completed': user_stats.get('courses_completed', 0),
        'quizzes_passed': user_stats.get('quizzes_passed', 0),
        'achievements_unlocked': len(user_stats.get('unlocked_achievements', [])),
        'streak_days': user_stats.get('streak_days', 0)
    }
