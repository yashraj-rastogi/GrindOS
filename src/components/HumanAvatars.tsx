interface HumanAvatarProps {
  avatarId: string;
  size?: number;
  className?: string;
}

export const HUMAN_AVATARS = [
  { id: 'human:coder', name: 'The Developer', skinColor: '#FFE0B2', hairColor: '#37474F' },
  { id: 'human:athlete', name: 'The Athlete', skinColor: '#FFCCBC', hairColor: '#E65100' },
  { id: 'human:scholar', name: 'The Scholar', skinColor: '#FFF9C4', hairColor: '#4E342E' },
  { id: 'human:artist', name: 'The Artist', skinColor: '#F8BBD0', hairColor: '#880E4F' },
  { id: 'human:explorer', name: 'The Explorer', skinColor: '#DCEDC8', hairColor: '#33691E' },
  { id: 'human:gamer', name: 'The Gamer', skinColor: '#D1C4E9', hairColor: '#311B92' },
];

export default function HumanAvatar({ avatarId, size = 40, className }: HumanAvatarProps) {
  const getAvatarConfig = () => {
    return HUMAN_AVATARS.find(a => a.id === avatarId) || HUMAN_AVATARS[0];
  };

  const config = getAvatarConfig();

  const renderFaceDetails = () => {
    switch (avatarId) {
      case 'human:athlete':
        return (
          <>
            {/* Sweatband */}
            <rect x="20" y="22" width="40" height="8" rx="2" fill="#E53935" stroke="#1A3263" strokeWidth="2.5" />
            <line x1="36" y1="22" x2="36" y2="30" stroke="#1A3263" strokeWidth="2" />
            <line x1="44" y1="22" x2="44" y2="30" stroke="#1A3263" strokeWidth="2" />
            
            {/* Eyes */}
            <circle cx="32" cy="42" r="3" fill="#1A3263" />
            <circle cx="48" cy="42" r="3" fill="#1A3263" />
            {/* Determined mouth */}
            <path d="M 36,54 Q 40,50 44,54" fill="none" stroke="#1A3263" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'human:scholar':
        return (
          <>
            {/* Neat hair */}
            <path d="M 20,28 C 22,14 58,14 60,28 C 55,22 45,24 40,28 C 35,24 25,22 20,28 Z" fill={config.hairColor} stroke="#1A3263" strokeWidth="2.5" />
            {/* Round Glasses */}
            <circle cx="30" cy="42" r="7" fill="none" stroke="#1A3263" strokeWidth="2.5" />
            <circle cx="50" cy="42" r="7" fill="none" stroke="#1A3263" strokeWidth="2.5" />
            <line x1="37" y1="42" x2="43" y2="42" stroke="#1A3263" strokeWidth="2.5" />
            {/* Eyes behind glasses */}
            <circle cx="30" cy="42" r="2.5" fill="#1A3263" />
            <circle cx="50" cy="42" r="2.5" fill="#1A3263" />
            {/* Slight smart smile */}
            <path d="M 36,56 Q 40,59 44,56" fill="none" stroke="#1A3263" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'human:artist':
        return (
          <>
            {/* Long Hair */}
            <path d="M 18,34 L 16,68 L 22,68 L 24,34 Z" fill={config.hairColor} stroke="#1A3263" strokeWidth="2" />
            <path d="M 62,34 L 64,68 L 58,68 L 56,34 Z" fill={config.hairColor} stroke="#1A3263" strokeWidth="2" />
            {/* Beanie / Beret */}
            <path d="M 22,30 C 24,15 56,15 58,30 Z" fill="#E53935" stroke="#1A3263" strokeWidth="2.5" />
            <circle cx="40" cy="15" r="4" fill="#E53935" stroke="#1A3263" strokeWidth="2" />
            
            {/* Eyes */}
            <circle cx="32" cy="42" r="3" fill="#1A3263" />
            <circle cx="48" cy="42" r="3" fill="#1A3263" />
            {/* Smile with a little wink expression */}
            <path d="M 35,53 Q 40,58 45,53" fill="none" stroke="#1A3263" strokeWidth="2.5" strokeLinecap="round" />
            {/* Earring */}
            <circle cx="16" cy="48" r="3" fill="none" stroke="#FAB95B" strokeWidth="2" />
          </>
        );
      case 'human:explorer':
        return (
          <>
            {/* Cap */}
            <path d="M 22,28 C 24,16 56,16 58,28 Z" fill="#FAB95B" stroke="#1A3263" strokeWidth="2.5" />
            <path d="M 16,28 Q 40,24 64,28 L 58,34 L 22,34 Z" fill="#FAB95B" stroke="#1A3263" strokeWidth="2.5" />
            
            {/* Sunglasses */}
            <path d="M 24,42 L 35,42 C 37,46 33,50 29,50 C 26,50 24,46 24,42 Z" fill="#1A3263" stroke="#1A3263" strokeWidth="2" />
            <path d="M 37,42 L 48,42 C 50,46 46,50 42,50 C 39,50 37,46 37,42 Z" fill="#1A3263" stroke="#1A3263" strokeWidth="2" />
            <line x1="34" y1="42" x2="38" y2="42" stroke="#1A3263" strokeWidth="2.5" />

            {/* Smile */}
            <path d="M 34,58 Q 40,62 46,58" fill="none" stroke="#1A3263" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'human:gamer':
        return (
          <>
            {/* Spiky hair */}
            <path d="M 20,28 L 24,18 L 32,22 L 40,14 L 48,22 L 56,18 L 60,28 Z" fill={config.hairColor} stroke="#1A3263" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Headset band */}
            <path d="M 22,30 Q 40,18 58,30" fill="none" stroke="#1A3263" strokeWidth="4.5" strokeLinecap="round" />
            {/* Ear cups */}
            <rect x="15" y="32" width="6" height="14" rx="3" fill="#00E676" stroke="#1A3263" strokeWidth="2.5" />
            <rect x="59" y="32" width="6" height="14" rx="3" fill="#00E676" stroke="#1A3263" strokeWidth="2.5" />
            
            {/* Eyes */}
            <circle cx="32" cy="43" r="3" fill="#1A3263" />
            <circle cx="48" cy="43" r="3" fill="#1A3263" />
            {/* Gaming concentrated smirk */}
            <path d="M 34,54 H 46" stroke="#1A3263" strokeWidth="3.5" strokeLinecap="round" />
          </>
        );
      case 'human:coder':
      default:
        return (
          <>
            {/* Hair */}
            <path d="M 20,28 C 18,22 28,12 40,16 C 52,12 62,22 60,28 Z" fill={config.hairColor} stroke="#1A3263" strokeWidth="2.5" />
            {/* Headphones */}
            <path d="M 20,32 Q 40,16 60,32" fill="none" stroke="#1A3263" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="16" y="32" width="6" height="12" rx="3" fill="#29B6F6" stroke="#1A3263" strokeWidth="2" />
            <rect x="58" y="32" width="6" height="12" rx="3" fill="#29B6F6" stroke="#1A3263" strokeWidth="2" />

            {/* Glasses */}
            <rect x="25" y="38" width="12" height="8" rx="2" fill="none" stroke="#1A3263" strokeWidth="2.5" />
            <rect x="43" y="38" width="12" height="8" rx="2" fill="none" stroke="#1A3263" strokeWidth="2.5" />
            <line x1="37" y1="42" x2="43" y2="42" stroke="#1A3263" strokeWidth="2.5" />

            {/* Eyes */}
            <circle cx="31" cy="42" r="1.5" fill="#1A3263" />
            <circle cx="49" cy="42" r="1.5" fill="#1A3263" />
            
            {/* Friendly mouth */}
            <path d="M 34,54 Q 40,58 46,54" fill="none" stroke="#1A3263" strokeWidth="3" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Neck */}
      <rect x="34" y="60" width="12" height="12" rx="2" fill={config.skinColor} stroke="#1A3263" strokeWidth="2.5" />
      
      {/* Main Face Shape */}
      <rect x="20" y="24" width="40" height="40" rx="10" fill={config.skinColor} stroke="#1A3263" strokeWidth="2.5" />
      
      {/* Custom characteristics by Avatar ID */}
      {renderFaceDetails()}

      {/* Shoulder line */}
      <path d="M 12,75 Q 40,68 68,75" fill="none" stroke="#1A3263" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
