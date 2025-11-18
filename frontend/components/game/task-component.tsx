"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Game } from "@/services/api"

interface TaskComponentProps {
  gameId: string
  currentPlayerAddress: string
  game: Game | null
  submitTaskAnswer: (answer: any) => Promise<void>
  showHeader?: boolean // Add prop to control header display
}

function TaskComponent({ gameId, currentPlayerAddress, game, submitTaskAnswer, showHeader = true }: TaskComponentProps) {
  const [answer, setAnswer] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
  const [showMemoryContent, setShowMemoryContent] = useState(false)
  const [memoryPhase, setMemoryPhase] = useState<'reveal' | 'showing' | 'input'>('reveal')
  const [countdown, setCountdown] = useState(0)

  // Get timeLeft from game prop
  const timeLeft = game?.timeLeft || 0

  // Check if player already submitted (memoized to prevent re-renders)
  const hasSubmitted = useMemo(() => {
    return Boolean(game?.task?.submissions?.[currentPlayerAddress])
  }, [game?.task?.submissions, currentPlayerAddress])

  const submittedAnswer = useMemo(() => {
    return game?.task?.submissions?.[currentPlayerAddress] || ""
  }, [game?.task?.submissions, currentPlayerAddress])

  useEffect(() => {
    if (hasSubmitted && submittedAnswer) {
      setSubmitted(true)
      setAnswer(submittedAnswer)
    }
  }, [hasSubmitted, submittedAnswer])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim() || submitted) return

    try {
      await submitTaskAnswer(answer.trim())
      setSubmitted(true)
      console.log('Task answer submitted:', answer)
    } catch (error) {
      console.error('Failed to submit task answer:', error)
    }
  }, [answer, submitted, submitTaskAnswer])

  // Handle memory tasks reveal/show/input phases
  const handleRevealMemory = () => {
    setMemoryPhase('showing')
    setShowMemoryContent(true)
    setCountdown(2)

    // Countdown from 2 to 0
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setShowMemoryContent(false)
          setMemoryPhase('input')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const renderTaskContent = () => {
    if (!game?.task) return null

    switch (game.task.type) {
      case 'memory_words':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-press-start text-white mb-2 pixel-text-3d-blue">🧠 MEMORY WORDS</h3>
              <p className="text-gray-300 text-sm">Remember 3 random words in order</p>
            </div>

            {memoryPhase === 'reveal' && (
              <div className="text-center">
                <button
                  onClick={handleRevealMemory}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-press-start rounded-none border-2 border-blue-400"
                >
                  🔍 REVEAL WORDS
                </button>
                <p className="text-yellow-400 text-xs mt-2">Click to see words for 2 seconds!</p>
              </div>
            )}

            {memoryPhase === 'showing' && showMemoryContent && (
              <div className="text-center">
                <div className="text-6xl font-bold text-red-400 mb-4">{countdown}</div>
                <div className="flex justify-center gap-4">
                  {game.task.data.words.map((word: string, index: number) => (
                    <div key={index} className="px-4 py-3 bg-yellow-600 border-2 border-yellow-400 text-black font-press-start text-lg">
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {memoryPhase === 'input' && (
              <div className="text-center">
                <p className="text-green-400 text-sm mb-4">Now type the words in order (space-separated):</p>
                <div className="text-gray-400 text-xs">Example: apple banana cherry</div>
              </div>
            )}
          </div>
        )

      case 'memory_number':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-press-start text-white mb-2 pixel-text-3d-orange">🔢 NUMBER MEMORY</h3>
              <p className="text-gray-300 text-sm">Remember the 5-digit number</p>
            </div>

            {memoryPhase === 'reveal' && (
              <div className="text-center">
                <button
                  onClick={handleRevealMemory}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-press-start rounded-none border-2 border-orange-400"
                >
                  🔍 REVEAL NUMBER
                </button>
                <p className="text-yellow-400 text-xs mt-2">Click to see number for 2 seconds!</p>
              </div>
            )}

            {memoryPhase === 'showing' && showMemoryContent && (
              <div className="text-center">
                <div className="text-6xl font-bold text-red-400 mb-4">{countdown}</div>
                <div className="text-8xl font-mono text-green-400 bg-black p-6 border-4 border-green-400 inline-block">
                  {game.task.data.number}
                </div>
              </div>
            )}

            {memoryPhase === 'input' && (
              <div className="text-center">
                <p className="text-green-400 text-sm mb-4">Now type the 5-digit number:</p>
                <div className="text-gray-400 text-xs">Enter exactly as shown</div>
              </div>
            )}
          </div>
        )

      case 'captcha':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-press-start text-white mb-2 pixel-text-3d-red">🤖 CAPTCHA CHALLENGE</h3>
              <p className="text-gray-300 text-sm">Prove you're human!</p>
            </div>
            <div className="text-center">
              <div className="inline-block bg-gray-800 p-6 border-4 border-gray-600 rounded-none">
                <div className="text-4xl font-mono text-white bg-gray-700 p-4 border-2 border-gray-500 select-none"
                  style={{
                    fontFamily: 'monospace',
                    letterSpacing: '8px',
                    transform: 'skew(-5deg)',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }}>
                  {game.task.data.captcha}
                </div>
              </div>
              <p className="text-yellow-400 text-xs mt-2">Type the characters you see above</p>
            </div>
          </div>
        )

      case 'math':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-press-start text-white mb-2 pixel-text-3d-purple">🧮 QUICK MATH</h3>
              <p className="text-gray-300 text-sm">Solve this equation</p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-mono text-purple-400 bg-black p-6 border-4 border-purple-400 inline-block">
                {game.task.data.equation}
              </div>
              <p className="text-yellow-400 text-xs mt-2">Enter the result as a number</p>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center text-gray-400">
            Unknown task type: {game.task.type}
          </div>
        )
    }
  }

  if (!game?.task) {
    return (
      <Card className="p-6 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-none text-center">
        <div className="font-press-start text-white">WAITING FOR TASK...</div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen p-4 gaming-bg">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header - Only show if showHeader is true */}
        {showHeader && (
          <div className="text-center">
            <h1 className="text-2xl font-press-start text-white pixel-text-3d-glow">TASK PHASE</h1>
            <div className="text-sm text-gray-400 mt-2">
              Complete the task to continue
            </div>
          </div>
        )}



        {/* Task Content */}
        <Card className="p-6 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-none">
          {renderTaskContent()}
        </Card>

        {/* Answer Form - Only show during input phase for memory tasks */}
        {(memoryPhase === 'input' || !['memory_words', 'memory_number'].includes(game?.task?.type)) && (
          <Card className="p-6 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-none">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-press-start text-white mb-2">
                  Your Answer:
                </label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={
                    game?.task?.type === 'memory_words' ? 'word1 word2 word3' :
                      game?.task?.type === 'memory_number' ? '12345' :
                        game?.task?.type === 'captcha' ? 'Type the captcha' :
                          game?.task?.type === 'math' ? 'Enter number result' :
                            'Enter your answer...'
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] text-white rounded-none focus:outline-none focus:border-blue-500 font-press-start"
                  disabled={submitted}
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-press-start rounded-none border-2 border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!answer.trim() || submitted}
                >
                  {submitted ? '✓ SUBMITTED' : '🚀 SUBMIT ANSWER'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Status */}
        {submitted && (
          <Card className="p-4 bg-green-900/20 border border-green-500 rounded-none text-center">
            <div className="font-press-start text-green-300">
              ✓ ANSWER SUBMITTED
            </div>
            <div className="text-sm text-green-200 mt-1">
              Waiting for other players...
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}








// Memoize the component to prevent unnecessary re-renders
export default memo(TaskComponent)