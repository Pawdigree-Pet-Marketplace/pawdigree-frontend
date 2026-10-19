import { Check, MapPin, Phone } from "lucide-react";
import type { Profile } from "../../data/profile";
import "./ProfileCard.css";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

type ProfileCardProps = {
  profile: Profile;
};

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <section className="profile-card" aria-label="Your profile details">
      <div className="profile-card-top">
        <div className="profile-avatar" aria-hidden="true">
          {getInitials(profile.fullName)}
        </div>

        <div className="profile-card-info">
          <h2 className="profile-name">{profile.fullName}</h2>
          <p className="profile-email">{profile.email}</p>

          {profile.verified && (
            <span className="profile-verified">
              <Check size={14} strokeWidth={3} aria-hidden="true" /> Verified
            </span>
          )}
        </div>

        <a href="/profile/edit" className="profile-edit-btn">
          Edit
        </a>
      </div>

      <dl className="profile-details">
        {profile.phone && (
          <div>
            <dt>
              <Phone size={16} aria-hidden="true" /> Phone
            </dt>
            <dd>{profile.phone}</dd>
          </div>
        )}

        {profile.location && (
          <div>
            <dt>
              <MapPin size={16} aria-hidden="true" /> Location
            </dt>
            <dd>{profile.location}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
