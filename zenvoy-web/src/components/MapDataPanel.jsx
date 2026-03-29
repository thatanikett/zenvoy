export default function MapDataPanel({
  open,
  signGroups,
  objectGroups,
  selectedSignGroupIds,
  selectedObjectGroupIds,
  onSelectAllSigns,
  onClearSigns,
  onAddSignGroup,
  onRemoveSignGroup,
  onSelectAllObjects,
  onClearObjects,
  onAddObjectGroup,
  onRemoveObjectGroup,
  onReset,
  onClose,
}) {
  if (!open) return null

  const availableSignGroups = signGroups.filter((group) => !selectedSignGroupIds.includes(group.id))
  const availableObjectGroups = objectGroups.filter((group) => !selectedObjectGroupIds.includes(group.id))

  return (
    <aside style={panelStyle}>
      <div style={headerStyle}>
        <span style={eyebrowStyle}>Map data</span>
      </div>

      <FilterSection
        title="traffic signs"
        groups={signGroups}
        selectedIds={selectedSignGroupIds}
        availableGroups={availableSignGroups}
        onSelectAll={onSelectAllSigns}
        onClear={onClearSigns}
        onAddGroup={onAddSignGroup}
        onRemoveGroup={onRemoveSignGroup}
        accent="rgba(255, 128, 112, 0.16)"
        accentText="#ffb3a8"
      />

      <FilterSection
        title="Show objects"
        groups={objectGroups}
        selectedIds={selectedObjectGroupIds}
        availableGroups={availableObjectGroups}
        onSelectAll={onSelectAllObjects}
        onClear={onClearObjects}
        onAddGroup={onAddObjectGroup}
        onRemoveGroup={onRemoveObjectGroup}
        accent="rgba(76, 182, 255, 0.16)"
        accentText="#a9ddff"
      />

      <div style={footerStyle}>
        <button type="button" onClick={onReset} style={secondaryButtonStyle}>
          Reset
        </button>
        <button type="button" onClick={onClose} style={primaryButtonStyle}>
          Close
        </button>
      </div>
    </aside>
  )
}

function FilterSection({
  title,
  groups,
  selectedIds,
  availableGroups,
  onSelectAll,
  onClear,
  onAddGroup,
  onRemoveGroup,
  accent,
  accentText,
}) {
  const selectedGroups = selectedIds.includes('all')
    ? [{ id: 'all', label: `All ${title.replace('Show ', '').toLowerCase()}` }]
    : groups.filter((group) => selectedIds.includes(group.id))

  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <span style={sectionTitleStyle}>{title}</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onSelectAll} style={pillButtonStyle}>
            Show all
          </button>
          <button type="button" onClick={onClear} style={pillButtonStyle}>
            Hide
          </button>
        </div>
      </div>

      <div style={chipRowStyle}>
        {selectedGroups.length ? selectedGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => onRemoveGroup(group.id)}
            style={{
              ...chipStyle,
              background: accent,
              color: accentText,
              borderColor: accent,
            }}
          >
            {group.label}
            <span style={chipRemoveStyle}>×</span>
          </button>
        )) : (
          <span style={emptyStateStyle}>No filters enabled</span>
        )}
      </div>

      <div style={pickerRowStyle}>
        <div style={selectWrapStyle}>
          <select
            defaultValue=""
            value=""
            onChange={(event) => {
              if (!event.target.value) return
              onAddGroup(event.target.value)
            }}
            style={selectStyle}
          >
            <option value="" disabled>
              {availableGroups.length ? `Select ${title.replace('Show ', '').toLowerCase()}` : 'All options selected'}
            </option>
            {availableGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
          <span style={selectArrowStyle}>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  )
}

const panelStyle = {
  position: 'absolute',
  top: 0,
  left: 'calc(100% + 14px)',
  width: '320px',
  maxWidth: 'min(320px, calc(100vw - 56px))',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
  borderRadius: '22px',
  background: 'rgba(9, 13, 18, 0.94)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 30px 90px rgba(0,0,0,0.42)',
  backdropFilter: 'blur(22px)',
  zIndex: 27,
  animation: 'fadeUp 0.24s ease',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  minHeight: '28px',
}

const eyebrowStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  lineHeight: 1,
  color: 'var(--accent-safe)',
}

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '12px',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.06)',
}

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  flexWrap: 'wrap',
}

const sectionTitleStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-primary)',
}

const chipRowStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  minHeight: '32px',
  alignItems: 'center',
}

const chipStyle = {
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '999px',
  height: '32px',
  padding: '0 10px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
}

const chipRemoveStyle = {
  display: 'inline-grid',
  placeItems: 'center',
  width: '18px',
  height: '18px',
  borderRadius: '999px',
  background: 'rgba(12,16,20,0.44)',
  color: 'currentColor',
  fontSize: '14px',
  lineHeight: 1,
}

const emptyStateStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  color: 'var(--text-muted)',
}

const pickerRowStyle = {
  display: 'flex',
}

const selectWrapStyle = {
  position: 'relative',
  width: '100%',
}

const selectStyle = {
  width: '100%',
  height: '42px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  padding: '0 40px 0 14px',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  colorScheme: 'dark',
}

const selectArrowStyle = {
  position: 'absolute',
  top: '50%',
  right: '14px',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  color: 'var(--text-secondary)',
  pointerEvents: 'none',
}

const pillButtonStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '999px',
  height: '30px',
  padding: '0 10px',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  cursor: 'pointer',
}

const footerStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
}

const secondaryButtonStyle = {
  height: '42px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
}

const primaryButtonStyle = {
  height: '42px',
  borderRadius: '12px',
  border: '1px solid rgba(217,239,146,0.18)',
  background: 'rgba(217,239,146,0.14)',
  color: 'var(--accent-safe)',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
}
