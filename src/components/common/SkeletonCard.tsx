import "./SkeletonCard.css";

/** Loading placeholder with the same footprint as a PetCard. */
export default function SkeletonCard() {
  return (
    <div className="skel-card" aria-hidden="true">
      <div className="skel-card__media" />
      <div className="skel-card__body">
        <span className="skel-card__line skel-card__line--w60" />
        <span className="skel-card__line skel-card__line--w80" />
        <span className="skel-card__line skel-card__line--w40" />
        <span className="skel-card__btn" />
      </div>
    </div>
  );
}
