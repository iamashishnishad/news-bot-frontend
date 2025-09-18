import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import './App.scss'

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Generate a unique session ID if not exists
    const storedSessionId = localStorage.getItem('chatSessionId')
    if (storedSessionId) {
      setSessionId(storedSessionId)
    } else {
      const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('chatSessionId', newSessionId)
      setSessionId(newSessionId)
    }

    // Connect to Socket.IO server
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000')

    socketRef.current.on('connect', () => {
      setIsConnected(true)
      socketRef.current.emit('join', sessionId || storedSessionId)
    })

    socketRef.current.on('disconnect', () => {
      setIsConnected(false)
    })

    socketRef.current.on('receive_message', (data) => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.content,
        sources: data.sources,
        timestamp: new Date().toISOString()
      }])
      setIsLoading(false)
    })

    socketRef.current.on('error', (data) => {
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: data.message || 'An error occurred',
        timestamp: new Date().toISOString()
      }])
      setIsLoading(false)
    })

    // Load chat history
    if (storedSessionId) {
      fetchChatHistory(storedSessionId)
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChatHistory = async (sessionId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/chat/history/${sessionId}`)
      const data = await response.json()
      if (data.history) {
        setMessages(data.history)
      }
    } catch (error) {
      console.error('Error fetching chat history:', error)
    }
  }

  const sendMessage = () => {
    if (inputMessage.trim() === '' || isLoading) return

    const newMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, newMessage])
    setInputMessage('')
    setIsLoading(true)

    // Send message via Socket.IO
    socketRef.current.emit('send_message', {
      message: inputMessage,
      sessionId: sessionId
    })
  }

  const clearChat = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/chat/history/${sessionId}`, {
        method: 'DELETE'
      })
      setMessages([])
    } catch (error) {
      console.error('Error clearing chat:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  return (
    <div className="chat-app">
      <div className="chat-header">
        <h1>News Chatbot</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <button className="clear-btn" onClick={clearChat}>Clear Chat</button>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h2>Welcome to the News Chatbot!</h2>
              <p>Ask me questions about recent news articles.</p>
              <p>Try questions like:</p>
              <ul>
                <li>What are the latest technology news?</li>
                <li>Tell me about recent business developments</li>
                <li>What's happening in politics today?</li>
              </ul>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  {message.role === 'user' && (
                    <div className="message-bubble user-bubble">
                      {message.content}
                    </div>
                  )}
                  {message.role === 'assistant' && (
                    <div className="message-bubble assistant-bubble">
                      {message.content}
                      {message.sources && message.sources.length > 0 && (
                        <div className="sources">
                          <p>Sources:</p>
                          <ul>
                            {message.sources.map((source, i) => (
                              <li key={i}>
                                <a href={source} target="_blank" rel="noopener noreferrer">
                                  {new URL(source).hostname}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {message.role === 'error' && (
                    <div className="message-bubble error-bubble">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="message-bubble assistant-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about news..."
            disabled={isLoading || !isConnected}
          />
          <button 
            onClick={sendMessage} 
            disabled={inputMessage.trim() === '' || isLoading || !isConnected}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default App