'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = [
  '#c9a84c','#60a5fa','#34d399','#f87171','#a78bfa',
  '#fb923c','#38bdf8','#4ade80','#f472b6','#facc15',
]

interface DataPoint {
  round: string
  [username: string]: string | number
}

interface Props {
  data: DataPoint[]
  users: string[]
}

export function EvolutionChart({ data, users }: Props) {
  if (!data.length) return (
    <div className="h-64 flex items-center justify-center text-dark-400">
      No hay datos de evolución disponibles aún.
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="round" stroke="#616161" tick={{ fontSize: 11 }} />
        <YAxis stroke="#616161" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#111111',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            color: '#fff',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#9e9e9e' }}
        />
        {users.map((user, i) => (
          <Line
            key={user}
            type="monotone"
            dataKey={user}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
