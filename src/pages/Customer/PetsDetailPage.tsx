import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  UserRound,
  Menu,
  Search,
  MapPin,
  ShieldCheck,
  Star,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  PawPrint,
} from "lucide-react";
import "./PetsDetailPage.css";

export type PetDetails = {
  id: string;
  name: string;
  breed: string;
  gender: string;
  age: string;
  size: string;
  vaccinated: boolean;
  location: string;
  feeLabel: string;
  description: string;
  photos: string[];
  listingStatus: string;
  vendor: {
    name: string;
    location: string;
    rating: number;
    verified: boolean;
    photo: string;
  };
};

type SuggestedPet = {
  name: string;
  type: string;
  location: string;
  photo: string;
};

type PetDetailsPageProps = {
  pet?: PetDetails;
  suggestedPets?: SuggestedPet[];
  onAdopt?: (pet: PetDetails) => void;
  onMessageVendor?: (pet: PetDetails) => void;
  onViewVendor?: (pet: PetDetails) => void;
};

const demoPet: PetDetails = {
  id: "amber-001",
  name: "Amber",
  breed: "Golden Retriever",
  gender: "Female",
  age: "8 months",
  size: "Large",
  vaccinated: true,
  location: "Kampala",
  feeLabel: "UGX 150,000",
  description:
    "Amber is a friendly, house-trained 8-month-old Golden Retriever surrendered by a family relocating abroad. She is great with children and other dogs, walks well on a leash, and is looking for an active home with space to play.",
  photos: [
    "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1551717743-49959800b1f6?auto=format&fit=crop&w=700&q=80",
    "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=700&q=80",
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=700&q=80",
  ],
  listingStatus: "Available for Adoption",
  vendor: {
    name: "Sunrise Animal Shelter",
    location: "Mukono",
    rating: 4.9,
    verified: true,
    photo:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=160&q=80",
  },
};

const demoSuggestions: SuggestedPet[] = [
  {
    name: "Miso",
    type: "Cat",
    location: "Entebbe",
    photo:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Coco",
    type: "Rabbit",
    location: "Jinja",
    photo:
      "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Rex",
    type: "Dog",
    location: "Kampala",
    photo:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=80",
  },
];

export default function PetDetailsPage({
  pet = demoPet,
  suggestedPets = demoSuggestions,
  onAdopt,
  onMessageVendor,
  onViewVendor,
}: PetDetailsPageProps) {
  const [activePhoto, setActivePhoto] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const changePhoto = (direction: number) => {
    setActivePhoto((current) => {
      const count = pet.photos.length;
      return (current + direction + count) % count;
    });
  };

  return (
    <div className="pet-details-page">
      <header className="pd-header">
        <button className="pd-icon-button" aria-label="Open menu">
          <Menu size={21} />
        </button>
        <Link className="pd-brand" to="/" aria-label="Pawdigree home">
          <span className="pd-brand-mark"><PawPrint size={20} /></span>
          <span>Pawdigree<small>Pets deserve a loving home</small></span>
        </Link>

        <label className="pd-search">
          <Search size={16} />
          <input aria-label="Search pets and vets" placeholder="Search pets, vets..." />
        </label>

        <nav className="pd-header-actions" aria-label="Quick links">
          <button
            className={`pd-icon-button ${isSaved ? "is-saved" : ""}`}
            aria-label={isSaved ? "Remove from favourites" : "Add to favourites"}
            aria-pressed={isSaved}
            onClick={() => setIsSaved((saved) => !saved)}
          >
            <Heart size={23} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button className="pd-icon-button" aria-label="Shopping cart">
            <ShoppingCart size={22} />
          </button>
          <button className="pd-icon-button" aria-label="Your account">
            <UserRound size={22} />
          </button>
        </nav>
      </header>

      <div className="pd-breadcrumb">
        <Link to="/">Home</Link><span>/</span><Link to="/pets">Explore Pets</Link>
        <span>/</span><strong>{pet.name} — {pet.breed}</strong>
      </div>

      <main className="pd-main">
        <section className="pd-gallery" aria-label={`${pet.name} photos`}>
          <div className="pd-main-photo">
            <img src={pet.photos[activePhoto]} alt={`${pet.name}, ${pet.breed}`} />
            {pet.photos.length > 1 && (
              <>
                <button className="pd-photo-arrow pd-photo-prev" onClick={() => changePhoto(-1)} aria-label="Previous photo">
                  <ChevronLeft size={22} />
                </button>
                <button className="pd-photo-arrow pd-photo-next" onClick={() => changePhoto(1)} aria-label="Next photo">
                  <ChevronRight size={22} />
                </button>
                <span className="pd-photo-count">{activePhoto + 1} / {pet.photos.length}</span>
              </>
            )}
          </div>
          <div className="pd-thumbnails">
            {pet.photos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                className={`pd-thumbnail ${activePhoto === index ? "active" : ""}`}
                onClick={() => setActivePhoto(index)}
                aria-label={`View photo ${index + 1} of ${pet.name}`}
                aria-pressed={activePhoto === index}
              >
                <img src={photo} alt="" />
              </button>
            ))}
          </div>

          <section className="pd-recommendations">
            <h2>More pets you may like</h2>
            <div className="pd-suggested-grid">
              {suggestedPets.map((suggestion) => (
                <Link className="pd-suggested-card" to="/pets" key={suggestion.name}>
                  <div className="pd-suggested-image">
                    <img src={suggestion.photo} alt={suggestion.name} />
                    <span>{suggestion.type}</span>
                  </div>
                  <div className="pd-suggested-info">
                    <strong>{suggestion.name}</strong>
                    <small><MapPin size={12} /> {suggestion.location}</small>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <section className="pd-information" aria-labelledby="pd-pet-name">
          <h1 id="pd-pet-name">{pet.name}</h1>
          <p className="pd-subtitle">{pet.breed} · {pet.gender}</p>

          <div className="pd-badges">
            {pet.vendor.verified && (
              <span className="pd-badge pd-badge-verified"><ShieldCheck size={13} /> Verified Listing</span>
            )}
            <span className="pd-badge pd-badge-status">{pet.listingStatus}</span>
            <span className="pd-badge pd-badge-location"><MapPin size={13} /> {pet.location}</span>
          </div>

          <h2 className="pd-fee">{pet.feeLabel.startsWith("UGX") ? "Adoption fee: " : ""}{pet.feeLabel}</h2>
          <p className="pd-description">{pet.description}</p>

          <div className="pd-facts" aria-label="Pet details">
            <div><strong>{pet.age}</strong><span>Age</span></div>
            <div><strong>{pet.gender}</strong><span>Gender</span></div>
            <div><strong>{pet.vaccinated ? "Yes" : "Not confirmed"}</strong><span>Vaccinated</span></div>
            <div><strong>{pet.size}</strong><span>Size</span></div>
          </div>

          <section className="pd-vendor-card" aria-label="Vendor information">
            <img className="pd-vendor-photo" src={pet.vendor.photo} alt="" />
            <div className="pd-vendor-copy">
              <strong>
                {pet.vendor.name}
                {pet.vendor.verified && <ShieldCheck className="pd-inline-verified" size={14} />}
              </strong>
              <span><Star size={13} fill="currentColor" /> <b>{pet.vendor.rating.toFixed(1)}</b> · {pet.vendor.location}</span>
            </div>
            <button className="pd-button pd-button-outline pd-vendor-button" onClick={() => onViewVendor?.(pet)}>
              View Profile
            </button>
          </section>

          <div className="pd-primary-actions">
            <button className="pd-button pd-button-primary" onClick={() => onAdopt?.(pet)}>
              Adopt {pet.name}
            </button>
            <button className="pd-button pd-button-outline pd-message-button" onClick={() => onMessageVendor?.(pet)}>
              <MessageCircle size={17} /> Message
            </button>
          </div>
          <p className="pd-safety-note"><ShieldCheck size={14} /> Ask questions and confirm details with the vendor before arranging a visit.</p>
        </section>
      </main>

      <footer className="pd-footer">
        <span>© 2026 Pawdigree. All rights reserved.</span>
        <nav aria-label="Footer links">
          <Link to="/about">About</Link><Link to="/vendors">Vendors</Link><Link to="/support">Support</Link><Link to="/privacy">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
}
