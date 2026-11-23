import { useEffect, useState } from 'react'
import { DEFAULT_QUERY } from '../../data/pets'
import { fetchPets } from '../../services/petsApi'
import { customerAuthenticatedFetch } from '../../services/customerAuthenticatedFetch'
import useSession from '../../hooks/useSession'
import useScrollReveal from '../../hooks/useScrollReveal'
import { HeartIcon } from '../icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { PublicPet } from '../../data/pets'
import './Listings.css'

function PetListingImage({ pet }: { pet: PublicPet }) {
  const [failed, setFailed] = useState(false)
  const image = pet.images?.find((item) => item.is_primary)?.image || pet.images?.[0]?.image

  if (!image || failed) {
    return (
      <div className="listing-image" role="img" aria-label={`${pet.name}, no photo available`}>
        🐾
      </div>
    )
  }

  return (
    <img
      src={image}
      alt={pet.name}
      className="listing-image"
      onError={() => setFailed(true)}
    />
  )
}

export default function Listings() {
  const isCustomerSignedIn = useSession('CUSTOMER')
  const location = useLocation()
  const navigate = useNavigate()
  const [pets, setPets] = useState<PublicPet[]>([])
  const listingsRef = useScrollReveal<HTMLDivElement>(pets)
  const [favourites, setFavourites] = useState<number[]>([])
  const customerFavourites = isCustomerSignedIn ? favourites : []
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [pendingPet, setPendingPet] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchPets(DEFAULT_QUERY)
      .then((response) => {
        if (cancelled) return
        setPets(response.results.slice(0, 4))
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => { cancelled = true }
  }, [retryCount])

  useEffect(() => {
    let cancelled = false
    if (!isCustomerSignedIn) return
    customerAuthenticatedFetch('/api/favourites/ids/')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load favourites')
        return response.json() as Promise<number[]>
      })
      .then((ids) => { if (!cancelled) setFavourites(ids) })
      .catch(() => { if (!cancelled) setFavourites([]) })
    return () => { cancelled = true }
  }, [isCustomerSignedIn])

  const toggleFavourite = async (petId: number) => {
    if (!isCustomerSignedIn) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (pendingPet !== null) return
    setPendingPet(petId)
    const isFavourite = customerFavourites.includes(petId)
    try {
      const response = await customerAuthenticatedFetch(`/api/favourites/${petId}/`, {
        method: isFavourite ? 'DELETE' : 'PUT',
      })
      if (!response.ok) throw new Error('Could not update favourite')
      setFavourites((current) => isFavourite
        ? current.filter((id) => id !== petId)
        : [...current, petId])
    } catch {
      // Keep the current state when the API request fails.
    } finally {
      setPendingPet(null)
    }
  }

  return (
    <section className="container section popular-listings-section" id="pets">
      <div className="section-header">
        <h2 className="section-title">Available Pets</h2>

        <Link to="/explore-pets" className="section-link">
          See All
        </Link>
      </div>

      <div className="listings-grid" ref={listingsRef}>
        {status === 'loading' ? (
          <p role="status">Loading pets…</p>
        ) : status === 'error' ? (
          <div role="alert">
            <p>We couldn’t load pet listings right now.</p>
            <button
              type="button"
              onClick={() => {
                setStatus('loading')
                setRetryCount((count) => count + 1)
              }}
            >
              Try again
            </button>
          </div>
        ) : pets.length === 0 ? (
          <p>No pet listings are available right now.</p>
        ) : pets.map((pet, index) => {
          const age = pet.age < 12 ? `${pet.age} months` : `${Math.floor(pet.age / 12)} ${Math.floor(pet.age / 12) === 1 ? 'year' : 'years'}`
          const isFavourite = customerFavourites.includes(pet.pet_id)
          return (
          <article
            key={pet.pet_id}
            className={`listing-card reveal reveal-delay-${Math.min(
              index + 1,
              4,
            )}`}
          >
            <div className="listing-media">
              <PetListingImage pet={pet} />

              {pet.listing_type === 'SALE' && (
                <span className="listing-badge">For Sale</span>
              )}

              <button
                type="button"
                className="listing-heart"
                aria-label={`${isFavourite ? 'Remove' : 'Save'} ${pet.name} ${isFavourite ? 'from' : 'to'} favourites`}
                aria-pressed={isFavourite}
                disabled={pendingPet === pet.pet_id}
                onClick={() => void toggleFavourite(pet.pet_id)}
              >
                <HeartIcon fill={isFavourite ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="listing-body">
              <h3>{pet.name}</h3>

              <p className="listing-details">{[pet.breed, pet.species, age].filter(Boolean).join(' · ')}</p>

              <p className="listing-price">{pet.listing_type === 'ADOPTION' ? 'For adoption' : `UGX ${Number(pet.price || 0).toLocaleString('en-UG')}`}</p>
            </div>
          </article>
        )})}
      </div>
    </section>
  )
}
