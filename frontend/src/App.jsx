import { useState, useEffect } from 'react'
import React from 'react'
import Search from './components/Search.jsx'
import CountryCard from './components/CountryCard.jsx'
import { useDebounce } from 'use-debounce';
import CityCard from './components/CityCard.jsx'

const API_BASE_URL_OLD = "https://restcountries.com/v3.1"
const API_BASE_URL = "http://localhost:3000"; // Updated to match the backend server

const App = () => {

  const [searchTerm, setsearchTerm] = useState("");
  const [countryList, setcountryList] = useState([]) 
  const [isLoading, setisLoading] = useState(false)
  const [cityList, setcityList] = useState([])

  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const fetchCountries = async (query = "") => {
    try{
      setisLoading(true);
      console.log("fetching countries with query:", encodeURIComponent(query));

      const endpoint = query ? `${API_BASE_URL}/countries/search?q=${encodeURIComponent(query)}` : `${API_BASE_URL}/countries/random?limit=9`;
      const response = await fetch(endpoint);
      
      if(!response.ok) {
        throw new Error("Failed to fetch countries");
      }

      const data = await response.json();
      setcountryList(data || []);
      console.log("Countries fetched successfully:", data);

    }catch(error){
      console.error("Error fetching countries:", error);
    }finally{
      setisLoading(false);
    }
  }

  const fetchCities = async (query = "") => {
    try {
      setisLoading(true);
      const endpoint = query ? `${API_BASE_URL}/cities/search/?q=${encodeURIComponent(query)}` : `${API_BASE_URL}/cities/random`;
      console.log("Fetching cities with endpoint:", endpoint);
      const response = await fetch(endpoint);

      if(!response.ok) {
        throw new Error("Failed to fetch cities");
      }

      const data = await response.json();
      console.log("Cities fetched successfully:", data);
      setcityList(data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }finally{
      setisLoading(false);
    }
  }

  useEffect(() => {
    fetchCountries(debouncedSearchTerm);
    fetchCities(debouncedSearchTerm);
  }, [debouncedSearchTerm])
  

  return (
    <main>
      <div className='menu-bar'><img src='logo.png' alt='GeoScope Logo'></img></div>
      <div className='nav-icons'>
        <img src="games.png" alt='Games' title='Games'/>
        <img src="explore.png" alt='Explore/Community' title='Explore/Community'/>
        <img src="profile.png" alt='Profile' title="Profile"/>
      </div>
      <div className='pattern'/>
      <header>
        <h1 className='hero-text'>Discover the <span className='highlight-text'>World</span> one<br/> country at a time.</h1>
        <Search searchTerm={searchTerm} setSearchTerm={setsearchTerm}></Search>
      </header>
      <section className='country-list'>
        <div className='separator-container'>
          <h2 className='title-section'>Countries</h2>
          <div className='separator'></div>
          <div className='result-container'>
            <h3 className='result-text'>Results: {countryList.length}</h3>
            <div className='filter-btn'><img src='filter.png' alt='filter icon'/><p>Filter</p></div>
          </div>
        </div>
        {isLoading ? (
          <p>Loading...</p>) : (
            <ul>{countryList.map((country) => (
              <CountryCard key={country.cca3} country={country}></CountryCard>
            ))}</ul>
          )
        }
      </section>
      <section className='city-list'>
        <div className='separator-container'>
          <h2 className='title-section'>Cities</h2>
          <div className='separator'></div>
          <div className='result-container'>
            <h3 className='result-text'>Results: {cityList.length}</h3>
            <div className='filter-btn'><img src='filter.png' alt='filter icon'/><p>Filter</p></div>
          </div>
        </div>
        {isLoading ? (
          <p>Loading...</p>) : (
            <ul>{cityList.map((city) => (
              <CityCard key={city.name} city={city}></CityCard>
            ))}</ul>
          )
        }
      </section>
      <footer>
        <div className="footer-left">
          <img src="logo.png" alt="GeoScope Logo" />
          <p>Made with ❤️ by <a href="#">Daniel Meyer</a></p>
        </div>

        <div className="footer-right">
          <nav>
            <a href="https://buymeacoffee.com/danielmeyer" target='blank' className="coffee-link">Buy me a coffee ⋆.˚☕︎</a><br/>
            <a href="/imprint">Impressum</a>
            <a href="/privacy">Datenschutz</a>
          </nav>
          <p>© {new Date().getFullYear()} GeoScope. All rights reserved.</p>
        </div>
      </footer>

    </main>
  )
}



export default App