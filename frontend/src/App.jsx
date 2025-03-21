import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import Constructor from "./pages/Constructor";
import Catalog from "./components/Catalog";
import Cart from "./components/Cart";
import Login from "./components/Login";
import Register from "./components/Register";
import Contacts from "./components/Contacts";
import About from "./components/About";
import BouquetDetails from "./pages/BouquetDetails";
import Favorites from "./components/Favorites";
import Admin from "./components/Admin";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/bouquet/:id" element={<BouquetDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/about" element={<About />} />
        <Route path="/constructor" element={<Constructor />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
