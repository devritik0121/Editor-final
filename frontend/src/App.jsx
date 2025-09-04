"use client"

import React from "react"
import TextEditor from "./components/TextEditor"
import AIChatSidebar from "./components/AIChatSidebar"

function App() {
  const [selectedText, setSelectedText] = React.useState("")
  const [editorContent, setEditorContent] = React.useState("")

  const handleTextSelect = (text) => {
    setSelectedText(text)
    console.log("Selected text:", text)
  }

  const handleEditorContentChange = (content) => {
    setEditorContent(content)
  }

  const handleEditorUpdate = (newContent) => {
    setEditorContent(newContent)
    // Trigger editor update via ref or state
    window.dispatchEvent(new CustomEvent("updateEditor", { detail: newContent }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-900 mb-2 text-balance">AI Powered - Text Editor</h1>
          <p className="text-purple-700 text-lg"></p>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* Left Side - Editor Container */}
          <div className="flex-1 flex flex-col">
            <div className="bg-white rounded-xl shadow-xl border border-purple-200 overflow-hidden h-full transition-all duration-300 hover:shadow-2xl">
              <TextEditor onTextSelect={handleTextSelect} onContentChange={handleEditorContentChange} />
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-purple-700 bg-purple-50 px-4 py-2 rounded-lg inline-block border border-purple-200 transition-all duration-300 hover:bg-purple-100">
                💡 Please select the text to get AI suggestions.
              </p>
            </div>
          </div>

          {/* Right Side - AI Chat Container */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-xl border border-purple-200 h-full overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <AIChatSidebar editorContent={editorContent} onEditorUpdate={handleEditorUpdate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
