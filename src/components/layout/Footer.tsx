import './Footer.css'

const columns = [
  { title: 'Marketplace', links: ['Browse Pets', 'Categories', 'Sell a Pet'] },
  { title: 'Company', links: ['About', 'Contact', 'FAQ'] },
  { title: 'Legal', links: ['Terms', 'Privacy Policy'] },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-columns">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="footer-heading">{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="/">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="footer-copy">
          ©2026 Pawdigree, Uganda. All rights reserved
        </p>
      </div>
    </footer>
  )
}