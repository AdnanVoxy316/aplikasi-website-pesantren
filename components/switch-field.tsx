export function SwitchField({
  name,
  label,
  description,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="setting-row">
      <div>
        <span className="setting-name">{label}</span>
        {description ? (
          <span className="setting-description">{description}</span>
        ) : null}
      </div>
      <label className="switch">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          aria-label={label}
        />
        <span className="switch-track" />
      </label>
    </div>
  );
}
