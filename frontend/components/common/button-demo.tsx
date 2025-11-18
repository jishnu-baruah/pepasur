"use client"

import React from 'react'

export default function ButtonDemo() {
  return (
    <div className="min-h-screen p-8 gaming-bg">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-press-start text-white mb-4 pixel-text-3d-glow">
            ASUR GAME BUTTONS
          </h1>
          <p className="text-lg font-press-start text-[#4A8C4A] pixel-text-3d-green">
            Retro Arcade 3D Pixel Buttons
          </p>
        </div>

        {/* Base Button */}
        <div className="space-y-4">
          <h2 className="text-2xl font-press-start text-white pixel-text-3d-glow">Base Button</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-pixel">Connect Wallet</button>
            <button className="btn-pixel">Join Game</button>
            <button className="btn-pixel">Start Game</button>
          </div>
        </div>

        {/* Color Variants */}
        <div className="space-y-4">
          <h2 className="text-2xl font-press-start text-white pixel-text-3d-glow">Color Variants</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-pixel">Default Green</button>
            <button className="btn-pixel btn-pixel--red">Danger Action</button>
            <button className="btn-pixel btn-pixel--blue">Info Button</button>
            <button className="btn-pixel btn-pixel--purple">Special Action</button>
            <button className="btn-pixel btn-pixel--yellow">Warning Button</button>
          </div>
        </div>

        {/* Size Variants */}
        <div className="space-y-4">
          <h2 className="text-2xl font-press-start text-white pixel-text-3d-glow">Size Variants</h2>
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn-pixel btn-pixel--small">Small</button>
            <button className="btn-pixel">Normal</button>
            <button className="btn-pixel btn-pixel--large">Large</button>
          </div>
        </div>

        {/* Game Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-press-start text-white pixel-text-3d-glow">Game Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="btn-pixel btn-pixel--large w-full">Connect Wallet</button>
            <button className="btn-pixel btn-pixel--blue btn-pixel--large w-full">Join Game</button>
            <button className="btn-pixel btn-pixel--red btn-pixel--large w-full">Create Lobby</button>
            <button className="btn-pixel btn-pixel--purple btn-pixel--large w-full">Start Game</button>
            <button className="btn-pixel btn-pixel--yellow btn-pixel--large w-full">Add Player</button>
            <button className="btn-pixel btn-pixel--red btn-pixel--large w-full">Submit Vote</button>
          </div>
        </div>

        {/* Interactive States */}
        <div className="space-y-4">
          <h2 className="text-2xl font-press-start text-white pixel-text-3d-glow">Interactive States</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-pixel">Hover Me</button>
            <button className="btn-pixel" disabled>Disabled</button>
            <button className="btn-pixel btn-pixel--red">Click Me</button>
            <button className="btn-pixel btn-pixel--blue">Focus Me</button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-[#111111]/90 p-6 rounded-lg border border-[#2a2a2a]">
          <h3 className="text-xl font-press-start pixel-text-3d-white mb-4">Usage Instructions</h3>
          <div className="space-y-2 text-sm font-press-start text-[#4A8C4A] pixel-text-3d-green">
            <p>• Base class: <code className="text-white">btn-pixel</code></p>
            <p>• Color variants: <code className="text-white">btn-pixel--red</code>, <code className="text-white">btn-pixel--blue</code>, etc.</p>
            <p>• Size variants: <code className="text-white">btn-pixel--small</code>, <code className="text-white">btn-pixel--large</code></p>
            <p>• Combine classes: <code className="text-white">btn-pixel btn-pixel--red btn-pixel--large</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
