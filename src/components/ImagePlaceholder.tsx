import './ImagePlaceholder.css'

interface ImagePlaceholderProps {
  emoji: string
  label: string
  className?: string
}

/** Temporary stand-in until real photos are added to src/assets/images. */
export default function ImagePlaceholder({
  emoji,
  label,
  className = '',
}: ImagePlaceholderProps) {
  return (
    <div className={`image-placeholder ${className}`} role="img" aria-label={label}>
      <span>{emoji}</span>
    </div>
  )
}