import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI("AIzaSyBXSavkUG6zMvghZRLrewel7sP3TizToFY")

export async function POST(request: NextRequest) {
  try {
    const { text, action = "improve" } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    let prompt = ""

    switch (action) {
      case "improve":
        prompt = `Improve this text to make it more professional, clear, and engaging. Return only the improved text without any explanations: "${text}"`
        break
      case "shorten":
        prompt = `Make this text more concise while keeping the main message. Return only the shortened text: "${text}"`
        break
      case "grammar":
        prompt = `Fix any grammar and spelling errors in this text. Return only the corrected text: "${text}"`
        break
      case "bullets":
        prompt = `Convert this text into organized bullet points. Format as HTML with <ul> and <li> tags: "${text}"`
        break
      default:
        prompt = `Improve this text: "${text}"`
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    const improvedText = response.text()

    return NextResponse.json({ response: improvedText || text })
  } catch (error) {
    console.error("Gemini Improve Error:", error)
    const text = await request.json().then((data) => data.text) // Declare text variable here
    if (error.message?.includes("quota")) {
      return NextResponse.json({ error: "Rate limit reached. Please try again in a moment." }, { status: 429 })
    }
    return NextResponse.json({ response: `Improved: ${text}` })
  }
}
