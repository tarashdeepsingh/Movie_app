import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  const [listening, setListening] = useState(false);
  const [theme, setTheme] = useState("dark");

  // Update body class for theme
  useEffect(() => {
    document.body.className = theme === "light" ? "light-mode" : "";
  }, [theme]);

  // Debounced search function
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

  // Speech Recognition setup
  const recognition = useMemo(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = "en-US";

    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      debouncedSearchMovies(transcript);
    };

    recog.onerror = (event) => {
      console.error(event.error);
      setError("Speech recognition error");
      setListening(false);
    };

    recog.onend = () => {
      setListening(false);
    };

    return recog;
  }, [debouncedSearchMovies]);

  const handleVoiceClick = () => {
    if (!recognition) {
      setError("Speech recognition not supported in this browser");
      return;
    }
    if (listening) {
      recognition.stop();
    } else {
      setError("");
      setListening(true);
      recognition.start();
    }
  };

  useEffect(() => {
    // Load default movies on initial render (simulate trending)
    debouncedSearchMovies("Avengers");
  }, [debouncedSearchMovies]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearchMovies(value);
  };

  const searchMovies = () => {
    debouncedSearchMovies.cancel();
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
      <div className="top-bar">
        <h1>Movie Search App</h1>
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="theme-toggle">
          {theme === "light" ? "🔆 Dark Mode" : "🌙 Light Mode"}
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter movie title..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && searchMovies()}
        />
        <button onClick={searchMovies}>Search</button>
        <button onClick={handleVoiceClick} className="voice-button">
          {listening ? "🔴 Stop" : "🎤 Speak"}
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        {searchTerm ? "Search Results" : "Trending Movies"}
      </h2>

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