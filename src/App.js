import React, { useState, useCallback } from "react";
import axios from "axios";
import debounce from "lodash/debounce";
import "./App.css";

const API_KEY = "45e6d03e";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debouncedSearchMovies = useCallback(
    debounce(async (query) => {
      if (!query) return;
      setLoading(true);
      setError("");
      setSelectedMovie(null);

      try {
        const response = await axios.get(
          `https://www.omdbapi.com/?s=${query}&apikey=${API_KEY}`
        );

        if (response.data.Response === "True") {
          setMovies(response.data.Search);
        } else {
          setError(response.data.Error);
          setMovies([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearchMovies(value);
  };

  const searchMovies = () => {
    debouncedSearchMovies.cancel(); // Cancel debounce before immediate search
    debouncedSearchMovies(searchTerm);
  };

  const fetchMovieDetails = async (imdbID) => {
    try {
      const response = await axios.get(
        `https://www.omdbapi.com/?i=${imdbID}&apikey=${API_KEY}`
      );
      setSelectedMovie(response.data);
    } catch {
      setError("Could not load movie details");
    }
  };

  return (
    <div className="app-container">
      <h1>Movie Search App</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter movie title..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && searchMovies()}
        />
        <button onClick={searchMovies}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="content-wrapper">
        <div className="movie-list">
          {movies.map((movie) => (
            <div
              key={movie.imdbID}
              className="movie-card"
              onClick={() => fetchMovieDetails(movie.imdbID)}
            >
              <img src={movie.Poster} alt={movie.Title} />
              <p>
                {movie.Title} ({movie.Year})
              </p>
            </div>
          ))}
        </div>

        {selectedMovie && (
          <div className="movie-detail">
            <h2>
              {selectedMovie.Title} ({selectedMovie.Year})
            </h2>
            <p>
              <strong>Actors:</strong> {selectedMovie.Actors}
            </p>
            <p>
              <strong>Plot:</strong> {selectedMovie.Plot}
            </p>
            <img src={selectedMovie.Poster} alt={selectedMovie.Title} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
