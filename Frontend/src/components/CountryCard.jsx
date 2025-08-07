import React from 'react'

const CountryCard = ({ country }) => {
  return (
    <div className='country-card'>
      <img 
        src={country?.flags?.png || "/fallback.png"} 
        alt={`Flag of ${country?.name?.common || "Unknown"}`} 
        onError={(e) => e.target.src = "/fallback.png"} // falls Bild nicht lädt
      />
      <div>
        <h2>{country?.name?.common || "Unknown Country"}</h2>
        <h5>{country?.cca2 || "--"}</h5>
      </div>
      <h3>{country?.capital?.length ? country.capital.join(", ") : "No Capital"}</h3>
      <h4>Population: {typeof country?.population === "number" ? country.population.toLocaleString("de-DE") : "N/A"}</h4>
      <h4>Area: {typeof country?.area === "number" ? country.area.toLocaleString("de-DE") + " km²" : "N/A"}</h4>
      <h4>Bordering: {Array.isArray(country?.borders) ? country.borders.length : 0}</h4>
      <h4>Freedom Index: {country?.fiw?.Total || "N/A"}<span>/100</span></h4>
    </div>
  )
}

export default CountryCard
