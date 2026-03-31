import React from 'react'
import './App.css'

function App() {
  return (
    <div className="container">
      <div className="glow-circle top-left"></div>
      <div className="glow-circle bottom-right"></div>
      
      <main className="content">
        <h2 className="subtitle">Ny nettside kommer</h2>
        <h1 className="title">Bjerkreim <span className="highlight">Lyd & Lys</span></h1>
        <p className="description">
          Vår nye digitale tilstedeværelse er under utvikling. Snart vil du finne all informasjon om våre tjenester innen utleie og teknisk gjennomføring av arrangementer her.
        </p>
        
        <div className="contact">
          <p>Trenger du lyd eller lys til ditt arrangement? Ta kontakt med oss:</p>
          <a href="mailto:post@bjerkreimlydlys.no" className="btn">post@bjerkreimlydlys.no</a>
        </div>
      </main>
    </div>
  )
}

export default App
