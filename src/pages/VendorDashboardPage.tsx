import "./VendorDashboardPage.css";

const navigationGroups = [
  {
    items: [
      { icon: "⌂", label: "Dashboard" },
      { icon: "▱", label: "Sales & Payouts" },
      { icon: "♧", label: "Notifications" },
    ],
  },
  {
    items: [
      { icon: "▣", label: "My Listings" },
      { icon: "▤", label: "Pet Listings" },
      { icon: "▤", label: "Merch Listings" },
      { icon: "✂", label: "Service Listings" },
      { icon: "🛒", label: "Pet Orders" },
      { icon: "🛒", label: "Merch Orders" },
      { icon: "▦", label: "Service Bookings" },
      { icon: "▤", label: "Inventory" },
      { icon: "▦", label: "Availability" },
      { icon: "♧", label: "Customers" },
      { icon: "▢", label: "Messages" },
    ],
  },
  {
    items: [
      { icon: "✿", label: "Store Profile" },
      { icon: "▱", label: "Business & Payout" },
      { icon: "⚙", label: "Settings" },
      { icon: "ⓘ", label: "Support" },
      { icon: "▤", label: "Terms" },
    ],
  },
];

const metrics = [
  {
    icon: "▣",
    value: "$12,480",
    label: "Total Sales",
    change: "↑ 8.2%",
    tone: "teal",
  },
  {
    icon: "🛒",
    value: "164",
    label: "Orders",
    change: "↑ 3.1%",
    tone: "coral",
  },
  {
    icon: "▣",
    value: "$10,950",
    label: "Revenue (net)",
    change: "↑ 5.4%",
    tone: "green",
  },
  {
    icon: "▦",
    value: "7",
    label: "Pending Bookings",
    change: "↓ 2",
    tone: "red",
  },
];

const stockAlerts = [
  { name: "Salmon Dry Food 5kg", quantity: "3 left" },
  { name: "Cat Scratch Post", quantity: "1 left" },
  { name: "Puppy Chew Toy", quantity: "4 left" },
];

const orders = [
  {
    id: "#PD-2291",
    customer: "Alina K.",
    type: "Pet",
    amount: "$450",
    status: "New",
  },
  {
    id: "#PD-2290",
    customer: "Marcus O.",
    type: "Merch",
    amount: "$38",
    status: "Processing",
  },
  {
    id: "#PD-2288",
    customer: "Ritah N.",
    type: "Service",
    amount: "$60",
    status: "Completed",
  },
];

const sales = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 64 },
  { day: "Wed", value: 51 },
  { day: "Thu", value: 79 },
  { day: "Fri", value: 58 },
  { day: "Sat", value: 86 },
  { day: "Sun", value: 75 },
];

function VendorDashboardPage() {
  return (
    <main className="vendor-dashboard">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <a className="dashboard-brand" href="/vendor">
          <span className="dashboard-brand-icon">🐾</span>

          <span>
            <strong>Pawdigree</strong>
            <small>VENDOR</small>
          </span>
        </a>

        <nav className="dashboard-navigation" aria-label="Vendor navigation">
          {navigationGroups.map((group, index) => (
            <div className="dashboard-nav-group" key={index}>
              {group.items.map((item) => (
                <a
                  key={item.label}
                  href={
                    item.label === "Dashboard"
                      ? "/vendor/dashboard"
                      : "#"
                  }
                  className={
                    item.label === "Dashboard"
                      ? "dashboard-nav-item active"
                      : "dashboard-nav-item"
                  }
                >
                  <span className="dashboard-nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        <a className="dashboard-logout" href="/vendor-login">
          <span aria-hidden="true">⇥</span>
          Log out
        </a>
      </aside>

      {/* MAIN CONTENT */}
      <section className="dashboard-main">
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="dashboard-heading">
            <span className="dashboard-breadcrumb">
              app.pawdigree.com/vendor/dashboard
            </span>

            <h1>Welcome back, Happy Paws Kennel</h1>

            <p>Here's how your store is doing today</p>
          </div>

          <div className="dashboard-header-actions">
            <label className="dashboard-search">
              <span aria-hidden="true">⌕</span>

              <input type="search" placeholder="Search..." />
            </label>

            <button
              type="button"
              className="dashboard-notification-button"
              aria-label="Notifications"
            >
              ♧
            </button>

            <button
              type="button"
              className="dashboard-avatar"
              aria-label="Open vendor profile"
            >
              JM
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {/* METRIC CARDS */}
          <section className="dashboard-metrics" aria-label="Store metrics">
            {metrics.map((metric) => (
              <article
                className="dashboard-metric-card"
                key={metric.label}
              >
                <span className={`dashboard-metric-icon ${metric.tone}`}>
                  {metric.icon}
                </span>

                <strong>{metric.value}</strong>

                <div className="dashboard-metric-bottom">
                  <span>{metric.label}</span>

                  <small className={metric.tone}>{metric.change}</small>
                </div>
              </article>
            ))}
          </section>

          {/* SALES CHART AND STOCK ALERTS */}
          <section className="dashboard-analytics">
            <article className="dashboard-panel dashboard-sales-panel">
              <h2>SALES — LAST 7 DAYS</h2>

              <div className="dashboard-chart">
                <div className="dashboard-chart-grid">
                  {[1, 2, 3, 4].map((line) => (
                    <span key={line} />
                  ))}
                </div>

                <svg
                  className="dashboard-chart-svg"
                  viewBox="0 0 700 230"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Illustrative sales trend over seven days"
                >
                  <polyline
                    points={sales
                      .map(
                        (point, index) =>
                          `${20 + index * 110},${205 - point.value * 1.9}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#217b78"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {sales.map((point, index) => (
                    <circle
                      key={point.day}
                      cx={20 + index * 110}
                      cy={205 - point.value * 1.9}
                      r="3.5"
                      fill="#217b78"
                    />
                  ))}
                </svg>
              </div>

              <div className="dashboard-chart-labels">
                {sales.map((point) => (
                  <span key={point.day}>{point.day}</span>
                ))}
              </div>
            </article>

            <article className="dashboard-panel dashboard-stock-panel">
              <h2>LOW STOCK ALERTS</h2>

              <div className="dashboard-stock-list">
                {stockAlerts.map((item) => (
                  <div className="dashboard-stock-item" key={item.name}>
                    <strong>{item.name}</strong>
                    <span>{item.quantity}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* RECENT ORDERS */}
          <section className="dashboard-panel dashboard-orders-panel">
            <h2>RECENT ORDERS</h2>

            <div className="dashboard-table-wrapper">
              <table className="dashboard-orders-table">
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>CUSTOMER</th>
                    <th>TYPE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.type}</td>
                      <td>{order.amount}</td>
                      <td>
                        <span
                          className={`dashboard-order-status ${order.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default VendorDashboardPage;