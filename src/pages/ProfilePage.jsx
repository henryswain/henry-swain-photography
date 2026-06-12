/* ==========================================================================
   Profile Page Component
   Renders the photographer's "About Me" section, bio, and a responsive, 
   progressive-loading profile photo.
   ========================================================================== */

import { useRef, useEffect } from "react";

/* --- Asset Pathing Helpers --- */
// Extracts the base URL defined in Vite config
const base = import.meta.env.BASE_URL;

/**
 * Utility to compute reliable public asset paths.
 * Ensures that whether the base URL has a trailing slash or not, 
 * the resulting path is formatted correctly without double slashes.
 */
const asset = (path) =>
  `${base.replace(/\/$/, '')}/${path}`.replace(/\/\//g, '/');



export default function ProfilePage() {
  /* --- State & Refs --- */
  // Refs to directly access DOM elements for the progressive loading effect
  const imgRef = useRef(null);
  const wrapperRef = useRef(null);

  /* --- Lifecycle Hooks --- */
  // Handles the edge case where the image is already cached by the browser.
  // If it loads before the component mounts, the standard onLoad event won't fire,
  // so we manually check and apply the 'loaded' class to remove the blur wrapper.
  useEffect(() => {
    if (imgRef.current?.complete) {
      wrapperRef.current?.classList.add('loaded');
    }
  }, []);

  return (
    <div className="profile-page">
      <h2 className="section-title">About Me</h2>
      <div className="profile-grid">
        <div className="profile-photo">
          {/* Wrapper acts as a placeholder while the image loads.
            Applying the 'loaded' class transitions opacity for a smooth reveal.
          */}
          <div
            ref={wrapperRef}
            className="blur-image-wrapper"
            style={{ backgroundColor: '#e0e0e0' }}
          >
            {/* Responsive Picture Element
              Serves next-gen formats (AVIF, WebP) to supported browsers, 
              falling back to standard JPEG. Uses responsive breakpoints (300w, 600w, 960w) 
              so mobile devices don't download unnecessarily large files.
            */}
            <picture>
              <source
                type="image/avif"
                srcSet={`
                  ${asset('assets/profile-300w.avif')} 300w,
                  ${asset('assets/profile-600w.avif')} 600w,
                  ${asset('assets/profile-960w.avif')} 960w
                `}
                sizes="(max-width: 480px) 100vw, 300px"
              />
              <source
                type="image/webp"
                srcSet={`
                  ${asset('assets/profile-300w.webp')} 300w,
                  ${asset('assets/profile-600w.webp')} 600w,
                  ${asset('assets/profile-960w.webp')} 960w
                `}
                sizes="(max-width: 480px) 100vw, 300px"
              />
              <img
                ref={imgRef}
                src={asset('assets/profile-600w.jpg')}
                srcSet={`
                  ${asset('assets/profile-300w.jpg')} 300w,
                  ${asset('assets/profile-600w.jpg')} 600w,
                  ${asset('assets/profile-960w.jpg')} 960w
                `}
                sizes="(max-width: 480px) 100vw, 300px"
                alt="Profile"
                className="blur-image profile-image"
                // Trigger the reveal animation once the network request finishes
                onLoad={(e) => e.currentTarget.closest('.blur-image-wrapper').classList.add('loaded')}
                onError={(e) => {
                  e.target.onerror = null;
                  e.currentTarget.closest('.blur-image-wrapper').classList.add('loaded');
                }}
              />
            </picture>
          </div>
        </div>

        {/* --- Biography Section --- */}
        <div className="profile-bio">
          <p>
            My name is Henry and I completed my B.A. in Informatics and minor in Computer Science 
            from the University of Iowa with University Honors in May 2026. Over the past few years, I’ve developed
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
            While my primary birding location may change when 
            I land a career - I plan on moving to wherever I can get hired - I hope
             to continue to get outside into nature to improve my skills as a bird
              and wildlife photographer enthusiast.
          </p>
        </div>
      </div>
    </div>
  );
}
