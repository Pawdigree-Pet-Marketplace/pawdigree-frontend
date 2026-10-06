import { stats } from '../../data/landing'
import './Stats.css'

export default function Stats() {
  return (
    <section className="container stats" aria-label="Marketplace stats">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  )
}