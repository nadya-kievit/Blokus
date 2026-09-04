function Header({ gameId, isQuitting, onCopyInvite, onQuit }) {
	return (
		<header className="gameHeader">
			<div className="gameBrand">
				<h1 className="gameTitle gameHeaderTitle">
					Blokit
				</h1>
			</div>

			<div className="gameActions">
				<div className="headerCode">
					Code <strong>{gameId}</strong>
				</div>

				<button
					className="headerActionButton copyButton"
					onClick={onCopyInvite}
				>
					<svg aria-hidden="true" viewBox="0 0 24 24">
						<rect x="8" y="8" width="11" height="11" rx="2" />
						<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
					</svg>

					Copy Code
				</button>

				<button
					className="headerActionButton dangerButton"
					onClick={onQuit}
					disabled={isQuitting}
				>
					<svg aria-hidden="true" viewBox="0 0 24 24">
						<path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
						<path d="M14 8l4 4-4 4M9 12h9" />
					</svg>

					{isQuitting ? 'Quitting...' : 'Quit Game'}
				</button>
			</div>
		</header>
	)
}

export default Header
