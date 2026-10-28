// A carousel of silk fabric swatches arranged in real 3D (CSS 3D, no WebGL), slowly turning around a glowing
// script "M" above a lit platform. It leans toward the pointer through the hero's --px / --py variables.
// Shown in the hero until a model photo is uploaded. Cards show the photos added in Admin → Storefront images →
// Hero carousel photos; cards without a photo are silk swatches.
const SWATCHES = [
  ['#2e2b7b', '#e88aab'], ['#f3bfd1', '#7d74d8'], ['#1c1a52', '#f0aec4'], ['#e88aab', '#2e2b7b'],
  ['#5c58b8', '#fbe3ec'], ['#26236a', '#e88aab'], ['#d97a9c', '#1c1a52'], ['#3a3592', '#f3bfd1'],
];

export default function Showcase3D({ photos = [] }) {
  return (
    <div className="s3d" aria-hidden="true">
      <span className="s3d-glow" />
      <div className="s3d-stage">
        <div className="s3d-tilt">
          <span className="s3d-base" /><span className="s3d-base b2" />
          <div className="s3d-ring">
            {SWATCHES.map(([a, b], i) => (
              <span key={i} className={`s3d-card ${photos[i] ? 'has-photo' : ''}`} style={{ '--a': a, '--b': b, transform: `rotateY(${i * 45}deg) translateZ(210px)` }}>
                {photos[i] && <img src={photos[i].image} alt="" decoding="async" />}
                <i className="s3d-sheen" />{!photos[i] && <i className="s3d-zari" />}
              </span>
            ))}
          </div>
          <span className="s3d-mono">M</span>
        </div>
      </div>
      <span className="s3d-sparks">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</span>
    </div>
  );
}
