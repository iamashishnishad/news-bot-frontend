# News Chatbot Frontend

A modern React-based frontend for a RAG-powered news chatbot that allows users to ask questions about recent news articles.

## 🌟 Features

- **Real-time Chat Interface**: Beautiful, responsive chat UI built with React and SCSS
- **Session Management**: Persistent chat history using Redis
- **Streaming Responses**: Live typing indicators for better UX
- **Source Attribution**: Shows which news articles answers come from
- **Mobile Responsive**: Works perfectly on all device sizes

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: SCSS with custom design system
- **Real-time Communication**: Socket.IO client
- **HTTP Client**: Axios for API calls
- **Build Tool**: Vite for fast development

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/iamashishnishad/news-bot-frontend.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env