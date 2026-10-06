import { useState } from 'react'
import './App.css'

function App() {
const [formData, setFormData] = useState({
fullName: '',
email: '',
phone: '',
password: '',
confirmPassword: '',
})

const [showPassword, setShowPassword] = useState(false)
const [showConfirmPassword, setShowConfirmPassword] = useState(false)
const [error, setError] = useState('')
const [success, setSuccess] = useState('')

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault()
setError('')
setSuccess('')

if (!formData.fullName.trim()) {
  setError('Please enter your full name.')
  return
}

if (!formData.email.trim()) {
  setError('Please enter your email address.')
  return
}

if (!formData.phone.trim()) {
  setError('Please enter your phone number.')
  return
}

if (!formData.password) {
  setError('Please enter a password.')
  return
}

if (formData.password.length < 8) {
  setError('Password must be at least 8 characters.')
  return
}

if (!formData.confirmPassword) {
  setError('Please confirm your password.')
  return
}

if (formData.password !== formData.confirmPassword) {
  setError('Passwords do not match.')
  return
}

console.log('Registration data:', formData)

setSuccess('Account created successfully!')
}

return ( <main className="registration-page"> <section className="registration-card"> <div className="registration-header"> <h1>Create your account</h1> <p>Join Pawdigree and connect with trusted pet services.</p> </div>
    <form className="registration-form" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}

      {success && <p className="form-success">{success}</p>}

      <div className="form-group">
        <label htmlFor="fullName">Full name</label>

        <input
          id="fullName"
          type="text"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({
              ...formData,
              fullName: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email address</label>

        <input
          id="email"
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone number</label>

        <input
          id="phone"
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={(e) =>
            setFormData({
              ...formData,
              phone: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>

        <div className="password-field">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value,
              })
            }
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm password</label>

        <div className="password-field">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({
                ...formData,
                confirmPassword: e.target.value,
              })
            }
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <button type="submit" className="register-button">
        Create account
      </button>
    </form>

    <p className="login-link">
      Already have an account? <a href="#">Log in</a>
    </p>
  </section>
</main>


)}

export default App
