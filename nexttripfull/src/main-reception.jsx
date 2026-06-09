import React from 'react'
import { createRoot } from 'react-dom/client'
import RivieraApp from './riviera-app.jsx'

const root = createRoot(document.getElementById('root'))
root.render(<RivieraApp initialRole="reception" />)
document.getElementById('loading')?.classList.add('hidden')
