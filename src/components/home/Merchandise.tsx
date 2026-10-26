import useScrollReveal from '../../hooks/useScrollReveal'
import './Merchandise.css'

export default function Merchandise() {
  const merchRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="container section" id="merchandise">
      <div className="section-header">
        <h2 className="section-title">Shop Pet Merchandise</h2>
      </div>
      <div className="merch-track-wrapper" ref={merchRef}>
        <p className="merch-unavailable" role="status">
          Product listings will appear here when the merchandise API is available.
        </p>
      </div>
    </section>
  )
}
