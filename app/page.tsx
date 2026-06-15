'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function ResearchPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "This is a placeholder. Real research agents coming in Day 2."
      }])
      setLoading(false)
    }, 700)
  }

  return (
    <div className="max-w-4xl mx-auto p-6" suppressHydrationWarning>
      <h1 className="text-3xl font-bold mb-6">Nexus</h1>

      <Card className="p-6 mb-4 h-[500px] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            Start a research session
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-muted-foreground">Thinking...</p>}
      </Card>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a research question..."
        />
        <Button onClick={handleSend} disabled={loading}>Send</Button>
      </div>
    </div>
  )
}