"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GameSettings } from "@/services/api"

export interface FullGameSettings {
  nightPhaseDuration: number      // seconds
  resolutionPhaseDuration: number // seconds
  taskPhaseDuration: number       // seconds
  votingPhaseDuration: number     // seconds
  maxTaskCount: number            // total tasks needed for non-asur win
  isPublic?: boolean              // lobby visibility
}

export const DEFAULT_GAME_SETTINGS: FullGameSettings = {
  nightPhaseDuration: 30,
  resolutionPhaseDuration: 10,
  taskPhaseDuration: 30,
  votingPhaseDuration: 10,
  maxTaskCount: 4,
}

export { type GameSettings }

interface LobbySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: FullGameSettings
  onSettingsChange: (settings: FullGameSettings) => void
  onSave: () => void
}

export default function LobbySettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  onSave,
}: LobbySettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<FullGameSettings>(settings)

  const handleChange = (key: keyof FullGameSettings, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const validateSettings = (settings: FullGameSettings): string[] => {
    const errors: string[] = []

    const validationRules = {
      nightPhaseDuration: { min: 1, max: 120, name: 'Night Phase Duration' },
      resolutionPhaseDuration: { min: 1, max: 60, name: 'Resolution Phase Duration' },
      taskPhaseDuration: { min: 1, max: 180, name: 'Task Phase Duration' },
      votingPhaseDuration: { min: 1, max: 60, name: 'Voting Phase Duration' },
      maxTaskCount: { min: 2, max: 20, name: 'Max Task Count' }
    }

    for (const [key, rule] of Object.entries(validationRules)) {
      const value = settings[key as keyof FullGameSettings]

      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`${rule.name} must be a valid number`)
        continue
      }

      if (value < rule.min) {
        errors.push(`${rule.name} must be at least ${rule.min}`)
      }
      if (value > rule.max) {
        errors.push(`${rule.name} cannot exceed ${rule.max}`)
      }
    }

    return errors
  }

  const handleSave = () => {
    const errors = validateSettings(localSettings)

    if (errors.length > 0) {
      alert(`Invalid settings:\n${errors.join('\n')}`)
      return
    }

    onSettingsChange(localSettings)
    onSave()
    onOpenChange(false)
  }

  const handleReset = () => {
    setLocalSettings(DEFAULT_GAME_SETTINGS)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-2 border-border max-w-[95vw] sm:max-w-lg w-full overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-press-start text-sm sm:text-lg pixel-text-3d-white text-center break-words">
            ⚙️ LOBBY SETTINGS
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-gray-400 mt-2">
            Configure game phase durations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4 max-h-[70vh] overflow-y-auto overflow-x-hidden px-1">
          {/* Phase Durations */}
          <div className="space-y-2 sm:space-y-3">
            <div className="text-xs sm:text-sm font-press-start text-gray-300 border-b border-border pb-2">
              PHASE DURATIONS
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="nightPhase" className="text-[10px] sm:text-xs font-press-start text-gray-300 break-words">
                NIGHT PHASE (seconds)
              </Label>
              <Input
                id="nightPhase"
                type="number"
                min={10}
                max={120}
                value={localSettings.nightPhaseDuration}
                onChange={(e) => handleChange('nightPhaseDuration', parseInt(e.target.value) || 30)}
                className="font-press-start text-center w-full text-sm"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="resolutionPhase" className="text-[10px] sm:text-xs font-press-start text-gray-300 break-words">
                RESOLUTION PHASE (seconds)
              </Label>
              <Input
                id="resolutionPhase"
                type="number"
                min={5}
                max={60}
                value={localSettings.resolutionPhaseDuration}
                onChange={(e) => handleChange('resolutionPhaseDuration', parseInt(e.target.value) || 10)}
                className="font-press-start text-center w-full text-sm"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="taskPhase" className="text-[10px] sm:text-xs font-press-start text-gray-300 break-words">
                TASK/DISCUSSION PHASE (seconds)
              </Label>
              <Input
                id="taskPhase"
                type="number"
                min={15}
                max={180}
                value={localSettings.taskPhaseDuration}
                onChange={(e) => handleChange('taskPhaseDuration', parseInt(e.target.value) || 30)}
                className="font-press-start text-center w-full text-sm"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="votingPhase" className="text-[10px] sm:text-xs font-press-start text-gray-300 break-words">
                VOTING PHASE (seconds)
              </Label>
              <Input
                id="votingPhase"
                type="number"
                min={5}
                max={60}
                value={localSettings.votingPhaseDuration}
                onChange={(e) => handleChange('votingPhaseDuration', parseInt(e.target.value) || 10)}
                className="font-press-start text-center w-full text-sm"
              />
            </div>
          </div>

          {/* Win Conditions */}
          <div className="space-y-2 sm:space-y-3 pt-2 border-t border-border">
            <div className="text-xs sm:text-sm font-press-start text-gray-300 border-b border-border pb-2">
              WIN CONDITIONS
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="maxTaskCount" className="text-[10px] sm:text-xs font-press-start text-gray-300 break-words">
                TASKS FOR NON-ASUR WIN
              </Label>
              <Input
                id="maxTaskCount"
                type="number"
                min={2}
                max={20}
                value={localSettings.maxTaskCount}
                onChange={(e) => handleChange('maxTaskCount', parseInt(e.target.value) || 4)}
                className="font-press-start text-center w-full text-sm"
              />
              <p className="text-[10px] text-gray-500">
                Total tasks needed for non-ASUR players to win
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            size="pixel"
            className="w-full sm:w-auto text-xs"
          >
            🔄 RESET
          </Button>
          <Button
            onClick={handleSave}
            variant="pixel"
            size="pixel"
            className="w-full sm:w-auto text-xs"
          >
            💾 SAVE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
