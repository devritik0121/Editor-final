import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI("AIzaSyBXSavkUG6zMvghZRLrewel7sP3TizToFY")

export async function POST(request: NextRequest) {
  try {
    const { message, editorContent } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `You are a friendly and helpful writing assistant integrated with a text editor. You can help users with writing, editing, content creation, and general conversation.

${editorContent ? `Current editor content: "${editorContent}"` : "The editor is currently empty."}

User message: "${message}"

Instructions:
- Be conversational and friendly - respond to greetings like "Hi", "Hello", etc. naturally
- Help with writing, editing, grammar, content suggestions, and general questions
- If the user asks about their content, reference what's currently in the editor
- Provide clear, actionable advice when requested
- Keep responses helpful and supportive
- You can engage in general conversation while being ready to help with writing tasks
- If asked to modify content, suggest specific improvements

Please respond naturally to the user's message.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      response: text || "Hello! I'm here to help you with your writing. How can I assist you today?",
    })
  } catch (error) {
    console.error("Gemini Chat Error:", error)
    if (error.message?.includes("quota") || error.message?.includes("429")) {
      return NextResponse.json(
        {
          error: "I'm currently experiencing high usage. Please try again in a few moments! 😊",
        },
        { status: 429 },
      )
    }
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        {
          error: "There's an issue with the AI service configuration. Please contact support.",
        },
        { status: 500 },
      )
    }
    return NextResponse.json(
      {
        error: "I'm having some technical difficulties. Please try again in a moment.",
      },
      { status: 500 },
    )
  }
}
