import { categories as landingCategories } from '../../data/landing'
import useScrollReveal from '../../hooks/useScrollReveal'
import './Categories.css'

type CategoryItem = {
  name: string
  image: string
}

type CategoriesProps = {
  items?: CategoryItem[]
  sectionId?: string
  title?: string
  className?: string
  getHref?: (category: CategoryItem) => string
}

export default function Categories({
  items = landingCategories,
  sectionId = 'categories',
  title = 'Browse pets by category',
  className = '',
  getHref,
}: CategoriesProps) {
  const categoriesRef = useScrollReveal<HTMLUListElement>()

  return (
    <section
      className={['container', 'section', className].filter(Boolean).join(' ')}
      id={sectionId}
    >
      <h2 className="section-title">{title}</h2>

      <ul ref={categoriesRef} className="categories-list">
        {items.map((category, index) => (
          <li
            key={category.name}
            className={'reveal reveal-delay-' + Math.min(index + 1, 4)}
          >
            <a
              href={getHref ? getHref(category) : '#' + category.name.toLowerCase()}
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
