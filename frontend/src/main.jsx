import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GlobalStyles } from '@mui/material'
import { globalGameStyles } from './gameStyles'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<GlobalStyles styles={globalGameStyles} />
		<App />
	</StrictMode>
)
