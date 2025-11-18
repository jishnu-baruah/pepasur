"use client"

import { useState } from "react"
import ConnectionTest from "@/components/common/connection-test"
import { useGame } from "@/hooks/useGame"
import { apiService } from "@/services/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const { createGame } = useGame()

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testHealthCheck = async () => {
    try {
      const result = await apiService.healthCheck()
      addResult(`✅ Health check: ${result.status}`)
    } catch (error) {
      addResult(`❌ Health check failed: ${error}`)
    }
  }

  const testCreateGame = async () => {
    try {
      const mockAddress = "0x" + Math.random().toString(16).substr(2, 40)
      const result = await createGame(mockAddress)
      addResult(`✅ Game created: ${result}`)
    } catch (error) {
      addResult(`❌ Create game failed: ${error}`)
    }
  }



  const testActiveGames = async () => {
    try {
      const result = await apiService.getActiveGames()
      addResult(`✅ Active games: ${result.games.length}`)
    } catch (error) {
      addResult(`❌ Get active games failed: ${error}`)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen gaming-bg p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-press-start text-white mb-2">Backend Integration Test</h1>
          <p className="text-gray-400">Test the frontend-backend connection</p>
        </div>

        <ConnectionTest />

        <Card className="p-4 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a]">
          <h3 className="font-press-start text-white text-lg mb-4">API Tests</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={testHealthCheck} variant="pixel" size="sm">
              Health Check
            </Button>
            <Button onClick={testCreateGame} variant="pixel" size="sm">
              Create Game
            </Button>

            <Button onClick={testActiveGames} variant="pixel" size="sm">
              Get Active Games
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-press-start text-white text-lg">Test Results</h3>
            <Button onClick={clearResults} variant="pixelOutline" size="sm">
              Clear
            </Button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-400 text-sm">No tests run yet</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono text-gray-300">
                  {result}
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/'} 
            variant="pixelRed"
            size="pixelLarge"
          >
            Back to Game
          </Button>
        </div>
      </div>
    </div>
  )
}
