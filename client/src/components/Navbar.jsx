export default function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">Sweety</span>
        {user && (
          <div className="nav-user">
            <span>Hi, {user.name}</span>
            <button type="button" className="btn btn-secondary btn-small" onClick={onLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
