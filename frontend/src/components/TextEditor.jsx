"use client"

import { useState, useRef, useEffect } from "react"
import { aiService } from "../services/aiService"

const TextEditor = ({ onTextSelect, onContentChange }) => {
  const [content, setContent] = useState("")
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [selectedText, setSelectedText] = useState("")
  const [showAIToolbar, setShowAIToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState([""])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showOptionsPanel, setShowOptionsPanel] = useState(false)
  const [improvementOptions, setImprovementOptions] = useState([])
  const [optionsPanelPosition, setOptionsPanelPosition] = useState({ x: 0, y: 0 })

  const editorRef = useRef(null)
  const toolbarRef = useRef(null)

  const saveToHistory = (newContent) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleInput = (e) => {
    const newContent = e.target.innerHTML
    setContent(newContent)
    setShowPlaceholder(newContent.trim() === "")
    saveToHistory(newContent)
    if (onContentChange) {
      onContentChange(newContent)
    }
  }

  const handleSelection = () => {
    const selection = window.getSelection()
    const text = selection.toString().trim()

    if (text && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer

      const isWithinEditor =
        editorRef.current &&
        (editorRef.current.contains(container) ||
          editorRef.current === container ||
          (container.nodeType === Node.TEXT_NODE && editorRef.current.contains(container.parentNode)))

      if (isWithinEditor) {
        const rect = range.getBoundingClientRect()
        setSelectedText(text)
        setToolbarPosition({
          x: rect.left + rect.width / 2 - 100,
          y: rect.top - 60,
        })
        setShowAIToolbar(true)
        if (onTextSelect) {
          onTextSelect(text)
        }
      } else {
        setSelectedText("")
        setShowAIToolbar(false)
        if (onTextSelect) {
          onTextSelect("")
        }
      }
    } else {
      setSelectedText("")
      setShowAIToolbar(false)
      if (onTextSelect) {
        onTextSelect("")
      }
    }
  }

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current.focus()
    const newContent = editorRef.current.innerHTML
    setContent(newContent)
    saveToHistory(newContent)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const previousContent = history[newIndex]
      setContent(previousContent)
      setHistoryIndex(newIndex)
      editorRef.current.innerHTML = previousContent
      setShowPlaceholder(previousContent.trim() === "")
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const nextContent = history[newIndex]
      setContent(nextContent)
      setHistoryIndex(newIndex)
      editorRef.current.innerHTML = nextContent
      setShowPlaceholder(nextContent.trim() === "")
    }
  }

  const handleAIAction = async (action) => {
    if (!selectedText) return

    setIsLoading(true)
    try {
      const result = await aiService.improveText(selectedText, action)

      if (action === "improve") {
        const options = parseImprovementOptions(result)
        setImprovementOptions(options)

        const selection = window.getSelection()
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()

          let x = rect.left + rect.width / 2 - 250
          let y = rect.bottom + 20

          if (x + 500 > window.innerWidth) {
            x = window.innerWidth - 520
          }
          if (x < 20) {
            x = 20
          }

          if (y + 400 > window.innerHeight) {
            y = rect.top - 420
          }
          if (y < 20) {
            y = 20
          }

          setOptionsPanelPosition({ x, y })
        }

        setShowOptionsPanel(true)
        setShowAIToolbar(false)
      } else {
        replaceSelectedText(result)
        setShowAIToolbar(false)
        setSelectedText("")
      }
    } catch (error) {
      console.error("AI action failed:", error)
      alert("Sorry, there was an error processing your request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const parseImprovementOptions = (response) => {
    console.log('Raw AI response:', response)
    
    const lines = response.split(/\n+/).filter((line) => line.trim().length > 0)
    const options = []

    let currentOption = ""
    for (const line of lines) {
      const trimmed = line.trim()

      const isOptionStart =
        trimmed.match(/^(\*\*)?option\s*\d+/i) ||
        trimmed.match(/^\d+\./) ||
        trimmed.match(/^-\s/) ||
        trimmed.match(/^\*\s/) ||
        trimmed.match(/^•\s/) ||
        trimmed.match(/^Version\s*\d+/i) ||
        trimmed.match(/^Alternative\s*\d+/i)

      if (isOptionStart) {
        if (currentOption.trim()) {
          options.push(currentOption.trim())
        }
        currentOption = trimmed
      } else if (trimmed && currentOption) {
        currentOption += " " + trimmed
      } else if (trimmed && options.length === 0 && !currentOption) {
        options.push(trimmed)
      }
    }

    if (currentOption.trim()) {
      options.push(currentOption.trim())
    }

    if (options.length === 0) {
      const sentences = response
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20)

      if (sentences.length > 1) {
        return sentences.slice(0, 6)
      } else {
        return [response.trim()]
      }
    }

    console.log('Parsed options:', options)
    
    return options
      .filter((opt) => opt.length > 10)
      .slice(0, 8)
  }

  const replaceSelectedText = (newText) => {
    try {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(newText))

        const newContent = editorRef.current.innerHTML
        setContent(newContent)
        saveToHistory(newContent)
      }
    } catch (error) {
      console.error('Error replacing text:', error)
    }
  }

  // FIXED: Clean content extraction function
  const cleanOptionContent = (option) => {
    try {
      let cleaned = option
      
      // Extract content after colon
      const colonIndex = option.indexOf(':')
      if (colonIndex !== -1) {
        cleaned = option.substring(colonIndex + 1).trim()
      }
      
      // Remove markdown formatting and quotes
      cleaned = cleaned
        .replace(/^\*\*|\*\*$/g, '') // Remove **bold** markers
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/^`|`$/g, '') // Remove backticks
        .trim()
      
      // Remove common prefixes if still present
      cleaned = cleaned
        .replace(/^(\*\*)?Option\s*\d+[^\w]*:?\s*/i, '')
        .replace(/^(\*\*)?Version\s*\d+[^\w]*:?\s*/i, '')
        .replace(/^(\*\*)?Alternative\s*\d+[^\w]*:?\s*/i, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/^[-•*]\s*/, '')
        .replace(/^\([^)]*\)\s*:?\s*/, '')
        .trim()
      
      console.log('Original:', option)
      console.log('Cleaned:', cleaned)
      
      return cleaned || option.trim()
    } catch (error) {
      console.error('Error cleaning content:', error)
      return option.trim()
    }
  }

  // FIXED: Handle option selection with content cleaning
  const handleOptionSelect = (option) => {
    try {
      const cleanedContent = cleanOptionContent(option)
      replaceSelectedText(cleanedContent)
      setShowOptionsPanel(false)
      setSelectedText("")
      window.getSelection().removeAllRanges()
    } catch (error) {
      console.error('Error in handleOptionSelect:', error)
      // Fallback
      replaceSelectedText(option)
      setShowOptionsPanel(false)
    }
  }

  const handleMouseDown = (e) => {
    if (e.target.closest(".ai-toolbar-button")) return

    setIsDragging(true)
    const rect = toolbarRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setToolbarPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelection)
    return () => document.removeEventListener("selectionchange", handleSelection)
  }, [])

  useEffect(() => {
    const handleEditorUpdate = (event) => {
      try {
        const newContent = event.detail
        setContent(newContent)
        editorRef.current.innerHTML = newContent
        setShowPlaceholder(newContent.trim() === "")
      } catch (error) {
        console.error('Error updating editor:', error)
      }
    }

    window.addEventListener("updateEditor", handleEditorUpdate)
    return () => window.removeEventListener("updateEditor", handleEditorUpdate)
  }, [])

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b border-purple-200 p-3 bg-purple-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => formatText("bold")}
            className="px-3 py-1 border border-purple-300 rounded hover:bg-purple-100 font-bold text-purple-700 transition-all duration-200"
          >
            B
          </button>
          <button
            onClick={() => formatText("italic")}
            className="px-3 py-1 border border-purple-300 rounded hover:bg-purple-100 italic text-purple-700 transition-all duration-200"
          >
            I
          </button>
          <button
            onClick={() => {
              const url = prompt("Enter URL:")
              if (url) formatText("createLink", url)
            }}
            className="px-3 py-1 border border-purple-300 rounded hover:bg-purple-100 text-purple-700 transition-all duration-200"
          >
            Link
          </button>
          <div className="w-px h-6 bg-purple-300 mx-2"></div>
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="px-3 py-1 border border-purple-300 rounded hover:bg-purple-100 disabled:opacity-50 text-purple-700 transition-all duration-200"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="px-3 py-1 border border-purple-300 rounded hover:bg-purple-100 disabled:opacity-50 text-purple-700 transition-all duration-200"
          >
            Redo
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="w-full h-full p-6 outline-none resize-none text-gray-900 leading-relaxed"
          style={{
            minHeight: "400px",
            direction: "ltr",
            textAlign: "left",
            unicodeBidi: "normal",
            writingMode: "horizontal-tb",
          }}
          suppressContentEditableWarning={true}
        />

        {showPlaceholder && (
          <div className="absolute top-6 left-6 text-gray-400 pointer-events-none">
            Start writing your content here...
          </div>
        )}

        {/* AI Floating Toolbar */}
        {showAIToolbar && (
          <div
            ref={toolbarRef}
            className="fixed bg-white border border-purple-300 rounded-lg shadow-xl p-2 z-50 cursor-move transition-all duration-300"
            style={{
              left: `${toolbarPosition.x}px`,
              top: `${toolbarPosition.y}px`,
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAIAction("improve")}
                disabled={isLoading}
                className="ai-toolbar-button px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? "Loading..." : "Improve"}
              </button>
              <button
                onClick={() => handleAIAction("shorten")}
                disabled={isLoading}
                className="ai-toolbar-button px-3 py-1 bg-purple-400 text-white rounded text-sm hover:bg-purple-500 disabled:opacity-50 transition-all duration-200"
              >
                Shorten
              </button>
              <button
                onClick={() => handleAIAction("grammar")}
                disabled={isLoading}
                className="ai-toolbar-button px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 transition-all duration-200"
              >
                Grammar
              </button>
              <button
                onClick={() => setShowAIToolbar(false)}
                className="ai-toolbar-button px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-all duration-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* AI Options Panel */}
        {showOptionsPanel && (
          <div
            className="fixed bg-white border-2 border-purple-300 rounded-xl shadow-2xl z-50 transition-all duration-300 overflow-hidden"
            style={{
              left: `${optionsPanelPosition.x}px`,
              top: `${optionsPanelPosition.y}px`,
              width: "500px",
              maxHeight: "400px",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100 to-purple-200 border-b border-purple-300">
              <h3 className="text-sm font-bold text-purple-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                Choose the best improvement ({improvementOptions.length} options):
              </h3>
              <button
                onClick={() => setShowOptionsPanel(false)}
                className="text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition-all duration-200"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Options List */}
            <div 
              className="p-3 overflow-y-auto"
              style={{ maxHeight: "250px" }}
            >
              <div className="space-y-2">
                {improvementOptions.map((option, index) => {
                  const cleanedPreview = cleanOptionContent(option)
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(option)}
                      className="w-full text-left p-4 border-2 border-purple-200 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:border-purple-400 hover:shadow-lg transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:bg-purple-600 transition-colors duration-200"></div>
                        <span className="font-bold text-purple-700 text-sm">Option {index + 1}</span>
                        <div className="ml-auto text-xs text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to apply
                        </div>
                      </div>
                      
                      <div className="text-purple-800 text-sm leading-relaxed group-hover:text-purple-900 pr-2">
                        <div className="font-medium text-green-700 text-xs mb-1">
                          Will insert: 
                        </div>
                        <div className="italic">
                          "{cleanedPreview}"
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-purple-200 flex justify-between items-center">
              <span className="text-xs text-purple-600">Only main content will be inserted</span>
              <button
                onClick={() => setShowOptionsPanel(false)}
                className="px-4 py-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-all duration-200 border border-purple-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: #f3e8ff;
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #a855f7;
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #9333ea;
        }
      `}</style>
    </div>
  )
}

export default TextEditor
