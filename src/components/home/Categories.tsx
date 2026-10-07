import { categories } from '../../data/landing'
import useScrollReveal from '../../hooks/useScrollReveal'
import './Categories.css'

export default function Categories() {
  const categoriesRef = useScrollReveal<HTMLUListElement>()

  return (
    <section className="container section" id="categories">
      <h2 className="section-title">Browse pets by category</h2>

      <ul ref={categoriesRef} className="categories-list">
        {categories.map((category, index) => (
          <li
            key={category.name}
            className={`reveal reveal-delay-${Math.min(index + 1, 4)}`}
          >
            <a
              href={`#${category.name.toLowerCase()}`}
              className="category"
            >
              <img
                src={category.image}
                alt={category.name}
                className="category-image"
              />
              <span>{category.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}