import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Register from './myapp/Register';
import Login from './myapp/Login';
import Dashboard from './myapp/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null); // New state for JWT token

  // Check for stored login state and token on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('token'); // Retrieve token
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      setToken(storedToken); // Set token
      setIsLoggedIn(true);
    }
  }, []);

  // Function called on successful login from Login component
  const handleLoginSuccess = (user, receivedToken) => {
    setCurrentUser(user);
    setToken(receivedToken); // Store the received token
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', receivedToken); // Store token in localStorage
  };

  // Function to handle user logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setToken(null); // Clear token
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token'); // Remove token from localStorage
  };

  const [authPage, setAuthPage] = useState('login');

  return (
    <div className="App">
      {isLoggedIn ? (
        // Pass the token to the Dashboard component
        <Dashboard user={currentUser} token={token} onLogout={handleLogout} />
      ) : (
        authPage === 'login' ? (
          <Login onLoginSuccess={handleLoginSuccess} onNavigate={() => setAuthPage('register')} />
        ) : (
          <Register onNavigate={() => setAuthPage('login')} />
        )
      )}
    </div>
  );
}

export default App;















{/*
import React, { useState } from 'react';
import './App.css'; // Your App's CSS
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

import Register from './registration/Register'; // Import the Register component
import Login from './registration/Login';       // Import the Login component

function App() {
  // State to manage which component is currently displayed
  const [currentPage, setCurrentPage] = useState('register'); // Default to 'register'

  // Function to navigate between components
  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="App">  */}
      {/* Conditionally render Register or Login component based on currentPage state */}
    
    {/*  {currentPage === 'register' ? (
        <Register onNavigate={handleNavigate} />
      ) : (
        <Login onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default App;


*/}







{ /*import React from 'react';
import './App.css';
import {BrowserRouter, Routes,Route} from 'react-router-dom'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import Footer from './components/navbars/Footer';
import HeadNavBar from './components/navbars/HeadNavBar';
import SideNavBar from './components/navbars/SideNavBar';
import Register from './registration/Register';
import Login from './registration/Login';
{/*import Login from './components/Login';
  import Register from './components/Register';
import AddBook from './components/AddBook';
import ViewBooks from './components/ViewBooks';
import DeleteBook from './components/DeleteBook';
import DashBoard from './components/DashBoard';
import Layout from './components/Layout';
import NoPage from './components/NoPage';






function App() {
  return (
    
    <BrowserRouter>
    <HeadNavBar/>
    <Footer/>
    <SideNavBar>
    <Routes>
      <Route path="/" element={<Layout/>} />
      <Route index element={<Login/>} />
      <Route path="Register" element={<Register/>} /> 
      <Route path="DashBoard" element={<DashBoard/>} />
      <Route path="SideNavBar" element={<SideNavBar/>} />
      <Route path="HeadNavBar" element={<HeadNavBar/>} />
      <Route path="Footer" element={<Footer/>} />
      <Route path="*" element={<NoPage/>} />
      <Route path="AddBook" element={<AddBook/>} />
      <Route path="ViewBooks" element={<ViewBooks/>} />
      <Route path="DeleteBook" element={<DeleteBook/>} />
      <Route path="Register" element={<Register/>} />
      <Route path="Login" element={<Login/>} />


    </Routes>
    </SideNavBar>
    </BrowserRouter>
  );
};

export default App;
*/}




