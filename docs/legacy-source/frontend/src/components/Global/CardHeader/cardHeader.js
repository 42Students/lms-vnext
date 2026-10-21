export default function CardHeader({ title, headerColor, rightContent, variant, headingLevel = 2 }) {
  const useDesignSystem = variant === 'profile';
  return (
    <div
      className={`card-header-row${useDesignSystem ? ' card-header-row--profile' : ''}`}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px' }}
    >
      <div className="card-header-main" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {useDesignSystem ? (
          <span className="card-header-accent" aria-hidden />
        ) : (
          <div style={{ height: '19px', width: '12px', backgroundColor: headerColor, borderRadius: '3px', flexShrink: 0 }}></div>
        )}
        <div
          className={useDesignSystem ? 'card-header-title' : 'ln-lto-reg clrB517'}
          role="heading"
          aria-level={headingLevel}
        >
          {title}
        </div>
      </div>
      {rightContent && <div className="card-header-actions">{rightContent}</div>}
    </div>
  );
}
