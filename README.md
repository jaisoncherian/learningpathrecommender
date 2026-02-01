# 🎓 AI Educational Agent — Learning Path Recommender

An AI-powered system that creates personalized learning paths using skill gap detection and prerequisite logic. This intelligent recommender analyzes your current skills and generates optimized learning roadmaps tailored to your level and goals.

---

## 🚀 Features

- **Personalized Learning Roadmap** - Generates customized learning paths based on target skill and proficiency level
- **Skill Gap Analysis** - Detects missing skills from a user profile and suggests relevant courses
- **Prerequisite Detection** - Automatically orders courses respecting prerequisite dependencies
- **Difficulty Adaptation** - Filters courses based on user's current skill level (Beginner, Intermediate, Advanced)
- **JSON-based Dataset** - Easy-to-extend course database with structured skill mappings
- **REST API Backend** - Full-featured API endpoints for flexible frontend integration

---

## ⚙️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) |
| **Backend** | Flask (Python) |
| **AI Logic** | Rule-based recommender system |
| **Data Format** | JSON |
| **Architecture** | Microservices-style REST API |

---

## 📁 Project Structure

```
learningpathrecommender/
├── backend/
│   ├── app.py              # Flask application & API endpoints
│   ├── recommender.py      # Course path generation logic
│   ├── skill_gap.py        # Skill gap analysis engine
│   └── utils.py            # Utility functions (data loading)
├── frontend/
│   ├── index.html          # Main UI template
│   ├── script.js           # Frontend logic & API interactions
│   └── style.css           # UI styling
├── data/
│   └── courses.json        # Course database with skills & prerequisites
├── docs/                   # Documentation (expandable)
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

---

## 🧠 How It Works

### User Flow

1. **User Input** → Select target skill and current proficiency level
2. **Backend Analysis** → System analyzes course database for matches
3. **Path Generation** → Algorithm builds ordered path respecting prerequisites
4. **Difficulty Filtering** → Filters out courses above user's level
5. **Recommendation Display** → Formatted learning path shown to user

### Core Algorithms

#### Path Generation (`recommender.py`)
- Identifies all courses teaching the target skill
- Builds dependency graph from prerequisites
- Topologically sorts courses to respect dependencies
- Filters by user's proficiency level
- Returns ordered list with metadata (duration, difficulty)

#### Skill Gap Analysis (`skill_gap.py`)
- Parses user profile text to identify mentioned skills
- Cross-references with available courses
- Identifies missing high-value skills
- Suggests courses covering each gap

---

## 🔧 Quick Start

### Prerequisites
- Python 3.7+
- pip package manager

### Installation & Setup

```bash
# Clone/navigate to project directory
cd Desktop\learningpathrecommender

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run the application
python backend\app.py
```

### Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 📡 API Endpoints

### Get All Courses
```
GET /api/courses
Response: { "courses": [...] }
```

### Generate Learning Path
```
POST /api/recommend
Body: { "skill": "Algorithms", "level": "Beginner" }
Response: { "path": [...] }
```

### Analyze Skill Gaps
```
POST /api/skill-gap
Body: { "profile": "I know Python and basic web development" }
Response: { "gaps": [...] }
```

---

## 📊 Sample Data Structure

Courses are defined in `data/courses.json`:

```json
{
  "id": "c1",
  "title": "Intro to Programming",
  "skills": ["Programming Basics"],
  "prerequisites": [],
  "difficulty": "Beginner",
  "time": "3h"
}
```

---

## 🔮 Future Scope

- **Interactive Visualizer** - Visual dependency graph of learning paths
- **Quiz Generator** - Auto-generated assessments for each course
- **Progress Tracker** - User profiles tracking completed courses and skill mastery
- **AI Mentor** - Chatbot providing real-time learning guidance
- **Adaptive Learning** - ML-based difficulty adjustment based on performance
- **Mobile App** - React Native or Flutter cross-platform application
- **Course Ratings** - Community feedback integration
- **Integration** - Connect with platforms like Coursera, Udemy, LinkedIn Learning

---

## 🛠️ Development

### Adding New Courses

Edit `data/courses.json` to add courses:

```json
{
  "id": "c6",
  "title": "Machine Learning Basics",
  "skills": ["Machine Learning", "Python"],
  "prerequisites": ["c1", "c2"],
  "difficulty": "Advanced",
  "time": "8h"
}
```

### Project Dependencies

- **Flask** ≥2.0 - Web framework
- *Additional dependencies can be added as needed*

---

## 📝 License

This project is open source and available for educational purposes.

---

## 👨‍💻 Author

Created as an educational AI learning path recommendation system.

---

**Last Updated:** February 2, 2026
