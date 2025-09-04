import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI("AIzaSyBXSavkUG6zMvghZRLrewel7sP3TizToFY")

async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      const isOverloaded = error.message?.includes("overloaded") || error.message?.includes("503")
      const isLastAttempt = i === maxRetries - 1

      if (isOverloaded && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000
        console.log(`[v0] API overloaded, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, action, selectedText, currentContent } = await request.json()

    if (!message && !selectedText) {
      return NextResponse.json({ error: "Message or selected text is required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    let prompt = ""

    if (action && selectedText) {
      // Handle AI toolbar actions
      switch (action) {
        case "improve":
          prompt = `Improve this text to make it more engaging, professional, and well-written while maintaining the original meaning: "${selectedText}"`
          break
        case "shorten":
          prompt = `Make this text more concise and to the point while preserving all key information: "${selectedText}"`
          break
        case "grammar":
          prompt = `Fix any grammar, spelling, punctuation, or syntax errors in this text. Return only the corrected version: "${selectedText}"`
          break
        case "bullets":
          prompt = `Convert this text into a clear, well-organized bullet point list. Use proper HTML formatting with <ul> and <li> tags: "${selectedText}"`
          break
        default:
          prompt = `Process this text according to the request "${action}": "${selectedText}"`
      }

      const result = await retryWithBackoff(async () => {
        return await model.generateContent(prompt)
      })

      const response = await result.response
      const suggestion = response.text().trim()

      return NextResponse.json({
        type: "suggestion",
        content: suggestion,
        originalText: selectedText,
      })
    } else {
      // Handle general editor modifications
      prompt = `You are a writing assistant. 

Current editor content: "${currentContent || ""}"

User request: "${message}"

Instructions:
- If the user wants to modify/rewrite/improve the entire editor content, respond with "EDITOR:" followed by the new content in HTML format.
- If it's just a normal chat question, respond with "CHAT:" followed by your helpful response.
- For editor modifications, maintain proper HTML formatting with <p>, <h1>, <ul>, <li>, etc. tags.

Examples:
- "Rewrite this content" → EDITOR: <new HTML content>
- "Make it professional" → EDITOR: <improved HTML content>  
- "How to write better?" → CHAT: <helpful writing tips>`

      const result = await retryWithBackoff(async () => {
        return await model.generateContent(prompt)
      })

      const response = await result.response
      const fullResponse = response.text()

      if (fullResponse.startsWith("EDITOR:")) {
        return NextResponse.json({
          type: "editor",
          content: fullResponse.replace("EDITOR:", "").trim(),
        })
      } else {
        return NextResponse.json({
          type: "chat",
          content: fullResponse.replace("CHAT:", "").trim(),
        })
      }
    }
  } catch (error: any) {
    console.error("Gemini Editor Modification Error:", error)

    if (error.message?.includes("overloaded") || error.message?.includes("503")) {
      return NextResponse.json({
        type: "chat",
        content: "The AI service is currently overloaded. Please try again in a few moments.",
      })
    }
    if (error.message?.includes("quota")) {
      return NextResponse.json({
        type: "chat",
        content: "Rate limit reached. Please wait a moment before making more requests.",
      })
    }
    if (error.message?.includes("API key")) {
      return NextResponse.json({
        type: "chat",
        content: "API configuration error. Please check the service settings.",
      })
    }

    return NextResponse.json({
      type: "chat",
      content: "Sorry, there was an error processing your request. Please try again.",
    })
  }
}
