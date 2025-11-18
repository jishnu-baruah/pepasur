"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PixelInput } from "@/components/ui/pixel-input"

interface ChatModalProps {
  onComplete: () => void
}

interface Task {
  id: string
  title: string
  description: string
  type: 'decode' | 'puzzle' | 'quiz'
  completed: boolean
  reward: string
}

export default function ChatModal({ onComplete }: ChatModalProps) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat')
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Decode Space Signal',
      description: 'Decode the binary message from the space station',
      type: 'decode',
      completed: false,
      reward: '+50 XP'
    },
    {
      id: '2', 
      title: 'Identify Suspicious Behavior',
      description: 'Find clues about who might be the ASUR',
      type: 'puzzle',
      completed: false,
      reward: '+75 XP'
    },
    {
      id: '3',
      title: 'Vote Analysis',
      description: 'Analyze voting patterns to find the mafia',
      type: 'quiz',
      completed: false,
      reward: '+100 XP'
    }
  ])
  const [messages, setMessages] = useState<string[]>([
    "🚀 Player1: Anyone suspicious?",
    "👁️ Player2: I think Player3 is acting weird...",
    "🤖 Player3: I was just observing!",
    "💫 Player4: The binary code might be a clue!",
  ])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      onComplete()
    }
  }, [timeLeft, onComplete])

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, `🎮 You: ${message}`])
      setMessage("")
    }
  }

  const handleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    ))
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 gaming-bg">
      {/* Cool animated background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#4A8C4A] floating-element"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-[#A259FF] floating-element"></div>
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-[#FFEA00] floating-element"></div>
      </div>

      <Card className="w-full h-full max-w-7xl bg-[#0A0A0A]/95 backdrop-blur-sm border-2 border-[#4A8C4A] flex flex-col relative overflow-hidden m-2 sm:m-4">
        {/* Cool header with animated elements */}
        <div className="p-3 sm:p-6 border-b-2 border-[#4A8C4A] bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] relative">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-xl sm:text-2xl">💬</div>
              <h3 className="text-lg sm:text-2xl font-press-start pixel-text-3d-white pixel-text-3d-float">DISCUSSION PHASE</h3>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-sm sm:text-lg font-press-start pixel-text-3d-green timer-pulse">
                ⏰ {timeLeft}s
              </div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#4A8C4A] animate-pulse rounded-none"></div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 sm:space-x-2 mt-3 sm:mt-4">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-2 sm:px-4 py-1 sm:py-2 font-press-start text-xs sm:text-sm border-2 transition-all ${
                activeTab === 'chat' 
                  ? 'bg-[#4A8C4A] text-white border-[#4A8C4A] pixel-text-3d-white tab-active' 
                  : 'bg-transparent text-[#4A8C4A] border-[#4A8C4A] hover:bg-[#4A8C4A]/20'
              }`}
            >
              💬 CHAT
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-2 sm:px-4 py-1 sm:py-2 font-press-start text-xs sm:text-sm border-2 transition-all ${
                activeTab === 'tasks' 
                  ? 'bg-[#A259FF] text-white border-[#A259FF] pixel-text-3d-white tab-active' 
                  : 'bg-transparent text-[#A259FF] border-[#A259FF] hover:bg-[#A259FF]/20'
              }`}
            >
              🎯 TASKS
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {activeTab === 'chat' ? (
            <>
              {/* Chat Messages */}
              <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-2 sm:space-y-3 bg-[#111111]/50 min-h-0">
                {messages.map((msg, i) => (
                  <div key={i} className="font-press-start text-xs sm:text-sm pixel-text-3d-white bg-[#1A1A1A]/80 p-2 sm:p-3 border border-[#2A2A2A] chat-message-glow chat-message-enter">
                    {msg}
                  </div>
                ))}
              </div>

              {/* Quick Task Panel */}
              <div className="w-full lg:w-80 p-3 sm:p-4 border-t-2 lg:border-t-0 lg:border-l-2 border-[#4A8C4A] bg-[#0F0F0F]/80 flex-shrink-0">
                <h4 className="text-sm sm:text-lg font-press-start pixel-text-3d-green mb-3 sm:mb-4">🎯 QUICK TASKS</h4>
                <div className="space-y-2 sm:space-y-3">
                  {tasks.slice(0, 2).map((task) => (
                    <div key={task.id} className={`p-2 sm:p-3 border-2 task-card-glow ${task.completed ? 'border-[#4A8C4A] bg-[#4A8C4A]/20 task-complete' : 'border-[#2A2A2A] bg-[#1A1A1A]/50'}`}>
                      <div className="font-press-start text-xs pixel-text-3d-white mb-1">{task.title}</div>
                      <div className="font-press-start text-xs text-[#4A8C4A] mb-2">{task.reward}</div>
                      {!task.completed && (
                        <Button
                          onClick={() => handleTaskComplete(task.id)}
                          variant="pixel"
                          size="sm"
                          className="w-full text-xs"
                        >
                          COMPLETE
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Tasks Tab */
            <div className="flex-1 p-3 sm:p-6 overflow-y-auto min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {tasks.map((task) => (
                  <Card key={task.id} className={`p-4 border-2 task-card-glow ${task.completed ? 'border-[#4A8C4A] bg-[#4A8C4A]/10 task-complete' : 'border-[#2A2A2A] bg-[#1A1A1A]/50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">
                        {task.type === 'decode' ? '🔐' : task.type === 'puzzle' ? '🧩' : '❓'}
                      </div>
                      <div className="font-press-start text-sm pixel-text-3d-green">{task.reward}</div>
                    </div>
                    <h4 className="font-press-start text-sm pixel-text-3d-white mb-2">{task.title}</h4>
                    <p className="font-press-start text-xs text-[#CCCCCC] mb-4">{task.description}</p>
                    {task.type === 'decode' && (
                      <div className="font-press-start text-xs pixel-text-3d-white bg-[#000000] p-2 border border-[#4A8C4A] mb-3">
                        01001000 01100101 01101100 01110000
                      </div>
                    )}
                    {!task.completed ? (
                      <Button
                        onClick={() => handleTaskComplete(task.id)}
                        variant="pixel"
                        size="sm"
                        className="w-full"
                      >
                        START TASK
                      </Button>
                    ) : (
                      <div className="font-press-start text-sm pixel-text-3d-green text-center">✅ COMPLETED</div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Input Area */}
        <div className="p-3 sm:p-6 border-t-2 border-[#4A8C4A] bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] flex-shrink-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex-1 relative">
              <PixelInput
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-[#1A1A1A] border-2 border-[#4A8C4A] text-white placeholder-[#666666] pixel-input-focus text-sm"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#4A8C4A] text-xs font-press-start">
                {message.length}/100
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              variant="pixel"
              size="pixelLarge"
              className="px-4 sm:px-8 text-sm"
            >
              🚀 SEND
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
