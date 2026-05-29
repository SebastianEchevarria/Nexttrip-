import React from 'react'
import { createRoot } from 'react-dom/client'
import NextTripClientApp from './cliente-app.jsx'

const root = createRoot(document.getElementById('root'))
root.render(<NextTripClientApp />)
document.getElementById('loading')?.classList.add('hidden')
