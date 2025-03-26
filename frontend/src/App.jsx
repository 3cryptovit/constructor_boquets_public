import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./components/HomePage";
import Catalog from "./components/Catalog";
import Constructor from "./components/Constructor";
import Cart from "./components/Cart";
import Login from "./components/Login";
import Register from "./components/Register";
import Contacts from "./components/Contacts";
import About from "./components/About";
import BouquetDetails from "./pages/BouquetDetails";
import Favorites from "./components/Favorites";
import AdminPanel from "./pages/Admin/AdminPanel";

function App() {
  return (
    <Router>
      <Layout>
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
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
