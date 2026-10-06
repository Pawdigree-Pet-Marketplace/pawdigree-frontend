import { categories } from '../../data/landing'
import './Categories.css'

export default function Categories() {
  return (
    <section className="container section" id="categories">
      <h2 className="section-title">Browse pets by category</h2>

      <ul className="categories-list">
        {categories.map((category) => (
          <li key={category.name}>
            <a href={`#${category.name.toLowerCase()}`} className="category">
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