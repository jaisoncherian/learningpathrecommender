"""
Quiz generation and evaluation module.
Generates personalized quizzes based on skills and evaluates user responses.
"""

import json
import os
import random


def load_questions():
    """Load quiz questions from the data file."""
    path = os.path.join(os.path.dirname(__file__), '..', 'data', 'questions.json')
    with open(path, 'r') as f:
        return json.load(f)


def generate_quiz(skills, difficulty='Beginner', num_questions=5):
    """
    Generate a quiz for a set of skills and difficulty level.
    
    Args:
        skills: Skill name string or list of skill names
        difficulty: Difficulty level (Beginner, Intermediate, Advanced)
        num_questions: Number of questions to include
    
    Returns:
        Dictionary with quiz metadata and questions
    """
    if isinstance(skills, str):
        skills = [skills]
        
    all_questions = load_questions()
    skill_set = {s.lower() for s in skills}
    
    # Filter questions by skills and difficulty
    filtered = [
        q for q in all_questions 
        if q['skill'].lower() in skill_set and q['difficulty'] == difficulty
    ]
    
    # If not enough questions at exact difficulty, include other difficulties for these skills
    if len(filtered) < num_questions:
        filtered = [q for q in all_questions if q['skill'].lower() in skill_set]
    
    # If still no questions, try fuzzy matching or return empty
    if not filtered:
        # Try finding any question that has a skill mentioned in the input skills
        for q in all_questions:
            q_skill = q['skill'].lower()
            for s in skills:
                if q_skill in s.lower() or s.lower() in q_skill:
                    filtered.append(q)
                    break
                    
    # Randomly select questions
    selected = random.sample(filtered, min(num_questions, len(filtered)))
    
    # Remove correct answers and explanations from the response
    quiz_questions = []
    for q in selected:
        quiz_questions.append({
            'id': q['id'],
            'question': q['question'],
            'options': q['options'],
            'difficulty': q['difficulty']
        })
    
    # Use the first matching skill as the display skill
    display_skill = skills[0]
    if selected:
        display_skill = selected[0]['skill']

    return {
        'quiz_id': f"quiz_{display_skill.replace(' ', '_')}_{difficulty}_{random.randint(1000, 9999)}",
        'skill': display_skill,
        'difficulty': difficulty,
        'total_questions': len(quiz_questions),
        'questions': quiz_questions
    }


def evaluate_quiz(quiz_id, answers):
    """
    Evaluate quiz answers and calculate score.
    
    Args:
        quiz_id: Quiz identifier
        answers: Dictionary mapping question IDs to selected answer indices
    
    Returns:
        Dictionary with score, results, and feedback
    """
    all_questions = load_questions()
    question_map = {q['id']: q for q in all_questions}
    
    results = []
    correct_count = 0
    # Determine the number of questions that were actually in the quiz if possible,
    # otherwise fallback to number of answers provided.
    total_questions = len(answers)
    
    for question_id, user_answer in answers.items():
        if question_id not in question_map:
            continue
        
        question = question_map[question_id]
        is_correct = False
        try:
            # User answer might be None or invalid index
            if user_answer is not None:
                is_correct = int(user_answer) == question['correctAnswer']
        except (ValueError, TypeError):
            is_correct = False
            
        if is_correct:
            correct_count += 1
        
        # Guard against invalid answer indices for display
        selected_option = None
        try:
            if user_answer is not None and 0 <= int(user_answer) < len(question['options']):
                selected_option = question['options'][int(user_answer)]
        except (ValueError, TypeError):
            selected_option = "Invalid Answer"

        results.append({
            'question_id': question_id,
            'question': question['question'],
            'user_answer': user_answer,
            'correct_answer': question['correctAnswer'],
            'is_correct': is_correct,
            'explanation': question['explanation'],
            'selected_option': selected_option,
            'correct_option': question['options'][question['correctAnswer']]
        })
    
    score_percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
    passed = score_percentage >= 60  # 60% passing grade
    
    # Calculate XP earned
    xp_earned = correct_count * 10  # 10 XP per correct answer
    if score_percentage == 100:
        xp_earned += 50  # Bonus for perfect score
    
    return {
        'quiz_id': quiz_id,
        'total_questions': total_questions,
        'correct_answers': correct_count,
        'score_percentage': round(score_percentage, 1),
        'passed': passed,
        'xp_earned': xp_earned,
        'results': results,
        'feedback': get_feedback(score_percentage)
    }


def get_feedback(score_percentage):
    """Generate feedback message based on score."""
    if score_percentage == 100:
        return "Perfect! You've mastered this topic! 🎉"
    elif score_percentage >= 80:
        return "Excellent work! You have a strong understanding. 🌟"
    elif score_percentage >= 60:
        return "Good job! You passed, but there's room for improvement. 👍"
    else:
        return "Keep learning! Review the material and try again. 📚"


def get_available_skills():
    """Get list of skills that have quiz questions."""
    all_questions = load_questions()
    skills = set(q['skill'] for q in all_questions)
    return sorted(list(skills))


def get_question_count(skill, difficulty=None):
    """Get count of available questions for a skill and optional difficulty."""
    all_questions = load_questions()
    
    if difficulty:
        count = len([
            q for q in all_questions 
            if q['skill'].lower() == skill.lower() and q['difficulty'] == difficulty
        ])
    else:
        count = len([q for q in all_questions if q['skill'].lower() == skill.lower()])
    
    return count
