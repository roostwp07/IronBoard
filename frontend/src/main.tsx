import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'  // automatically apply CSS styles globally to the entire app
import App from './App.tsx'

/*
* `document` is the whole page
* `document.getElementById('root')` returns the empty container initialized in @index.html
* `createRoot` gives React control of the container
* .render(...) populates the container, in this case with whatever is displayed by invoking the App() function
*/

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
