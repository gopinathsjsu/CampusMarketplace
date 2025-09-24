import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './App.css'
import Header from "./components/root/fragments/headbar/Header.tsx"

function App() {

  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
