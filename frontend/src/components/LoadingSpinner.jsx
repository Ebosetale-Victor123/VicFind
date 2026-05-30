export default function LoadingSpinner({ size = 'md' }) {
  const s = size === 'sm' ? 18 : size === 'lg' ? 48 : 28
  const w = size === 'sm' ? 2.5 : size === 'lg' ? 4 : 3
  return (
    <div style={{
      width: s, height: s, borderRadius: '50%',
      border: `${w}px solid rgba(108,99,255,0.2)`,
      borderTopColor: '#6c63ff',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}
