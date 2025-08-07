import React from 'react'

const CityCard = ({city}) => {
  return (
    <div className='country-card'>
      <div className="citySign">
        <span>{city?.ascii_name ? city.ascii_name : "Unknown"}</span>
      </div>

      <div>
        <h2>{city?.name ? city.name : "Unknown City"}</h2>
        <h5>{city?.country_code ? city.country_code : "--"}</h5>
      </div>

      <h3>{city?.cou_name_en ? city.cou_name_en : "No Country Name"}</h3>
      <h4>
        Population: {typeof city?.population === "number" 
          ? city.population.toLocaleString("de-DE") 
          : "N/A"}
      </h4>
      <h4>latitude: {city?.lat ? city.lat : "N/A"}</h4>
      <h4>longitude: {city?.lon ? city.lon : "N/A"}</h4>
    </div>

  )
}

export default CityCard