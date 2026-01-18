'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import styled from 'styled-components'
import ChatMessage from './ChatMessage'
import InputArea from './InputArea'
import MatrixBackground from './MatrixBackground'
import DemoToggle from './DemoToggle'
import DemoBanner from './DemoBanner'
import { isDemoMode } from '@/lib/demoMode'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const TerminalContainer = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const TerminalHeader = styled.div`
  padding: 10px 20px;
  border-bottom: 1px solid #00ff00;
  background: rgba(0, 0, 0, 0.9);
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const TerminalTitle = styled.h1`
  color: #00ff00;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 10px #00ff00;
`

const TerminalStatus = styled.div`
  color: #00cc00;
  font-size: 12px;
`

const ChatContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
`

const WelcomeMessage = styled.div`
  color: #00ff00;
  font-size: 16px;
  text-align: center;
  margin: 20px 0;
  text-shadow: 0 0 5px #00ff00;
  
  h2 {
    margin-bottom: 10px;
    font-size: 24px;
  }
  
  p {
    margin: 5px 0;
    opacity: 0.8;
  }
`

const LoadingIndicator = styled.div`
  color: #00ff00;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &::after {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid #00ff00;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const ConfigScreen = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const ConfigContainer = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ff00;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
`

const ConfigTitle = styled.h1`
  color: #00ff00;
  font-size: 28px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px #00ff00;
`

const ConfigDescription = styled.p`
  color: #00cc00;
  font-size: 16px;
  margin-bottom: 30px;
  line-height: 1.6;
`

const ApiKeyInput = styled.input`
  width: 100%;
  padding: 15px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #00ff00;
  border-radius: 8px;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin-bottom: 20px;
  outline: none;
  
  &:focus {
    border-color: #00cc00;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  }
  
  &::placeholder {
    color: #00aa00;
    opacity: 0.7;
  }
`

const BeginButton = styled.button`
  background: rgba(0, 255, 0, 0.1);
  border: 2px solid #00ff00;
  color: #00ff00;
  padding: 15px 30px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ApiKeyInfo = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 255, 0, 0.05);
  border: 1px solid #00aa00;
  border-radius: 6px;
  font-size: 12px;
  color: #00aa00;
  line-height: 1.4;
`

export default function Terminal() {
  const sp = useSearchParams()
  const isDemo = sp.get('demo') === '1'
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState<string>('')
  const [isConfigured, setIsConfigured] = useState<boolean>(false)
  const [apiKeyInput, setApiKeyInput] = useState<string>('')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [demoMode, setDemoMode] = useState<boolean>(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Health-check: demo => siempre conectado; si no, ping periódico
  useEffect(() => {
    if (isDemo) {
      setConnected(true)
      return
    }
    let timer: any
    const ping = async () => {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' })
        setConnected(r.ok)
      } catch {
        setConnected(false)
      }
    }
    ping()
    timer = setInterval(ping, 15000)
    return () => clearInterval(timer)
  }, [isDemo])

  // Check demo mode on mount and when URL changes
  useEffect(() => {
    const checkDemoMode = () => {
      setDemoMode(isDemoMode())
    }
    
    checkDemoMode()
    window.addEventListener('popstate', checkDemoMode)
    
    return () => {
      window.removeEventListener('popstate', checkDemoMode)
    }
  }, [])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      let response: Response
      let assistantMessage: Message

      if (demoMode) {
        // Modo Demo: usar API route local
        const messages = [
          { role: 'system', content: "Eres un asistente de IA útil y amigable. Responde de manera clara y concisa." },
          { role: 'user', content: content.trim() }
        ]

        response = await fetch('/api/demo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            model: 'gpt-4o-mini'
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Demo API error: ${response.status}`)
        }

        const data = await response.json()
        const responseContent = data.choices?.[0]?.message?.content || 'No se recibió respuesta'

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: responseContent,
          timestamp: new Date(),
        }

        setMessages(prev => [...prev, assistantMessage])

      } else {
        // Modo Normal: usar backend FastAPI
        const requestBody = {
          developer_message: "Eres un asistente de IA útil y amigable. Responde de manera clara y concisa.",
          user_message: content.trim(),
          model: "gpt-4.1-mini",
          api_key: apiKey
        }

        response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: '',
          timestamp: new Date(),
        }

        setMessages(prev => [...prev, assistantMessage])

        const decoder = new TextDecoder()
        let accumulatedContent = ''

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedContent += chunk

          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          )
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusText = () => {
    return connected ? '● CONECTADO' : '○ DESCONECTADO'
  }

  const getStatusColor = () => {
    return connected ? '#00ff00' : '#ff0000'
  }

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim())
      setIsConfigured(true)
    }
  }

  // En modo demo, no se requiere API key
  useEffect(() => {
    if (demoMode) {
      setIsConfigured(true)
    }
  }, [demoMode])

  const handleApiKeyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApiKeySubmit()
    }
  }

  return (
    <TerminalContainer>
      <MatrixBackground />
      
      {!isConfigured ? (
        <ConfigScreen>
          <ConfigContainer>
            <ConfigTitle>MATRIX TERMINAL v1.0</ConfigTitle>
            <ConfigDescription>
              Bienvenido al Matrix Terminal. Para comenzar, necesitamos tu clave de API de OpenAI.
              <br />
              Tu clave se almacena localmente y nunca se comparte.
            </ConfigDescription>
            
            <ApiKeyInput
              type="password"
              placeholder="Ingresa tu OpenAI API Key (sk-proj-...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={handleApiKeyKeyDown}
              autoFocus
            />
            
            <BeginButton 
              onClick={handleApiKeySubmit}
              disabled={!apiKeyInput.trim()}
            >
              COMENZAR
            </BeginButton>
            
            <ApiKeyInfo>
              <strong>¿No tienes una API key?</strong><br />
              Obtén tu clave gratuita en <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{color: '#00ffff'}}>platform.openai.com</a>
              <br /><br />
              <strong>¿Quieres probar sin API key?</strong><br />
              Haz clic en "Use Demo" en la esquina superior derecha.
            </ApiKeyInfo>
          </ConfigContainer>
        </ConfigScreen>
      ) : (
        <>
          <TerminalHeader>
            <TerminalTitle>MATRIX TERMINAL v1.0</TerminalTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <DemoToggle />
              <TerminalStatus style={{ color: getStatusColor() }}>
                {getStatusText()}
              </TerminalStatus>
            </div>
          </TerminalHeader>

          <ChatContainer ref={chatContainerRef}>
            {demoMode && <DemoBanner />}
            
            {messages.length === 0 && (
              <WelcomeMessage>
                <h2>Bienvenido al Matrix Terminal</h2>
                <p>Conectado al sistema de IA...</p>
                <p>Escribe tu mensaje y presiona ENTER para comenzar.</p>
                <p>Presiona CTRL+C para salir.</p>
              </WelcomeMessage>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <LoadingIndicator>
                Procesando respuesta...
              </LoadingIndicator>
            )}
          </ChatContainer>

          <InputArea onSendMessage={sendMessage} disabled={isLoading} />
        </>
      )}
    </TerminalContainer>
  )
}
