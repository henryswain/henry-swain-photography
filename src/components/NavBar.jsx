import React from 'react';

// NavBar: shows two top-level tabs (Categories, Trips). The Trips tab stays visually
// active while the user is drilling into a trip group (selectionStack entries mark their origin).
export default function NavBar({ page, setPage, selectionStack, setSelectionStack }) {
  // determine whether any active selection originated from the Trips page
  const fromTrips = selectionStack && selectionStack.some && selectionStack.some(entry => entry && entry.__from === 'trips');
  const isTripsActive = page === 'trips' || fromTrips;
  const isCategoriesActive = page === 'categories' && !fromTrips;
  // Note: Profile is navigated via the main heading; not a separate nav button anymore.
  const isProfileActive = page === 'profile';

  return (
    <nav className="site-nav">
      <button className={`nav-button ${isCategoriesActive ? 'active' : ''}`} onClick={() => { setPage('categories'); setSelectionStack([]); }}>
        Categories
      </button>
      <button className={`nav-button ${isTripsActive ? 'active' : ''}`} onClick={() => { setPage('trips'); setSelectionStack([]); }}>
        Trips
      </button>
    </nav>
  );
}
