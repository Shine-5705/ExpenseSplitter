import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

// ========== TYPES ==========

type User = {
  id: string
  email: string
  name: string
}

type Member = {
  id: string
  name: string
}

type Group = {
  id: string
  name: string
  members: Member[]
  createdBy: string
  createdAt: string
}

type Expense = {
  id: string
  groupId: string
  description: string
  amount: number
  paidByMemberId: string
  splitType: 'equal' | 'custom'
  participantIds: string[]
  shares: Record<string, number>
  category: string
  createdAt: string
}

type Settlement = {
  fromMemberId: string
  toMemberId: string
  amount: number
}

type PersistedState = {
  user: User | null
  groups: Group[]
  expenses: Expense[]
  activeGroupId: string | null
}

// ========== CONSTANTS ==========

const STORAGE_KEY = 'smart-expense-splitter-v2'

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getCategoryEmoji = (category: string): string => {
  const map: Record<string, string> = {
    Food: '🍕',
    Travel: '✈️',
    Stay: '🏨',
    Entertainment: '🎬',
    Utilities: '⚡',
    Other: '📦',
  }
  return map[category] ?? '📦'
}

const categorizeExpense = (description: string): string => {
  const text = description.toLowerCase()
  if (/dinner|lunch|breakfast|food|cafe|restaurant|grocery|eat|meal/.test(text))
    return 'Food'
  if (/flight|train|cab|taxi|uber|bus|fuel|petrol|travel|drive|ride/.test(text))
    return 'Travel'
  if (/rent|stay|hotel|airbnb|hostel|room|accommodation|booking/.test(text))
    return 'Stay'
  if (/movie|game|party|ticket|event|fun|show|concert|musical|theater/.test(text))
    return 'Entertainment'
  if (/wifi|internet|electricity|water|bill|utility|phone|gas|light/.test(text))
    return 'Utilities'
  return 'Other'
}

const readPersistedState = (): PersistedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, groups: [], expenses: [], activeGroupId: null }
    const parsed = JSON.parse(raw) as PersistedState
    return parsed
  } catch {
    return { user: null, groups: [], expenses: [], activeGroupId: null }
  }
}

// ========== LOGIN PAGE COMPONENT ==========

type LoginState = 'login' | 'signup'

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [mode, setMode] = useState<LoginState>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate validation delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name')
      setLoading(false)
      return
    }

    const user: User = {
      id: uid(),
      email,
      name: mode === 'signup' ? name : email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
    }

    onLogin(user)
    setLoading(false)
  }

  const isFormValid =
    email.includes('@') && password.length >= 6 && (mode === 'login' || name.trim())

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-icon">💰</div>
            <h1>Bill Bato</h1>
            <p>Manage shared expenses effortlessly</p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup')
                setError('')
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="form-field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {error && <div className="error-alert">{error}</div>}

            <button
              type="submit"
              className="auth-submit"
              disabled={!isFormValid || loading}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="auth-link"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// ========== MAIN DASHBOARD ==========

const Dashboard = ({
  user,
  state,
  onLogout,
  onUpdateState,
}: {
  user: User
  state: PersistedState
  onLogout: () => void
  onUpdateState: (updates: Partial<PersistedState>) => void
}) => {
  return (
    <div className="app-container">
      <Header user={user} onLogout={onLogout} />
      <main className="main-content">
        <DashboardContent state={state} onUpdateState={onUpdateState} user={user} />
      </main>
    </div>
  )
}

// ========== HEADER ==========

const Header = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <h1 className="brand-name">💰 Bill Bato</h1>
      </div>
      <div className="header-user">
        <div className="user-badge">
          <div className="user-avatar">{getInitials(user.name)}</div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
        <button className="logout-button" onClick={onLogout} title="Sign out">
          🚪 Sign Out
        </button>
      </div>
    </header>
  )
}

// ========== DASHBOARD CONTENT ==========

const DashboardContent = ({
  state,
  onUpdateState,
  user,
}: {
  state: PersistedState
  onUpdateState: (updates: Partial<PersistedState>) => void
  user: User
}) => {
  const { groups, expenses, activeGroupId } = state
  const activeGroup = groups.find((g) => g.id === activeGroupId)

  const [groupName, setGroupName] = useState('')
  const [memberName, setMemberName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidByMemberId, setPaidByMemberId] = useState('')
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [customShares, setCustomShares] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  const defaultParticipants = useMemo(
    () => activeGroup?.members.map((m) => m.id) ?? [],
    [activeGroup],
  )

  const effectiveParticipants = participantIds.length ? participantIds : defaultParticipants
  const effectivePaidBy =
    paidByMemberId && activeGroup?.members.some((m) => m.id === paidByMemberId)
      ? paidByMemberId
      : activeGroup?.members[0]?.id ?? ''

  const groupExpenses = useMemo(
    () => expenses.filter((e) => e.groupId === activeGroupId),
    [expenses, activeGroupId],
  )

  const balances = useMemo(() => {
    if (!activeGroup) return {}
    const map: Record<string, number> = Object.fromEntries(
      activeGroup.members.map((m) => [m.id, 0]),
    )
    for (const exp of groupExpenses) {
      map[exp.paidByMemberId] = (map[exp.paidByMemberId] ?? 0) + exp.amount
      for (const [mId, share] of Object.entries(exp.shares)) {
        map[mId] = (map[mId] ?? 0) - share
      }
    }
    return map
  }, [activeGroup, groupExpenses])

  const settlements = useMemo<Settlement[]>(() => {
    if (!activeGroup) return []
    const creditors = activeGroup.members
      .map((m) => ({ id: m.id, amount: Number((balances[m.id] ?? 0).toFixed(2)) }))
      .filter((c) => c.amount > 0.01)
      .sort((a, b) => b.amount - a.amount)

    const debtors = activeGroup.members
      .map((m) => ({ id: m.id, amount: Number((Math.abs(balances[m.id] ?? 0)).toFixed(2)) }))
      .filter((d) => balances[d.id] < -0.01)
      .sort((a, b) => b.amount - a.amount)

    const result: Settlement[] = []
    let ci = 0,
      di = 0
    while (ci < creditors.length && di < debtors.length) {
      const c = creditors[ci]
      const d = debtors[di]
      const amt = Number(Math.min(c.amount, d.amount).toFixed(2))
      if (amt > 0) {
        result.push({ fromMemberId: d.id, toMemberId: c.id, amount: amt })
      }
      c.amount = Number((c.amount - amt).toFixed(2))
      d.amount = Number((d.amount - amt).toFixed(2))
      if (c.amount <= 0.01) ci++
      if (d.amount <= 0.01) di++
    }
    return result
  }, [activeGroup, balances])

  const totalSpent = useMemo(
    () => groupExpenses.reduce((s, e) => s + e.amount, 0),
    [groupExpenses],
  )

  const addGroup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = groupName.trim()
    if (!trimmed) return
    const group: Group = {
      id: uid(),
      name: trimmed,
      members: [],
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    }
    onUpdateState({
      groups: [...groups, group],
      activeGroupId: group.id,
    })
    setGroupName('')
  }

  const addMember = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!activeGroup) return
    const trimmed = memberName.trim()
    if (!trimmed) return
    if (activeGroup.members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase()))
      return
    onUpdateState({
      groups: groups.map((g) =>
        g.id === activeGroup.id
          ? {
              ...g,
              members: [...g.members, { id: uid(), name: trimmed }],
            }
          : g,
      ),
    })
    setMemberName('')
  }

  const addExpense = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')

    if (!activeGroup || activeGroup.members.length < 2) {
      setFormError('Need a group with at least 2 members')
      return
    }

    const desc = description.trim()
    const amt = Number(amount)
    if (!desc || !Number.isFinite(amt) || amt <= 0) {
      setFormError('Invalid description or amount')
      return
    }

    if (!effectivePaidBy || !effectiveParticipants.length) {
      setFormError('Select payer and participants')
      return
    }

    const shares: Record<string, number> = {}
    if (splitType === 'equal') {
      const perShare = amt / effectiveParticipants.length
      for (const pId of effectiveParticipants) {
        shares[pId] = Number(perShare.toFixed(2))
      }
      const diff = Number((amt - Object.values(shares).reduce((a, b) => a + b, 0)).toFixed(2))
      if (diff !== 0 && effectiveParticipants[0]) {
        shares[effectiveParticipants[0]] = Number(
          (shares[effectiveParticipants[0]] + diff).toFixed(2),
        )
      }
    } else {
      let total = 0
      for (const pId of effectiveParticipants) {
        const val = Number(customShares[pId] ?? 0)
        if (!Number.isFinite(val) || val < 0) {
          setFormError('Invalid custom shares')
          return
        }
        shares[pId] = Number(val.toFixed(2))
        total += val
      }
      if (Math.abs(total - amt) > 0.01) {
        setFormError(`Shares must sum to ${money(amt)}`)
        return
      }
    }

    const expense: Expense = {
      id: uid(),
      groupId: activeGroup.id,
      description: desc,
      amount: Number(amt.toFixed(2)),
      paidByMemberId: effectivePaidBy,
      splitType,
      participantIds: effectiveParticipants,
      shares,
      category: categorizeExpense(desc),
      createdAt: new Date().toISOString(),
    }

    onUpdateState({ expenses: [expense, ...expenses] })
    setDescription('')
    setAmount('')
    setSplitType('equal')
    setCustomShares({})
  }

  return (
    <div className="dashboard-grid">
      {/* LEFT SIDEBAR */}
      <div className="sidebar">
        <div className="card">
          <h2 className="card-title">Groups</h2>
          <form onSubmit={addGroup} className="form-inline">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="New group..."
            />
            <button type="submit">+</button>
          </form>
          <div className="group-buttons">
            {groups.map((g) => (
              <button
                key={g.id}
                className={`group-btn ${g.id === activeGroupId ? 'active' : ''}`}
                onClick={() => onUpdateState({ activeGroupId: g.id })}
              >
                <span className="group-name">{g.name}</span>
                <span className="group-count">{g.members.length}</span>
              </button>
            ))}
            {!groups.length && <p className="empty-state">No groups yet</p>}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-area">
        {!activeGroup ? (
          <div className="empty-card">
            <div className="empty-icon">👥</div>
            <h2>Create your first group</h2>
            <p>Start tracking expenses with your friends and roommates</p>
          </div>
        ) : (
          <>
            {/* MEMBERS & ADD EXPENSE */}
            <div className="top-section">
              <div className="card compact">
                <h3 className="card-title-sm">Members</h3>
                <form onSubmit={addMember} className="form-inline">
                  <input
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Add member..."
                  />
                  <button type="submit">Add</button>
                </form>
                <div className="member-pills">
                  {activeGroup.members.map((m) => (
                    <div key={m.id} className="pill">
                      {m.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card compact">
                <h3 className="card-title-sm">Stats</h3>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="stat-label">Total</span>
                    <span className="stat-value">{money(totalSpent)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Expenses</span>
                    <span className="stat-value">{groupExpenses.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* EXPENSE FORM */}
            <div className="card">
              <h3 className="card-title-sm">Add Expense</h3>
              <form onSubmit={addExpense} className="expense-form">
                <div className="form-row">
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                  />
                </div>

                <select
                  value={effectivePaidBy}
                  onChange={(e) => setPaidByMemberId(e.target.value)}
                >
                  <option value="">Paid by...</option>
                  {activeGroup.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <div className="split-type">
                  <label>
                    <input
                      type="radio"
                      checked={splitType === 'equal'}
                      onChange={() => setSplitType('equal')}
                    />
                    Equal
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={splitType === 'custom'}
                      onChange={() => setSplitType('custom')}
                    />
                    Custom
                  </label>
                </div>

                <div className="participants-section">
                  {activeGroup.members.map((m) => {
                    const selected = effectiveParticipants.includes(m.id)
                    return (
                      <label key={m.id} className={`participant-item ${selected ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            setParticipantIds((p) =>
                              p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id],
                            )
                          }
                        />
                        <span>{m.name}</span>
                        {splitType === 'custom' && selected && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customShares[m.id] ?? ''}
                            onChange={(e) =>
                              setCustomShares((s) => ({ ...s, [m.id]: e.target.value }))
                            }
                            placeholder="0.00"
                          />
                        )}
                      </label>
                    )
                  })}
                </div>

                {formError && <div className="error-message">{formError}</div>}
                <button type="submit" className="submit-btn">
                  Add Expense
                </button>
              </form>
            </div>

            {/* BALANCES */}
            <div className="card">
              <h3 className="card-title-sm">Balances</h3>
              <div className="balances-list">
                {activeGroup.members.map((m) => {
                  const balance = balances[m.id] ?? 0
                  const status =
                    balance > 0.01 ? 'positive' : balance < -0.01 ? 'negative' : 'settled'
                  return (
                    <div key={m.id} className={`balance-item ${status}`}>
                      <span className="balance-name">{m.name}</span>
                      <span className="balance-value">
                        {balance > 0.01
                          ? `Gets ${money(balance)}`
                          : balance < -0.01
                            ? `Owes ${money(Math.abs(balance))}`
                            : 'Settled'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SETTLEMENTS */}
            {settlements.length > 0 && (
              <div className="card">
                <h3 className="card-title-sm">⏳ Pending Settlements</h3>
                <div className="settlements-list">
                  {settlements.map((s, i) => {
                    const from = activeGroup.members.find((m) => m.id === s.fromMemberId)?.name
                    const to = activeGroup.members.find((m) => m.id === s.toMemberId)?.name
                    return (
                      <div key={i} className="settlement-item">
                        <span>{from}</span>
                        <span className="arrow">→</span>
                        <span>{to}</span>
                        <strong>{money(s.amount)}</strong>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* EXPENSES LIST */}
            {groupExpenses.length > 0 && (
              <div className="card">
                <h3 className="card-title-sm">Recent Expenses</h3>
                <div className="expenses-list">
                  {groupExpenses.map((exp) => {
                    const paidBy = activeGroup.members.find((m) => m.id === exp.paidByMemberId)
                      ?.name
                    return (
                      <div key={exp.id} className="expense-item">
                        <div className="expense-emoji">{getCategoryEmoji(exp.category)}</div>
                        <div className="expense-details">
                          <div className="expense-desc">{exp.description}</div>
                          <div className="expense-meta">
                            {paidBy} • {exp.category}
                          </div>
                        </div>
                        <div className="expense-amount">{money(exp.amount)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ========== MAIN APP ==========

export default function App() {
  const [state, setState] = useState<PersistedState>(readPersistedState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const handleLogin = (user: User) => {
    setState((s) => ({ ...s, user }))
  }

  const handleLogout = () => {
    setState({ user: null, groups: [], expenses: [], activeGroupId: null })
  }

  const handleUpdateState = (updates: Partial<PersistedState>) => {
    setState((s) => ({ ...s, ...updates }))
  }

  if (!state.user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <Dashboard
      user={state.user}
      state={state}
      onLogout={handleLogout}
      onUpdateState={handleUpdateState}
    />
  )
}
