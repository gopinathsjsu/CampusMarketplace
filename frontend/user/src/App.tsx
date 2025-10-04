import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import Header from "./components/header/Header.tsx"
import Listing from "./components/listing"

function App() {
  // Mock listing data for testing
  const mockListingData = {
    listingId: "123",
    userId: "user456",
    description: "Beautiful abstract art piece with vibrant colors",
    timeCreated: new Date(),
    condition: "New",
    photos: [
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop"
    ],
    location: "San Jose",
    price: 5.00,
    sold: false,
    quantity: 1,
    category: ["Art", "Decor"]
  };

  return (
    <Router>
      <div className="App">
        <Header />
        <Listing data={mockListingData} />
        <Routes>
          <Route path="/" element={""} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
