export default function GalaxyBtn({ children, onClick, type = "button", disabled = false, style = {} }) {
  return (
    <button className="galaxy-btn" type={type} onClick={onClick} disabled={disabled} style={style}>
      <span className="galaxy-btn__stars" />
      <span className="galaxy-btn__content">{children}</span>
    </button>
  );
}
