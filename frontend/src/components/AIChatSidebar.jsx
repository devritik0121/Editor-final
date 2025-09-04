"use client"

import React, { useRef, useEffect } from "react"
import { aiService } from "../services/aiService"
import "./AIChatSidebar.css"

function AIChatSidebar({ editorContent, onEditorUpdate }) {
  const [messages, setMessages] = React.useState([
    {
      id: 1,
      content:
        "Hello! I'm your writing assistant. I can help you improve your content, fix grammar, and enhance your writing style. How can I help you today?",
      role: "ai",
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new message comes
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea height with max limit (Fixed!)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const newHeight = Math.min(textareaRef.current.scrollHeight, 80) // Reduced max height
      textareaRef.current.style.height = newHeight + "px"
    }
  }, [input])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { id: Date.now(), content: input, role: "user" }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await aiService.chatWithAI(input, editorContent)

      const aiMessage = {
        id: Date.now() + 1,
        content: response,
        role: "ai",
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage = {
        id: Date.now() + 1,
        content: "Sorry, I'm having trouble connecting right now. Please check your connection and try again.",
        role: "ai",
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setLoading(false)
    setInput("")
  }

  const quickSuggestions = ["Rewrite professionally", "Make engaging", "Fix grammar"]

  const handleQuickSuggestion = async (suggestion) => {
    if (!editorContent || !editorContent.trim()) {
      const userMessage = { id: Date.now(), content: suggestion, role: "user" }
      setMessages((prev) => [...prev, userMessage])

      const aiMessage = {
        id: Date.now() + 1,
        content: "Please add some content to the editor first, then I can help you " + suggestion.toLowerCase() + ".",
        role: "ai",
      }
      setMessages((prev) => [...prev, aiMessage])
      return
    }

    const userMessage = { id: Date.now(), content: suggestion, role: "user" }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const aiResponse = await aiService.getEditorModification(suggestion, editorContent)

      if (aiResponse.type === "editor" && onEditorUpdate) {
        onEditorUpdate(aiResponse.content)

        const aiMessage = {
          id: Date.now() + 1,
          content: "✅ Updated your editor content! Check the changes.",
          role: "ai",
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        const aiMessage = {
          id: Date.now() + 1,
          content: aiResponse.content,
          role: "ai",
        }
        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (error) {
      console.error("Quick suggestion error:", error)
      const errorMessage = {
        id: Date.now() + 1,
        content: "Sorry, I couldn't process that request. Please try again.",
        role: "ai",
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!loading && input.trim()) {
        sendMessage()
      }
    }
  }

  return (
    <div className="ai-chat-sidebar w-80 h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex flex-col border-l border-purple-200 shadow-lg">
      {/* Header - Fixed and Visible */}
      <div className="ai-chat-header sticky top-0 z-10 shadow-lg border-b border-purple-800">
        <div className="p-1 text-center">
          <h2 className="ai-chat-title text-xl font-bold tracking-wide">AI Assistant</h2>
        </div>
      </div>

      {/* Messages Container - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-fadeIn`}>
            <div
              className={`ai-chat-avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md ${msg.role === "user" ? "user-avatar" : "ai-avatar"}`}
            >
              {msg.role === "user" ? "U" : "AI"}
            </div>
            <div
              className={`max-w-[75%] p-3 rounded-xl shadow-md transition-all duration-300 ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                  : "bg-white border border-purple-200 text-purple-900"
              }`}
            >
              <div className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 animate-pulse">
            <div className="ai-chat-avatar ai-avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md">
              AI
            </div>
            <div className="bg-white border border-purple-200 p-3 rounded-xl shadow-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section - Fixed at Bottom (Fixed sizing!) */}
      <div className="flex-shrink-0 p-3 bg-white border-t-2 border-purple-200 shadow-lg">
        {/* Quick Suggestions - Compact */}
        <div className="mb-3">
          <p className="text-xs text-purple-600 mb-2 font-medium">Quick Actions:</p>
          <div className="flex gap-1 flex-wrap">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleQuickSuggestion(suggestion)}
                disabled={loading}
                className="px-2 py-1 bg-purple-100 border border-purple-300 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area - Properly Aligned */}
        <div className="flex mb-5 gap-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for writing help..."
              disabled={loading}
              rows={1}
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 resize-none overflow-hidden text-sm text-purple-900 placeholder-purple-400"
              style={{
                minHeight: "40px",
                maxHeight: "80px", // Reduced max height
              }}
            />
            <p className="text-xs text-purple-500 mt-1">Press Enter to send</p>
          </div>

          {/* Send Button - Fixed Size */}
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg"
            title="Send message"
          >
            {loading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIChatSidebar
