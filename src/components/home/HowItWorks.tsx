import useScrollReveal from '../../hooks/useScrollReveal'
import './HowItWorks.css'

const steps = [
  {
    title: 'Browse and search',
    text: 'Explore pets, services and products from vendors across Uganda. Filter by breed, price and location.',
  },
  {
    title: 'Meet verified sellers',
    text: 'Chat with vendors we have checked, ask your questions and see their listings before you decide.',
  },
  {
    title: 'Bring your pet home',
    text: 'Buy, adopt or book a service with confidence, then enjoy your new companion.',
  },
]

export default function HowItWorks() {
  const stepsRef = useScrollReveal<HTMLOListElement>()

  return (
    <section className="container section how-it-works" id="how-it-works">
      <h2 className="section-title">How Pawdigree works</h2>

      <p className="how-intro">
        Three simple steps from searching to snuggling.
      </p>

      <ol className="how-steps" ref={stepsRef}>
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={`how-step reveal reveal-delay-${index + 1}`}
          >
            <span className="how-number">{index + 1}</span>

            <h3>{step.title}</h3>

            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}