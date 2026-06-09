import React from 'react'
import { createRoot } from 'react-dom/client'
import DriverDesktopApp from './driver-desktop-app.jsx'

const root = createRoot(document.getElementById('root'))
root.render(<DriverDesktopApp />)
document.getElementById('loading')?.classList.add('hidden')
