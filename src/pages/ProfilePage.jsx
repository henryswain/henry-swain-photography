// ProfilePage: renders the photographer's profile photo and bio
// - Uses Vite's BASE_URL to compute public asset paths so the app works when deployed at a subpath
// - Provides an inline SVG fallback if the profile image cannot be loaded

import React from 'react';

// compute profile image URL using Vite's base path so assets resolve when site base is non-root
let PROFILE_SRC = '/assets/profile.jpg';
try {
  const base = (import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
  // If the site is hosted at /henry-swain-photography/ we need to prefix that base
  PROFILE_SRC = `${base.replace(/\/$/, '')}/assets/profile.jpg`.replace(/\/\//g, '/');
} catch (e) {
  PROFILE_SRC = '/assets/profile.jpg';
}

// The PROFILE_FALLBACK is a tiny inline SVG used when the external image fails to load.
// This ensures the layout remains stable and provides a clear visual placeholder.
// Reference: https://css-tricks.com/using-svg/ (see "Data URI" section)
const PROFILE_FALLBACK = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width:100%;height:auto;">
  <circle cx="50" cy="30" r="20" fill="#ccc" />
  <rect x="15" y="60" width="70" height="30" rx="5" ry="5" fill="#ccc" />
</svg>
`;

export default function ProfilePage() {
  return (
    <div className="profile-page">
      <h2 className="section-title">About Me</h2>
      <div className="profile-grid">
        <div className="profile-photo">
          <img src={PROFILE_SRC} alt="Profile" className="profile-image" onError={(e) => { e.target.onerror = null; e.target.src = `data:image/svg+xml;base64,${btoa(PROFILE_FALLBACK)}`; }} />
        </div>
        <div className="profile-bio">
          <p>
            My name is Henry and I’m about to graduate from the University of 
            Iowa with a BA in Informatics. Over the past few years, I’ve developed
            a strong interest in nature and wildlife photography, with a focus 
            on birds.  
          </p>
          <p>
            As a college student, I haven’t had the money to purchase a high quality 
            mirrorless camera like many other professional photographers do. Instead,
             I purchased the Panasonic Lumix DMC-FZ300 - which has 12mp and 
             an equivalent focal length of 25-600mm. While this is by no means a 
             great camera, it has worked in a pinch for my needs as an amateur 
             photographer.
          </p>
          <p>
            While most of my time in the photography field has been spent locally
             around Iowa City - places like Terry Trueblood, Hickory Hill Park, 
             Waterworks Prairie park, Hawkeye Wildlife Management Area, 
             and Cones Marsh - I have traveled for trips to Yellow River State Forest
              in northeast Iowa, Sleeping Bear Dunes in northern Michigan, 
              Sax Zim Bog in northern Minnesota, and most recently, 
              southern Louisiana to the Cypress Swamps on special occasions.
          </p>
          <p>
            While my primary birding location may change post graduation when 
            I land a career - I plan on moving to wherever I can get hired - I hope
             to continue to get outside into nature to improve my skills as a bird
              and wildlife photographer enthusiast.
          </p>
        </div>
      </div>
    </div>
  );
}
