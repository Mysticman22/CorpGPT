# CorpGPT

A modern, full-stack AI-powered corporate productivity platform with local chatbot capabilities.

## Architecture

- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite (Tailwind CSS 4, Framer Motion)
- **AI/LLM**: Ollama (Local AI models)
- **Database**: PostgreSQL, Redis
- **Infrastructure**: Docker Compose

## Features

✨ **Modern UI/UX** - Dark mode, glassmorphism, smooth animations  
🤖 **Local AI Chat** - Privacy-focused chatbot with Ollama integration  
🔒 **Secure Auth** - Admin-verified registration with OTP  
📱 **Responsive Design** - Beautiful on all devices

## Getting Started

### 1. Install Ollama (Required for AI Chat)

Download and install Ollama from [https://ollama.ai/download](https://ollama.ai/download)

After installation, pull the required models:
```bash
ollama pull mistral
ollama pull nomic-embed-text
```

Ollama will run automatically on `http://localhost:11434`


### 3. Start Backend

```bash
cd backend
pip install -r requirements.txt
python -m app.main
```

Backend runs on `http://localhost:8000`

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Using the AI Chat

1. Navigate to the chat page (`/chat`)
2. The app will auto-detect your Ollama connection
3. Start chatting with Mistral!
4. Switch models in Settings if you have multiple installed

## Documentation

See artifact files in `.gemini/antigravity/brain/` for:
- Implementation plans
- Task breakdowns
- Detailed walkthroughs
