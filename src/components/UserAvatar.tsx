import HumanAvatar from './HumanAvatars';

interface UserAvatarProps {
  avatarUrlOrId?: string | null;
  displayName?: string | null;
  size?: number;
  className?: string;
}

export default function UserAvatar({
  avatarUrlOrId,
  displayName,
  size = 32,
  className = '',
}: UserAvatarProps) {
  if (avatarUrlOrId?.startsWith('human:')) {
    return <HumanAvatar avatarId={avatarUrlOrId} size={size} className={className} />;
  }

  if (avatarUrlOrId?.startsWith('http')) {
    return (
      <img
        src={avatarUrlOrId}
        alt={displayName || 'User avatar'}
        className={className}
        referrerPolicy="no-referrer"
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          display: 'block',
        }}
      />
    );
  }

  // Fallback to first letter of display name or email, or 'U'
  const text = displayName || avatarUrlOrId || 'U';
  const firstLetter = text.charAt(0).toUpperCase();

  return (
    <div
      className={`user-avatar-fallback ${className}`}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-heading)',
        fontWeight: 'var(--weight-bold)',
        fontSize: size * 0.45,
        color: 'var(--color-text-primary)',
        backgroundColor: 'var(--color-accent)',
        borderRadius: 'var(--radius-sm)',
        border: 'var(--border-thin)',
        boxShadow: 'var(--shadow-sm)',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      {firstLetter}
    </div>
  );
}
