# API Documentation

## Learning Path Recommender API

Base URL: `http://localhost:5000/api`

### Endpoints

#### 1. Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Description**: Verify API is running
- **Response**:
```json
{
  "status": "ok",
  "courses_loaded": 32,
  "message": "Learning Path Recommender API is running"
}
```

#### 2. Get All Courses
- **URL**: `/courses`
- **Method**: `GET`
- **Description**: Retrieve all available courses
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c1",
      "title": "Introduction to Programming",
      "description": "Learn the fundamentals of programming with Python",
      "skills": ["Programming Basics", "Python"],
      "prerequisites": [],
      "difficulty": "Beginner",
      "time": "3h",
      "instructor": "AI Academy",
      "platform": "AI Academy"
    }
  ],
  "total": 32
}
```

#### 3. Get Specific Course
- **URL**: `/courses/<course_id>`
- **Method**: `GET`
- **Description**: Get details of a specific course
- **Example**: `/courses/c1`
- **Response**: Single course object

#### 4. Get All Skills
- **URL**: `/skills`
- **Method**: `GET`
- **Description**: Get all unique skills in database
- **Response**:
```json
{
  "success": true,
  "skills": ["Python", "JavaScript", "React", ...],
  "total": 26
}
```

#### 5. Get Courses by Skill
- **URL**: `/courses/skill/<skill_name>`
- **Method**: `GET`
- **Description**: Get all courses teaching a specific skill
- **Example**: `/courses/skill/Python`

#### 6. Generate Learning Path
- **URL**: `/recommend`
- **Method**: `POST`
- **Description**: Generate personalized learning path
- **Request Body**:
```json
{
  "target_skill": "Machine Learning",
  "level": "Beginner"
}
```
- **Response**:
```json
{
  "success": true,
  "learning_path": [
    {
      "id": "c1",
      "title": "Introduction to Programming",
      "reason": "Foundation for machine learning"
    }
  ],
  "total_courses": 5,
  "estimated_time": "25h",
  "skill_coverage": 0.85
}
```

#### 7. Analyze Skill Gap
- **URL**: `/skill-gap`
- **Method**: `POST`
- **Description**: Analyze skill gaps from user profile
- **Request Body**:
```json
{
  "profile": "I know Python, JavaScript and have worked with React. I want to learn Machine Learning and AWS"
}
```
- **Response**:
```json
{
  "success": true,
  "mentioned_skills": ["Python", "JavaScript", "React", "Machine Learning", "AWS"],
  "skill_coverage": 0.65,
  "gaps": ["Data Science", "TensorFlow"],
  "recommendations": [
    {
      "id": "c15",
      "title": "Machine Learning Fundamentals",
      "matches_gap": ["Data Science", "Machine Learning"]
    }
  ]
}
```

#### 8. Get Course Dependencies
- **URL**: `/course/<course_id>/dependencies`
- **Method**: `GET`
- **Description**: Get prerequisites for a course
- **Example**: `/course/c3/dependencies`
- **Response**:
```json
{
  "success": true,
  "course_id": "c3",
  "course_title": "Advanced Algorithms",
  "dependencies": ["c1", "c2"],
  "dependency_chain": [
    {
      "id": "c1",
      "title": "Introduction to Programming"
    }
  ]
}
```

### Error Responses

#### 404 Not Found
```json
{
  "error": "Course not found",
  "success": false
}
```

#### 400 Bad Request
```json
{
  "error": "Invalid request parameters",
  "success": false
}
```

### Usage Examples

**Python:**
```python
import requests

# Get all skills
response = requests.get('http://localhost:5000/api/skills')
skills = response.json()['skills']

# Generate learning path
response = requests.post('http://localhost:5000/api/recommend', json={
  'target_skill': 'Machine Learning',
  'level': 'Beginner'
})
path = response.json()
```

**JavaScript:**
```javascript
// Get all courses
fetch('/api/courses')
  .then(res => res.json())
  .then(data => console.log(data.data));

// Generate recommendation
fetch('/api/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target_skill: 'Python',
    level: 'Intermediate'
  })
})
  .then(res => res.json())
  .then(data => console.log(data.learning_path));
```
