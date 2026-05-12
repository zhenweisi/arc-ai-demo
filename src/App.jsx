
import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  useAccount,
  useSendTransaction,
} from 'wagmi'
import { parseEther } from 'viem'

export default function App() {

  const { address } = useAccount()
  const wallet = address ? address.toLowerCase() : ''

  const { sendTransactionAsync } = useSendTransaction()

  const [credits, setCredits] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [buying, setBuying] = useState(false)
  const [messages, setMessages] = useState([])
  const [remainingMessages, setRemainingMessages] = useState(5)

  const hasJoinedDemo = credits > 0 || remainingMessages < 5

  const loadCredits = async () => {
    if (!wallet) return
    try {
      const res = await fetch(`http://localhost:3001/credits/${wallet}`)
      const data = await res.json()
      setCredits(data.credits || 0)
      setRemainingMessages(data.remainingMessages || 0)
    } catch {
      console.log('Failed to fetch credits')
    }
  }

  useEffect(() => { loadCredits() }, [wallet])

  useEffect(() => {
    if (!wallet) return
    const timer = setInterval(loadCredits, 5000)
    return () => clearInterval(timer)
  }, [wallet])

  useEffect(() => {
    if (!wallet) return
    fetch(`http://localhost:3001/messages/${wallet}`)
      .then(res => res.json())
      .then(data => data.success && setMessages(data.messages || []))
      .catch(() => {})
  }, [wallet])

  const buyCredits = async () => {
    if (!wallet) return alert('Please connect your wallet first')
    if (hasJoinedDemo) return alert('Each wallet can only join once')

    setBuying(true)
    try {
      await sendTransactionAsync({
        to: '0x0fb680e7de03f32bfe31e774ec10adf5bd5a5f6b',
        value: parseEther('2'),
      })
      alert('Transaction sent successfully, waiting for block confirmation')
      setTimeout(loadCredits, 8000)
    } catch (err) {
      alert('Deposit failed')
    } finally {
      setBuying(false)
    }
  }

  const sendMessage = async () => {
    if (!wallet) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Please connect your wallet first' }])
      return
    }

    if (!message.trim()) return

    const userInput = message.trim()
    const userMessage = { role: 'user', content: userInput }

    const regex = /send\s+([\d.]+)\s*usdc\s+to\s+(0x[a-fA-F0-9]{40})/i
    const match = userInput.match(regex)

    if (match) {
      const amount = match[1]
      const targetAddress = match[2]

      setMessages(prev => [...prev, userMessage])
      setMessage('')

      try {
        const txHash = await sendTransactionAsync({
          to: targetAddress,
          value: parseEther(amount),
        })

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Transfer initiated ${amount} USDC\n\nHash: ${txHash}`
        }])

        setTimeout(loadCredits, 8000)
        return
      } catch (err) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Transfer failed: ${err?.message || 'User cancelled or network error'}`
        }])
      }
      return
    }

    // Normal Chat
    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, message: userInput }),
      })
      const data = await res.json()
      setLoading(false)

      if (!data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'AI service error' }])
        return
      }

      setCredits(data.remainingCredits)
      setRemainingMessages(data.remainingMessages)
      setMessages(prev => [...prev, { role: 'assistant', content: String(data.reply) }])
    } catch {
      setLoading(false)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Backend connection failed' }])
    }
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-950">
        <div className="flex items-center gap-5">
          {/* Arc Logo */}
          <img 
            src="/arc-logo.png" 
            alt="Arc Logo" 
            className="w-12 h-12 object-contain"
          />
          
          <div className="font-bold text-3xl tracking-tighter">
            Arc Echo AI


          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-zinc-400">Credits: <span className="text-white">{credits}</span></div>
          <div className="text-sm text-zinc-400">Remaining: <span className="text-white">{remainingMessages}/5</span></div>

          <button
            onClick={buyCredits}
            disabled={buying || hasJoinedDemo}
            className="bg-green-600 hover:bg-green-500 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition"
          >
            {hasJoinedDemo ? 'Joined' : buying ? 'Processing...' : 'Deposit 2 USDC'}
          </button>

          <ConnectButton />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block px-5 py-3.5 rounded-3xl max-w-[70%] ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-zinc-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && <div className="text-zinc-500 text-sm">AI is thinking...</div>}
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 p-4">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="you can ask any thing ... (support: send 1.5 usdc to 0x...)"
            className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={loading || remainingMessages <= 0}
            className="bg-white text-black px-6 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}