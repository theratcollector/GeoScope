import React from 'react'

const Search = (props) => {
  return (
    <div>
        <div className='search'>
            <img src="search.png" alt="search" />
            <input type='text' spellCheck="false" placeholder='Search for something...' value={props.SearchTerm} onChange={(e) => props.setSearchTerm(e.target.value)}></input>
        </div>
    </div>
  )
}

export default Search