# Installation & Setup Guide

## Prerequisites

- Python 3.7+
- pip (Python package manager)
- Git

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/jaisoncherian/learningpathrecommender.git
cd learningpathrecommender
```

### 2. Create Virtual Environment
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python backend/app.py
```

The application will start at `http://localhost:5000`

## Project Structure

```
learningpathrecommender/
├── backend/
│   ├── app.py              # Flask application & API endpoints
│   ├── recommender.py      # Learning path generation algorithm
│   ├── skill_gap.py        # Skill gap analysis engine
│   └── utils.py            # Utility functions
├── frontend/
│   ├── index.html          # Main UI template
│   ├── style.css           # Styling
│   └── script.js           # Frontend logic
├── data/
│   └── courses.json        # Course database (32 courses)
├── requirements.txt        # Python dependencies
└── README.md              # Project overview
```

## Dependencies

- **Flask** (2.0+): Web framework
- **Flask-CORS** (3.0.10+): Cross-origin resource sharing
- **Werkzeug** (2.0+): WSGI utility library

## Configuration

### Environment Variables

Optional environment variables:
- `FLASK_ENV`: Set to `development` for debug mode (default)
- `FLASK_PORT`: Port to run on (default: 5000)

### Database

Course data is stored in `data/courses.json`. To add more courses:

1. Open `data/courses.json`
2. Add a new course object:
```json
{
  "id": "c33",
  "title": "Your Course Title",
  "description": "Course description",
  "skills": ["Skill1", "Skill2"],
  "prerequisites": ["c1"],
  "difficulty": "Beginner|Intermediate|Advanced",
  "time": "4h",
  "instructor": "Instructor Name",
  "platform": "Platform Name"
}
```

## Troubleshooting

### Module not found errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Port already in use
```bash
# Run on different port
FLASK_PORT=5001 python backend/app.py
```

### CORS errors
CORS is enabled by default. If issues persist, check `backend/app.py` line with `CORS()`.

## Development

### Running in Debug Mode
Debug mode is enabled by default. Changes to Python files will trigger auto-reload.

### Testing Endpoints
Use curl or Postman:
```bash
curl http://localhost:5000/api/health
```

## Deployment

For production deployment:
1. Set `FLASK_ENV=production`
2. Use a production WSGI server (Gunicorn, uWSGI)
3. Set up a reverse proxy (Nginx, Apache)
4. Enable HTTPS

Example with Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 backend:app
```
