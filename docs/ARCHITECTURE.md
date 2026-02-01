# Architecture & Design

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (HTML/CSS/JS)                  │
│  - Responsive UI with 3 tabs                               │
│  - Real-time API integration                               │
│  - Interactive skill selector                              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Requests (JSON)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            Flask REST API (Python Backend)                  │
│  - 11 REST endpoints                                        │
│  - Request routing & handling                              │
│  - CORS enabled                                            │
└────┬──────────────┬──────────────┬──────────────────────────┘
     │              │              │
     ↓              ↓              ↓
┌─────────┐  ┌──────────────┐  ┌──────────────┐
│ courses │  │ recommender  │  │  skill_gap   │
│ utils   │  │  algorithm   │  │   analyzer   │
└────┬────┘  └──────┬───────┘  └──────┬───────┘
     │              │                  │
     └──────────────┼──────────────────┘
                    ↓
            ┌───────────────────┐
            │  Data: JSON File  │
            │  (32 courses)     │
            └───────────────────┘
```

## Component Overview

### Frontend (`frontend/`)

**index.html**
- Semantic HTML5 structure
- 3-tab interface
- Form inputs and containers
- Responsive layout

**style.css**
- CSS variables for theming
- Gradient backgrounds
- Responsive design (768px breakpoint)
- Smooth animations and transitions
- Grid and flexbox layouts

**script.js**
- API integration layer (`apiCall` function)
- UI state management
- Event listeners
- DOM manipulation
- Featured skills display

### Backend (`backend/`)

**app.py** - Main Flask Application
```python
- Initialize Flask app
- Define 11 REST endpoints
- Handle CORS
- Load courses data on startup
- Route requests to appropriate modules
```

Endpoints:
- `/api/health` - Health check
- `/api/courses` - All courses
- `/api/courses/<id>` - Specific course
- `/api/skills` - All skills
- `/api/courses/skill/<skill>` - Courses by skill
- `/api/recommend` - Generate path
- `/api/skill-gap` - Analyze gaps
- `/api/course/<id>/dependencies` - Prerequisites

**recommender.py** - Learning Path Algorithm
```python
generate_path(courses, target_skill, level)
  ├─ Filter courses by skill
  ├─ Build dependency graph
  ├─ Sort by prerequisites (topological)
  ├─ Filter by difficulty
  └─ Calculate path statistics

get_course_dependencies(courses, course_id)
  └─ Recursive prerequisite resolution

calculate_path_stats(courses, path)
  ├─ Total duration
  ├─ Skill coverage
  ├─ Difficulty progression
  └─ Prerequisite chain
```

**skill_gap.py** - Gap Analysis Engine
```python
analyze_profile(profile_text, courses)
  ├─ Extract mentioned skills
  ├─ Match with available skills
  ├─ Identify gaps
  └─ Recommend courses

get_mentioned_skills(text)
  └─ NLP-style skill detection

calculate_skill_coverage(current_skills, target_skills)
  └─ Coverage percentage
```

**utils.py** - Utility Functions
```python
load_courses(filepath)
  └─ Parse JSON course data

save_courses(filepath, courses)
  └─ Persist course updates

find_course_by_id(courses, course_id)
  └─ Binary search optimization

get_courses_by_skill(courses, skill)
  └─ Filter by skill name

get_all_skills(courses)
  └─ Extract unique skills
```

### Data Layer (`data/`)

**courses.json**
- 32 course objects
- Structure:
  ```json
  {
    "id": "unique_identifier",
    "title": "Course Title",
    "description": "Brief description",
    "skills": ["skill1", "skill2"],
    "prerequisites": ["courseId1"],
    "difficulty": "Beginner|Intermediate|Advanced",
    "time": "duration_hours",
    "instructor": "Instructor Name",
    "platform": "Source Platform"
  }
  ```

## Data Flow

### Learning Path Generation Flow

```
User Input (Skill + Level)
        ↓
API /recommend endpoint
        ↓
recommender.generate_path()
        ↓
[1] Filter courses by target skill
[2] Extract prerequisites
[3] Build dependency graph
[4] Topological sort (prerequisites first)
[5] Filter by difficulty level
[6] Calculate statistics
        ↓
Return ordered course sequence
        ↓
Frontend displays recommendations
```

### Skill Gap Analysis Flow

```
User Profile Text
        ↓
API /skill-gap endpoint
        ↓
skill_gap.analyze_profile()
        ↓
[1] Extract mentioned skills (NLP)
[2] Match with available skills
[3] Identify missing skills
[4] Find courses addressing gaps
        ↓
Return analysis with recommendations
        ↓
Frontend shows gaps and paths
```

## Key Algorithms

### Topological Sort (Prerequisite Ordering)
```
For each course in path:
  - Collect all prerequisites
  - Recursively collect prerequisites of prerequisites
  - Order courses so all prerequisites come first
  - Ensures proper learning sequence
```

### Skill Extraction
```
Iterate through course skills:
  - Case-insensitive matching
  - Word boundary matching
  - Synonym recognition (e.g., "ML" → "Machine Learning")
```

### Coverage Calculation
```
Coverage = (Addressed Skills / Total Required Skills) × 100
```

## Design Patterns

1. **MVC Pattern**
   - Model: data/courses.json
   - View: frontend/
   - Controller: backend/app.py

2. **Separation of Concerns**
   - app.py: Routing
   - recommender.py: Business logic
   - skill_gap.py: Analysis
   - utils.py: Common utilities

3. **RESTful API**
   - Stateless endpoints
   - JSON request/response
   - Standard HTTP methods

4. **Modular Frontend**
   - Utility functions (apiCall, etc.)
   - Event-driven architecture
   - Reactive DOM updates

## Scalability Considerations

**Current:**
- JSON file-based storage
- In-memory operations
- Single-threaded Flask

**Future improvements:**
- Database (PostgreSQL/MongoDB)
- Caching layer (Redis)
- Microservices architecture
- GraphQL API
- Machine learning for recommendations
