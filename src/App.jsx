import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { DISCS } from './data/discs.js'

const MAX_GUESSES = 6
const STATS = ['brand', 'name', 'type', 'speed', 'glide', 'turn', 'fade']

const formatStat = (value) => (Number.isFinite(value) ? `${value}` : value)
const getNumericDirection = (guessValue, answerValue) => (guessValue < answerValue ? 'higher' : 'lower')

const hashString = (value) => {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return Math.abs(hash) >>> 0
}

const createSeededRandom = (seed) => {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

// Get seeded random disc for the day (same for everyone)
const getDailyDisc = () => {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0] // YYYY-MM-DD
  const seed = parseInt(dateStr.replace(/-/g, ''), 10)
  const index = seed % DISCS.length
  return DISCS[index]
}

const getDailyKey = () => new Date().toISOString().split('T')[0]

const pickRandomDisc = () => DISCS[Math.floor(Math.random() * DISCS.length)]

const getFeedback = (guess, answer) => {
  const compareExact = (guessValue, answerValue) => (guessValue === answerValue ? 'exact' : 'wrong')

  return {
    brand: compareExact(guess.brand, answer.brand),
    name: compareExact(guess.name, answer.name),
    type: compareExact(guess.type, answer.type),
    speed: compareExact(guess.speed, answer.speed),
    glide: compareExact(guess.glide, answer.glide),
    turn: compareExact(guess.turn, answer.turn),
    fade: compareExact(guess.fade, answer.fade),
  }
}

const PROFILE_LABELS = {
  flat: 'Flat',
  moderate: 'Moderate',
  domey: 'Domey',
}

const PROFILE_PATHS = {
  flat: 'M6 32 C30 24 90 24 114 32',
  moderate: 'M6 34 C30 14 90 14 114 34',
  domey: 'M6 36 C30 6 90 6 114 36',
}

const renderProfile = (profile) => {
  if (!profile) return null
  const profilePath = PROFILE_PATHS[profile] ?? PROFILE_PATHS.moderate

  return (
    <div className="profile">
      <svg className="profile-svg" viewBox="0 0 120 48" aria-hidden="true">
        <path d={profilePath} />
        <path d="M6 36 H114" />
      </svg>
      <span>{PROFILE_LABELS[profile] ?? profile}</span>
    </div>
  )
}

const getSpeedHint = (answer) => {
  if (answer.speed <= 4) return 'Speed 4 or lower'
  if (answer.speed <= 7) return 'Speed 5-7'
  if (answer.speed <= 9) return 'Speed 8-9'
  if (answer.speed <= 12) return 'Speed 10-12'
  return 'Speed 13+'
}

const getGlideHint = (answer) => {
  if (answer.glide <= 3) return 'Glide 3 or lower'
  if (answer.glide <= 5) return 'Glide 4-5'
  if (answer.glide <= 6) return 'Glide 6'
  return 'Glide 7+'
}

const STABILITY_LABELS = {
  understable: 'Understable',
  stable: 'Stable',
  overstable: 'Overstable',
}

const FLIGHT_PATHS = {
  understable: 'M6 32 C30 10 90 10 114 20',
  stable: 'M6 30 C30 24 90 24 114 30',
  overstable: 'M6 20 C30 10 90 10 114 32',
}

const getStability = (answer) => {
  const score = answer.turn + answer.fade
  if (score <= -1.5) return 'understable'
  if (score >= 2.5) return 'overstable'
  return 'stable'
}

const renderFlightPath = (answer) => {
  const stability = getStability(answer)
  const path = FLIGHT_PATHS[stability] ?? FLIGHT_PATHS.stable

  return (
    <div className="flight-path">
      <svg className="flight-path-svg" viewBox="0 0 120 48" aria-hidden="true">
        <path d={path} />
        <circle cx="114" cy={stability === 'overstable' ? 32 : stability === 'understable' ? 20 : 30} r="3" />
      </svg>
      <span>{STABILITY_LABELS[stability]}</span>
    </div>
  )
}

// Calculate seconds until next daily reset (12 AM EST)
const getSecondsUntilNextDaily = () => {
  const now = new Date()
  // Convert to EST (UTC-5, or UTC-4 during daylight savings)
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))

  let nextReset = new Date(estTime)
  nextReset.setHours(0, 0, 0, 0) // Set to midnight

  // If it's already past midnight, next reset is tomorrow at midnight
  if (nextReset <= estTime) {
    nextReset.setDate(nextReset.getDate() + 1)
  }

  const diff = nextReset.getTime() - estTime.getTime()
  return Math.max(0, Math.floor(diff / 1000))
}

// Format countdown as HH:MM:SS
const formatCountdown = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Parse hardcore mode guess (format: "Brand Disc Name")
const parseHardcoreGuess = (text) => {
  const trimmed = text.trim()
  if (!trimmed) return null

  // Try to find a matching disc
  const matchingDiscs = DISCS.filter((disc) => {
    const fullName = `${disc.brand} ${disc.name}`.toLowerCase()
    return fullName === trimmed.toLowerCase()
  })

  return matchingDiscs.length > 0 ? matchingDiscs[0] : null
}

const POWERUP_DEFS = [
  {
    id: 'rim-scan',
    name: 'Rim Scan',
    description: 'Reveal the disc side profile.',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M6 28 C12 14 28 14 34 28" />
        <path d="M6 28 H34" />
      </svg>
    ),
    render: (answer) => renderProfile(answer.profile),
  },
  {
    id: 'flight-trace',
    name: 'Flight Trace',
    description: 'Reveal a stability flight arc.',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M6 26 C14 10 26 10 34 22" />
        <circle cx="34" cy="22" r="3" />
      </svg>
    ),
    render: (answer) => renderFlightPath(answer),
  },
  {
    id: 'speedometer',
    name: 'Speedometer',
    description: 'Reveal a speed range bucket.',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M8 28 L20 12 L20 22 L32 12 L24 28" />
      </svg>
    ),
    render: (answer) => getSpeedHint(answer),
  },
  {
    id: 'glide-gauge',
    name: 'Glide Gauge',
    description: 'Reveal a glide range bucket.',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M6 24 C12 12 28 12 34 24" />
        <path d="M10 28 C16 20 24 20 30 28" />
      </svg>
    ),
    render: (answer) => getGlideHint(answer),
  },
  {
    id: 'mold-id',
    name: 'Mold ID',
    description: 'Reveal the disc category.',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <rect x="8" y="8" width="24" height="6" rx="3" />
        <rect x="8" y="18" width="24" height="6" rx="3" />
        <rect x="8" y="28" width="24" height="6" rx="3" />
      </svg>
    ),
    render: (answer) => answer.type,
  },
  {
    id: 'velocity-radar',
    name: 'Velocity Radar',
    description: 'Show higher/lower for speed.',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M8 26 C14 10 26 10 32 26" />
        <path d="M20 26 L28 18" />
      </svg>
    ),
    revealStats: ['speed'],
    render: () => 'Speed direction enabled',
  },
  {
    id: 'lift-meter',
    name: 'Lift Meter',
    description: 'Show higher/lower for glide.',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M8 24 C14 14 26 14 32 24" />
        <path d="M12 30 C18 22 22 22 28 30" />
      </svg>
    ),
    revealStats: ['glide'],
    render: () => 'Glide direction enabled',
  },
  {
    id: 'torque-compass',
    name: 'Torque Compass',
    description: 'Show higher/lower for turn.',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="10" />
        <path d="M20 10 L24 20 L20 30" />
      </svg>
    ),
    revealStats: ['turn'],
    render: () => 'Turn direction enabled',
  },
  {
    id: 'fade-finder',
    name: 'Fade Finder',
    description: 'Show higher/lower for fade.',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M10 12 H30" />
        <path d="M10 20 H26" />
        <path d="M10 28 H22" />
      </svg>
    ),
    revealStats: ['fade'],
    render: () => 'Fade direction enabled',
  },
  {
    id: 'speed-scanner',
    name: 'Speed Scanner',
    description: 'See speed of all options.',
    rarity: 'rare',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="12" r="6" />
        <circle cx="20" cy="24" r="6" />
        <circle cx="20" cy="36" r="6" />
        <line x1="26" y1="12" x2="34" y2="12" stroke="white" strokeWidth="2" />
        <line x1="26" y1="24" x2="34" y2="24" stroke="white" strokeWidth="2" />
        <line x1="26" y1="36" x2="34" y2="36" stroke="white" strokeWidth="2" />
      </svg>
    ),
    reveal: 'speed',
    render: () => 'Speed values revealed',
  },
  {
    id: 'glide-scanner',
    name: 'Glide Scanner',
    description: 'See glide of all options.',
    rarity: 'rare',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="12" r="6" />
        <circle cx="20" cy="24" r="6" />
        <circle cx="20" cy="36" r="6" />
        <line x1="26" y1="12" x2="34" y2="12" stroke="white" strokeWidth="2" />
        <line x1="26" y1="24" x2="34" y2="24" stroke="white" strokeWidth="2" />
        <line x1="26" y1="36" x2="34" y2="36" stroke="white" strokeWidth="2" />
      </svg>
    ),
    reveal: 'glide',
    render: () => 'Glide values revealed',
  },
  {
    id: 'turn-scanner',
    name: 'Turn Scanner',
    description: 'See turn of all options.',
    rarity: 'rare',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="12" r="6" />
        <circle cx="20" cy="24" r="6" />
        <circle cx="20" cy="36" r="6" />
        <line x1="26" y1="12" x2="34" y2="12" stroke="white" strokeWidth="2" />
        <line x1="26" y1="24" x2="34" y2="24" stroke="white" strokeWidth="2" />
        <line x1="26" y1="36" x2="34" y2="36" stroke="white" strokeWidth="2" />
      </svg>
    ),
    reveal: 'turn',
    render: () => 'Turn values revealed',
  },
  {
    id: 'fade-scanner',
    name: 'Fade Scanner',
    description: 'See fade of all options.',
    rarity: 'rare',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="12" r="6" />
        <circle cx="20" cy="24" r="6" />
        <circle cx="20" cy="36" r="6" />
        <line x1="26" y1="12" x2="34" y2="12" stroke="white" strokeWidth="2" />
        <line x1="26" y1="24" x2="34" y2="24" stroke="white" strokeWidth="2" />
        <line x1="26" y1="36" x2="34" y2="36" stroke="white" strokeWidth="2" />
      </svg>
    ),
    reveal: 'fade',
    render: () => 'Fade values revealed',
  },
  {
    id: 'full-scan',
    name: 'Full Scan',
    description: 'Next guess reveals all numbers.',
    rarity: 'rare',
    icon: (
      <svg className="hint-icon" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="12" />
        <circle cx="20" cy="20" r="8" />
        <circle cx="20" cy="20" r="4" />
        <circle cx="20" cy="20" r="2" />
      </svg>
    ),
    nextGuessAllNumbers: true,
    render: () => 'All numbers revealed on next guess',
  },
]

const pickPowerupChoices = (existing = [], randomSource = Math.random) => {
  const pool = POWERUP_DEFS.filter((powerup) => !existing.includes(powerup.id))

  // Weight rare powerups - they appear 50% less often
  const weighted = pool.flatMap((powerup) => {
    return powerup.rarity === 'rare' ? [powerup] : [powerup, powerup]
  })

  const shuffled = [...weighted].sort(() => randomSource() - 0.5)
  const selected = shuffled.slice(0, 2)

  // Remove duplicates by id
  const uniqueIds = Array.from(new Set(selected.map((powerup) => powerup.id)))
  return uniqueIds.slice(0, 2)
}

const FEEDBACK_EMOJI = {
  exact: '🟩',
  wrong: '⬛',
  higher: '🟨',
  lower: '🟨',
}

const buildShareText = (guesses, isWin, answer, revealStats) => {
  if (guesses.length === 0) return ''
  const score = isWin ? guesses.length : 'X'
  const rows = guesses.map((guess) =>
    STATS.map((stat) => FEEDBACK_EMOJI[getCellStatus(guess, stat, answer, revealStats, false, false)]).join(''),
  )

  return `Discdle ${score}/${MAX_GUESSES}\n${rows.join('\n')}`
}

const getCellStatus = (guess, stat, answer, revealStats, isCurrentGuess = false, hasNextGuessAllNumbers = false) => {
  if (guess.feedback[stat] === 'exact') return 'exact'

  // If nextGuessAllNumbers is active and this is the current guess, show all numeric values
  if (isCurrentGuess && hasNextGuessAllNumbers && ['speed', 'glide', 'turn', 'fade'].includes(stat)) {
    return getNumericDirection(guess[stat], answer[stat])
  }

  // For direction powerups (revealStats), show higher/lower
  if (revealStats.has(stat)) {
    return getNumericDirection(guess[stat], answer[stat])
  }

  return 'wrong'
}

function App() {
  const [gameMode, setGameMode] = useState('daily') // 'casual', 'daily', or 'hardcore'
  const [hardcoreStarted, setHardcoreStarted] = useState(false) // Track if hardcore game was started
  const [answer, setAnswer] = useState(() => getDailyDisc())
  const [guesses, setGuesses] = useState([])
  const [brand, setBrand] = useState('')
  const [discId, setDiscId] = useState('')
  const [guessText, setGuessText] = useState('') // For hardcore mode text input
  const [powerupChoicesFirst, setPowerupChoicesFirst] = useState([])
  const [powerupChoicesSecond, setPowerupChoicesSecond] = useState([])
  const [chosenPowerupIds, setChosenPowerupIds] = useState([])
  const [resultDismissed, setResultDismissed] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [dailyPlayedToday, setDailyPlayedToday] = useState(() => {
    const stored = localStorage.getItem('discdle_daily_played')
    if (!stored) return false
    const lastPlayDate = JSON.parse(stored)
    const today = new Date().toISOString().split('T')[0]
    return lastPlayDate === today
  })
  const [hardcoreAttemptedToday, setHardcoreAttemptedToday] = useState(() => {
    const stored = localStorage.getItem('discdle_hardcore_attempted')
    if (!stored) return false
    const lastAttemptDate = JSON.parse(stored)
    const today = new Date().toISOString().split('T')[0]
    return lastAttemptDate === today
  })
  const [countdown, setCountdown] = useState(() => formatCountdown(getSecondsUntilNextDaily()))
  const [fullScanUsedGuessCount, setFullScanUsedGuessCount] = useState(-1)
  const [timeRemaining, setTimeRemaining] = useState(60) // 1 minute timer for hardcore
  const [timerActive, setTimerActive] = useState(false)
  const [hardcoreTimeUp, setHardcoreTimeUp] = useState(false)

  const brands = useMemo(() => {
    const list = Array.from(new Set(DISCS.map((disc) => disc.brand)))
    return list.sort((a, b) => a.localeCompare(b))
  }, [])

  const discsForBrand = useMemo(() => {
    if (!brand) return []
    return DISCS.filter((disc) => disc.brand === brand)
  }, [brand])

  const lastGuess = guesses[guesses.length - 1]
  const isWin = Boolean(lastGuess && lastGuess.id === answer.id)
  const isHardcoreTimeUp = gameMode === 'hardcore' && hardcoreTimeUp
  const isGameOver = isWin || guesses.length >= MAX_GUESSES || isHardcoreTimeUp
  const misses = isWin ? guesses.length - 1 : guesses.length
  const showResults = isGameOver && !resultDismissed
  const chosenPowerups = useMemo(
    () => chosenPowerupIds.map((id) => POWERUP_DEFS.find((powerup) => powerup.id === id)).filter(Boolean),
    [chosenPowerupIds],
  )
  const powerupRevealState = useMemo(() => {
    const stats = new Set()
    const numericStats = new Set()
    let hasNextGuessAllNumbers = false
    chosenPowerups.forEach((powerup) => {
      // Direction powerups (show higher/lower)
      powerup.revealStats?.forEach((stat) => stats.add(stat))
      // Numeric reveal powerups (show actual values)
      if (powerup.reveal) numericStats.add(powerup.reveal)
      // Full scan powerup (show all numbers on next guess)
      if (powerup.nextGuessAllNumbers) hasNextGuessAllNumbers = true
    })
    return { stats, numericStats, hasNextGuessAllNumbers }
  }, [chosenPowerups])
  const revealStats = powerupRevealState.stats
  const revealNumericStats = powerupRevealState.numericStats
  const nextGuessAllNumbers = powerupRevealState.hasNextGuessAllNumbers
  const shareText = useMemo(
    () => buildShareText(guesses, isWin, answer, revealStats),
    [answer, guesses, isWin, revealStats],
  )

  const firstPowerupOptions = useMemo(
    () => powerupChoicesFirst.map((id) => POWERUP_DEFS.find((powerup) => powerup.id === id)).filter(Boolean),
    [powerupChoicesFirst],
  )

  const secondPowerupOptions = useMemo(
    () => powerupChoicesSecond.map((id) => POWERUP_DEFS.find((powerup) => powerup.id === id)).filter(Boolean),
    [powerupChoicesSecond],
  )

  const submitGuess = useCallback(() => {
    let guess

    if (gameMode === 'hardcore') {
      // Parse hardcore mode text input
      guess = parseHardcoreGuess(guessText)
      if (!guess) return
    } else {
      // Normal mode using dropdown
      guess = DISCS.find((disc) => disc.id === discId)
      if (!guess) return
    }

    if (isGameOver) return
    // Prevent playing daily if already played today
    if (gameMode === 'daily' && dailyPlayedToday && guesses.length === 0) return

    // Start hardcore timer on first guess
    if (gameMode === 'hardcore' && guesses.length === 0) {
      setHardcoreStarted(true)
      setTimerActive(true)
    }

    // Track when Full Scan was just selected (it will apply to next guess)
    if (nextGuessAllNumbers && fullScanUsedGuessCount === -1) {
      setFullScanUsedGuessCount(guesses.length)
    }

    const isCorrect = guess.id === answer.id
    const nextMisses = isCorrect ? guesses.length : guesses.length + 1

    if (nextMisses >= 2 && powerupChoicesFirst.length === 0) {
      if (gameMode === 'daily') {
        const seed = hashString(`${getDailyKey()}-powerups-first`)
        setPowerupChoicesFirst(pickPowerupChoices([], createSeededRandom(seed)))
      } else {
        setPowerupChoicesFirst(pickPowerupChoices())
      }
    }

    if (nextMisses >= 4 && powerupChoicesSecond.length === 0) {
      if (gameMode === 'daily') {
        const chosenKey = [...chosenPowerupIds].sort().join(',')
        const seed = hashString(`${getDailyKey()}-powerups-second-${chosenKey}`)
        setPowerupChoicesSecond(pickPowerupChoices(chosenPowerupIds, createSeededRandom(seed)))
      } else {
        setPowerupChoicesSecond(pickPowerupChoices(chosenPowerupIds))
      }
    }

    setGuesses((current) => [...current, { ...guess, feedback: getFeedback(guess, answer) }])

    if (gameMode === 'daily' && isCorrect && !dailyPlayedToday) {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('discdle_daily_played', JSON.stringify(today))
      setDailyPlayedToday(true)
    }

    if (
      gameMode === 'hardcore' &&
      !hardcoreAttemptedToday &&
      (isCorrect || guesses.length + 1 >= MAX_GUESSES)
    ) {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('discdle_hardcore_attempted', JSON.stringify(today))
      setHardcoreAttemptedToday(true)
    }

    // Reset input for next guess
    if (gameMode === 'hardcore') {
      setGuessText('')
    }
  }, [answer, chosenPowerupIds, discId, gameMode, dailyPlayedToday, guesses.length, isGameOver, nextGuessAllNumbers, fullScanUsedGuessCount, powerupChoicesFirst, powerupChoicesSecond.length, guessText, hardcoreAttemptedToday])

  const onSubmitGuess = (event) => {
    event.preventDefault()
    submitGuess()
  }

  const onNewGame = useCallback(() => {
    const newAnswer = gameMode === 'daily' ? getDailyDisc() : pickRandomDisc()
    setAnswer(newAnswer)
    setGuesses([])
    setBrand('')
    setDiscId('')
    setGuessText('')
    setPowerupChoicesFirst([])
    setPowerupChoicesSecond([])
    setChosenPowerupIds([])
    setResultDismissed(false)
    setShareStatus('')
    setFullScanUsedGuessCount(-1)
    setTimeRemaining(60)
    setHardcoreStarted(false)
    setHardcoreTimeUp(false)
    setTimerActive(gameMode === 'hardcore') // Start timer for hardcore mode
  }, [gameMode])

  const onChangeMode = useCallback((mode) => {
    // Check if hardcore game was started with guesses and player is trying to leave
    if (gameMode === 'hardcore' && hardcoreStarted && !isGameOver && guesses.length > 0) {
      const confirmed = window.confirm(
        'Are you sure you want to leave Hardcore Mode? This will count as an attempt and you won\'t be able to try again today.'
      )
      if (!confirmed) return
      // Mark hardcore as attempted since guesses were made
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('discdle_hardcore_attempted', JSON.stringify(today))
      setHardcoreAttemptedToday(true)
    }

    // Check if switching between daily/casual with game in progress
    if (guesses.length > 0 && !isGameOver && (gameMode === 'daily' || gameMode === 'casual')) {
      const confirmed = window.confirm(
        `Are you sure you want to switch to ${mode} mode? Your current game progress will be lost.`
      )
      if (!confirmed) return
    }

    setGameMode(mode)
    const newAnswer = mode === 'daily' ? getDailyDisc() : pickRandomDisc()
    setAnswer(newAnswer)
    setGuesses([])
    setBrand('')
    setDiscId('')
    setGuessText('')
    setPowerupChoicesFirst([])
    setPowerupChoicesSecond([])
    setChosenPowerupIds([])
    setResultDismissed(false)
    setShareStatus('')
    setFullScanUsedGuessCount(-1)
    setTimeRemaining(60)
    setHardcoreStarted(false)
    setHardcoreTimeUp(false)
    setTimerActive(false)
  }, [gameMode, guesses.length, isGameOver, hardcoreStarted])

  const onShare = useCallback(async () => {
    if (!shareText) return
    setShareStatus('')

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Discdle', text: shareText })
        setShareStatus('Shared successfully.')
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText)
        setShareStatus('Copied to clipboard. Paste it anywhere to share.')
        return
      }

      setShareStatus('Sharing is not supported in this browser. Copy the text manually.')
    } catch {
      setShareStatus('Share failed. Try copying the text manually.')
    }
  }, [shareText])

  useEffect(() => {
    // Update theme based on game mode
    if (gameMode === 'hardcore') {
      document.documentElement.classList.add('hardcore-theme')
      document.documentElement.classList.remove('daily-theme')
    } else if (gameMode === 'daily') {
      document.documentElement.classList.add('daily-theme')
      document.documentElement.classList.remove('hardcore-theme')
    } else {
      document.documentElement.classList.remove('daily-theme')
      document.documentElement.classList.remove('hardcore-theme')
    }
  }, [gameMode])

  useEffect(() => {
    // Update countdown timer
    const interval = setInterval(() => {
      setCountdown(formatCountdown(getSecondsUntilNextDaily()))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Hardcore mode timer
    if (!timerActive || isGameOver) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimerActive(false)
          setHardcoreTimeUp(true)
          if (gameMode === 'hardcore' && guesses.length > 0 && !hardcoreAttemptedToday) {
            const today = new Date().toISOString().split('T')[0]
            localStorage.setItem('discdle_hardcore_attempted', JSON.stringify(today))
            setHardcoreAttemptedToday(true)
          }
          // Time's up - end game
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timerActive, isGameOver, gameMode, guesses.length, hardcoreAttemptedToday])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat) return
      if (event.key === 'Enter') {
        submitGuess()
      }
      if (event.key === 'Escape') {
        onNewGame()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onNewGame, submitGuess])

  return (
    <div className={`app ${gameMode === 'daily' ? 'daily-mode' : 'random-mode'}`}>
      <header className="header">
        <div className="title-row">
          <span className="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img" focusable="false">
              <circle cx="24" cy="12" r="8" />
              <path d="M12 30 C16 22 32 22 36 30" />
              <path d="M12 30 H36" />
              <path d="M20 30 V40" />
              <path d="M28 30 V40" />
              <path d="M18 40 H30" />
            </svg>
          </span>
          <div>
            <p className="eyebrow">Discdle{gameMode === 'daily' ? ' Daily' : gameMode === 'hardcore' ? ' Hardcore' : ''}</p>
            <h1>Guess the disc</h1>
          </div>
        </div>
        <div className="mode-toggle">
          <button
            type="button"
            className={`mode-btn ${gameMode === 'casual' ? 'active' : ''}`}
            onClick={() => onChangeMode('casual')}
          >
            🎲 Casual
          </button>
          <button
            type="button"
            className={`mode-btn ${gameMode === 'daily' ? 'active' : ''}`}
            onClick={() => onChangeMode('daily')}
          >
            📅 Daily
          </button>
          <button
            type="button"
            className={`mode-btn ${gameMode === 'hardcore' ? 'active' : ''}`}
            onClick={() => onChangeMode('hardcore')}
            title={hardcoreAttemptedToday && guesses.length > 0 ? 'Already attempted today' : ''}
          >
            💀 Hardcore
          </button>
        </div>
        {gameMode === 'daily' && !isGameOver && isWin && !hardcoreAttemptedToday && (
          <div className="hardcore-suggestion">
            <p>Completed daily? Try 💀 Hardcore Mode!</p>
          </div>
        )}
        {dailyPlayedToday && gameMode === 'daily' && !hardcoreStarted && (
          <div className="daily-countdown">
            <p>Next daily disc in:</p>
            <p className="countdown-timer">{countdown}</p>
          </div>
        )}
      </header>

      <section className="panel">
        <form className="controls" onSubmit={onSubmitGuess}>
          {gameMode === 'hardcore' ? (
            <>
              <label className="control hardcore-input-label">
                Guess (Brand + Disc Name)
                <input
                  type="text"
                  value={guessText}
                  onChange={(event) => setGuessText(event.target.value)}
                  placeholder="e.g., Innova Aviar"
                  disabled={isGameOver}
                  spellCheck="false"
                  autoComplete="off"
                />
              </label>
              {gameMode === 'hardcore' && timerActive && !isGameOver && (
                <div className="hardcore-timer">
                  <span className={timeRemaining <= 10 ? 'warning' : ''}>{timeRemaining}s</span>
                </div>
              )}
            </>
          ) : (
            <>
              <label className="control">
                Brand
                <select
                  value={brand}
                  onChange={(event) => {
                    setBrand(event.target.value)
                    setDiscId('')
                  }}
                  disabled={isGameOver}
                >
                  <option value="">Select a brand</option>
                  {brands.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control">
                Disc
                <select
                  value={discId}
                  onChange={(event) => setDiscId(event.target.value)}
                  disabled={!brand || isGameOver}
                >
                  <option value="">Select a disc</option>
                  {discsForBrand.map((disc) => {
                    let label = disc.name
                    if (revealNumericStats.has('turn')) label += ` - Turn: ${disc.turn}`
                    if (revealNumericStats.has('speed')) label += ` - Speed: ${disc.speed}`
                    if (revealNumericStats.has('glide')) label += ` - Glide: ${disc.glide}`
                    if (revealNumericStats.has('fade')) label += ` - Fade: ${disc.fade}`
                    return (
                      <option key={disc.id} value={disc.id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </label>
            </>
          )}

          <button type="submit" disabled={gameMode === 'hardcore' ? (!guessText || isGameOver || (gameMode === 'daily' && dailyPlayedToday && guesses.length === 0)) : (!discId || isGameOver || (gameMode === 'daily' && dailyPlayedToday && guesses.length === 0))}>
            Guess
          </button>
          {gameMode !== 'hardcore' && gameMode !== 'daily' && (
            <button type="button" className="ghost" onClick={onNewGame}>
              New disc
            </button>
          )}
        </form>

        {gameMode === 'hardcore' && (
          <div className="hardcore-rules">
            <h3>💀 Hardcore Rules</h3>
            <ul>
              <li>⏱️ 60-second time limit (starts on first guess)</li>
              <li>🎯 Type brand and disc name exactly</li>
              <li>🚫 No powerups or hints available</li>
              <li>📊 6 guesses to get it right</li>
              <li>🔒 Once per day - only your first attempt counts</li>
            </ul>
          </div>
        )}
        {gameMode === 'daily' && !isGameOver && isWin && !hardcoreAttemptedToday && (
          <div className="hardcore-suggestion">
            <p>Completed daily? Try 💀 Hardcore Mode!</p>
          </div>
        )}
        {dailyPlayedToday && gameMode === 'daily' && !hardcoreStarted && (
          <div className="daily-countdown">
            <p>Next daily disc in:</p>
            <p className="countdown-timer">{countdown}</p>
          </div>
        )}
      </section>

      <section className="hints" style={{ display: gameMode === 'hardcore' ? 'none' : 'block' }}>
        <div className="hints-header">
          <h2>Powerups</h2>
          <p>Choose 1 powerup after 2 misses, and another after 4.</p>
        </div>


        {misses >= 2 && chosenPowerupIds.length === 0 && (
          <div className="hint-section">
            <h3 className="hint-section-title">Pick your first powerup</h3>
            <div className="hint-choice-grid">
              {firstPowerupOptions.map((powerup) => (
                <button
                  key={powerup.id}
                  type="button"
                  className={`hint-choice ${powerup.rarity === 'rare' ? 'rare' : ''}`}
                  onClick={() => setChosenPowerupIds([powerup.id])}
                >
                  {powerup.rarity === 'rare' && <span className="rare-badge">RARE</span>}
                  <span className="hint-art">{powerup.icon}</span>
                  <span className="hint-title">{powerup.name}</span>
                  <span className="hint-description">{powerup.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {misses >= 4 && chosenPowerupIds.length === 1 && (
          <div className="hint-section">
            <h3 className="hint-section-title">Pick your second powerup</h3>
            <div className="hint-choice-grid">
              {secondPowerupOptions.map((powerup) => (
                <button
                  key={powerup.id}
                  type="button"
                  className={`hint-choice ${powerup.rarity === 'rare' ? 'rare' : ''}`}
                  onClick={() => setChosenPowerupIds((current) => [...current, powerup.id])}
                >
                  {powerup.rarity === 'rare' && <span className="rare-badge">RARE</span>}
                  <span className="hint-art">{powerup.icon}</span>
                  <span className="hint-title">{powerup.name}</span>
                  <span className="hint-description">{powerup.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {chosenPowerups.length > 0 && (
          <div className="hint-results">
            {chosenPowerups.map((powerup) => (
              <div key={powerup.id} className="hint-result">
                <span className="hint-label">{powerup.name}</span>
                <span className="hint-value">{powerup.render(answer)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid">
        <div className="grid-row header-row">
          {STATS.map((stat) => (
            <div key={stat} className="grid-cell header-cell">
              {stat}
            </div>
          ))}
        </div>

        {guesses.map((guess, guessIndex) => {
          // Full Scan applies to guesses AFTER it was selected
          const shouldApplyFullScan = fullScanUsedGuessCount >= 0 && guessIndex > fullScanUsedGuessCount
          return (
            <div key={`${guess.id}-${guessIndex}`} className="grid-row">
              {STATS.map((stat) => {
                const status = getCellStatus(guess, stat, answer, revealStats, false, shouldApplyFullScan)
                const showArrow = status === 'higher' || status === 'lower'

                return (
                  <div key={stat} className="grid-cell" data-status={status}>
                    {formatStat(guess[stat])}
                    {showArrow && <span aria-hidden="true"> {status === 'higher' ? '▲' : '▼'}</span>}
                  </div>
                )
              })}
            </div>
          )
        })}

        {guesses.length === 0 && (
          <div className="empty-state">No guesses yet. Start by picking a disc.</div>
        )}
      </section>

      {showResults && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Game results">
          <div className="modal">
            <h2>{isWin ? 'You got it!' : isHardcoreTimeUp ? 'Time ran out' : 'Game over'}</h2>
            <p>
              {isWin
                ? `Solved in ${guesses.length} guess${guesses.length === 1 ? '' : 'es'}.`
                : isHardcoreTimeUp
                  ? `⏰ Time expired. The disc was ${answer.brand} ${answer.name}.`
                  : `Out of guesses. The disc was ${answer.brand} ${answer.name}.`}
            </p>

            {shareText && (
              <div className="share-preview">
                <pre>{shareText}</pre>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" onClick={onShare}>
                Share
              </button>
              <button type="button" className="ghost" onClick={() => setResultDismissed(true)}>
                Close
              </button>
              <button type="button" className="ghost" onClick={onNewGame}>
                New random disc
              </button>
            </div>

            {shareStatus && <p className="share-status">{shareStatus}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
