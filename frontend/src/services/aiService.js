export const aiService = {
  // Chat with AI
  async chatWithAI(message, editorContent = null) {
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          editorContent: editorContent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          return "I'm currently experiencing high usage. Please try again in a few moments! 😊"
        }
        throw new Error(data.error || "Failed to get AI response")
      }

      return data.response || "Sorry, I couldn't process that."
    } catch (error) {
      console.error("AI Chat Error:", error)
      if (error.message?.includes("quota") || error.message?.includes("429")) {
        return "I'm currently experiencing high usage. Please try again in a few moments! 😊"
      }
      if (error.message?.includes("network") || error.message?.includes("fetch")) {
        return "I'm having trouble connecting right now. Please check your internet connection and try again."
      }
      return "Sorry, I'm having some technical difficulties. Please try again in a moment."
    }
  },

  async generateText(prompt, action = null, selectedText = null) {
    try {
      const response = await fetch("/api/ai/editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          action: action,
          selectedText: selectedText,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          return "AI editing is temporarily unavailable due to high usage. Please try again in a few moments."
        }
        throw new Error(data.error || "Failed to generate text")
      }

      return data.content || "Sorry, I couldn't process that."
    } catch (error) {
      console.error("AI Generate Text Error:", error)
      if (error.message?.includes("quota") || error.message?.includes("429")) {
        return "AI editing is temporarily unavailable due to high usage. Please try again in a few moments."
      }
      return "Sorry, I couldn't generate text right now. Please try again."
    }
  },

  async improveText(text, action = "improve") {
    try {
      const response = await fetch("/api/ai/editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedText: text,
          action: action,
          message: `Please ${action} this text: ${text}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          return "Rate limit reached. Please try again in a moment."
        }
        throw new Error(data.error || "Failed to improve text")
      }

      return data.content || text
    } catch (error) {
      console.error("AI Improve Error:", error)
      return `Improved: ${text}`
    }
  },

  // AI can suggest direct editor modifications
  async getEditorModification(message, currentContent) {
    try {
      const response = await fetch("/api/ai/editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, currentContent }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          return {
            type: "chat",
            content: "AI editing is temporarily unavailable due to high usage. Please try again in a few moments.",
          }
        }
        throw new Error(data.error || "Failed to get editor modification")
      }

      return data
    } catch (error) {
      console.error("AI Editor Modification Error:", error)
      if (error.message?.includes("quota") || error.message?.includes("429")) {
        return {
          type: "chat",
          content: "AI editing is temporarily unavailable due to high usage. Please try again in a few moments.",
        }
      }
      return {
        type: "chat",
        content: "Sorry, there was an error processing your request. Please try again.",
      }
    }
  },
}

export const { chatWithAI, improveText, getEditorModification, generateText } = aiService
