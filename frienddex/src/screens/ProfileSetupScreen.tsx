import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { extractFaceDescriptor } from '../lib/faceDetection'
import { PokeballSpinner } from '../components/PokeballSpinner'

const PERSONALITY_QUESTIONS = [
  {
    question: 'What is your greatest strength in a group?',
    options: ['Leading the charge', 'Making everyone laugh', 'Keeping the peace', 'Coming up with ideas', 'Getting stuff done'],
  },
  {
    question: 'Pick a weekend activity:',
    options: ['Hiking / outdoors', 'Gaming / movies', 'Cooking / creating', 'Socializing / parties', 'Reading / learning'],
  },
  {
    question: 'How do you handle conflict?',
    options: ['Head on — talk it out', 'Avoid it at all costs', 'Find a compromise', 'Use humor to defuse', 'Analyze it logically'],
  },
  {
    question: 'Your friends describe you as:',
    options: ['The reliable one', 'The wild card', 'The mom/dad of the group', 'The brainiac', 'The hype machine'],
  },
  {
    question: 'Pick an element that speaks to you:',
    options: ['Fire — passionate and bold', 'Water — calm and adaptable', 'Earth — grounded and strong', 'Air — free and curious', 'Lightning — fast and energetic'],
  },
]

type Step = 'username' | 'selfie' | 'questions' | 'confirm'

export function ProfileSetupScreen() {
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null)
  const [selfieUrl, setSelfieUrl] = useState('')
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''))
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setError('Could not access camera. Please allow camera permissions.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const takeSelfie = useCallback(async () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight)
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const sx = (videoRef.current.videoWidth - size) / 2
    const sy = (videoRef.current.videoHeight - size) / 2
    ctx.drawImage(videoRef.current, sx, sy, size, size, 0, 0, 512, 512)
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85)
    )
    setSelfieBlob(blob)
    setSelfieUrl(URL.createObjectURL(blob))
    stopCamera()
  }, [stopCamera])

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters')
      return
    }
    setError('')
    setStep('selfie')
    setTimeout(startCamera, 100)
  }

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
    if (currentQuestion < 4) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setStep('confirm')
    }
  }

  const handleConfirm = async () => {
    if (!user || !selfieBlob) return
    setLoading(true)
    setError('')

    try {
      const filePath = `avatars/${user.id}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selfieBlob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username.trim().toLowerCase(),
          avatar_url: publicUrl,
          personality_answers: answers,
          profile_complete: false,
        })
      if (profileError) throw profileError

      let faceDescriptor: number[] = []
      try {
        faceDescriptor = await extractFaceDescriptor(selfieUrl)
      } catch {
        console.warn('Face descriptor extraction failed — continuing without it')
      }

      if (faceDescriptor.length > 0) {
        await supabase.from('user_faces').upsert(
          { user_id: user.id, face_descriptor: faceDescriptor },
          { onConflict: 'user_id' }
        )
      }

      const { data: genData, error: genError } = await supabase.functions.invoke(
        'generate-friend-stats',
        {
          body: {
            userId: user.id,
            username: username.trim(),
            personalityAnswers: answers,
            isSelf: true,
          },
        }
      )
      if (genError) throw genError

      const entry = genData as Record<string, unknown>
      await supabase.from('pokedex_entries').upsert(
        {
          user_id: user.id,
          target_user_id: user.id,
          primary_type: entry.primaryType as string,
          secondary_type: (entry.secondaryType as string) || null,
          cp: entry.cp as number,
          stats: entry.stats as Record<string, number>,
          moves: entry.moves as unknown[],
          description: entry.description as string,
          flavor_text: entry.flavorText as string,
        },
        { onConflict: 'user_id,target_user_id' }
      )

      await supabase
        .from('profiles')
        .update({ profile_complete: true })
        .eq('id', user.id)

      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  }

  return (
    <div className="fixed inset-0 bg-navy flex flex-col items-center justify-center px-6 overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 'username' && (
          <motion.div key="username" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm">
            <h2 className="text-2xl font-black text-center mb-2">Choose your name</h2>
            <p className="text-gray-400 text-sm text-center mb-8">This is how trainers will see you</p>
            <form onSubmit={handleUsernameSubmit}>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-primary text-center text-lg font-semibold"
              />
              {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
              <motion.button type="submit" whileTap={{ scale: 0.97 }} className="w-full mt-6 py-3 rounded-xl bg-primary text-white font-bold text-lg">
                Next
              </motion.button>
            </form>
          </motion.div>
        )}

        {step === 'selfie' && (
          <motion.div key="selfie" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm flex flex-col items-center">
            <h2 className="text-2xl font-black text-center mb-2">Take a selfie</h2>
            <p className="text-gray-400 text-sm text-center mb-6">This will be your trainer sprite</p>
            <div className="relative w-64 h-64 rounded-full overflow-hidden bg-black/30 mb-6 border-4 border-white/10">
              {!selfieUrl ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
              )}
            </div>
            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
            {!selfieUrl ? (
              <motion.button whileTap={{ scale: 0.97 }} onClick={takeSelfie} className="px-8 py-3 rounded-xl bg-pokemon-yellow text-navy font-bold text-lg">
                Capture
              </motion.button>
            ) : (
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelfieUrl(''); setSelfieBlob(null); startCamera() }}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold"
                >
                  Retake
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setStep('questions'); setCurrentQuestion(0) }}
                  className="px-6 py-3 rounded-xl bg-primary text-white font-bold"
                >
                  Use This
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {step === 'questions' && (
          <motion.div key={`q-${currentQuestion}`} variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm">
            <div className="flex gap-1 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= currentQuestion ? 'bg-pokemon-yellow' : 'bg-white/10'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-2 text-center">Question {currentQuestion + 1} of 5</p>
            <h2 className="text-xl font-bold text-center mb-6">{PERSONALITY_QUESTIONS[currentQuestion].question}</h2>
            <div className="space-y-3">
              {PERSONALITY_QUESTIONS[currentQuestion].options.map(option => (
                <motion.button
                  key={option}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAnswer(option)}
                  className={`w-full px-4 py-3 rounded-xl text-left font-semibold transition-colors ${
                    answers[currentQuestion] === option ? 'bg-primary text-white' : 'bg-white/10 text-gray-200 hover:bg-white/15'
                  }`}
                >
                  {option}
                </motion.button>
              ))}
            </div>
            {currentQuestion > 0 && (
              <button onClick={() => setCurrentQuestion(currentQuestion - 1)} className="w-full mt-4 text-sm text-gray-400 hover:text-white transition-colors text-center">
                Back
              </button>
            )}
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div key="confirm" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm flex flex-col items-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <PokeballSpinner size={64} />
                <p className="text-gray-400 text-sm">Generating your Pokédex entry...</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-center mb-6">Ready to go!</h2>
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pokemon-yellow mb-4">
                  {selfieUrl && <img src={selfieUrl} alt="You" className="w-full h-full object-cover" />}
                </div>
                <p className="text-xl font-bold mb-6">{username}</p>
                <div className="w-full space-y-2 mb-6">
                  {answers.map((answer, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-pokemon-yellow font-bold shrink-0">{i + 1}.</span>
                      <span className="text-gray-300">{answer}</span>
                    </div>
                  ))}
                </div>
                {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm} className="w-full py-3 rounded-xl bg-pokemon-yellow text-navy font-black text-lg">
                  Confirm & Generate Entry
                </motion.button>
                <button onClick={() => setStep('questions')} className="mt-3 text-sm text-gray-400 hover:text-white transition-colors">
                  Change answers
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
