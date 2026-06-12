/* ==========================================================================
   BlurImage Component
   A highly optimized, progressive-loading image component.
   Uses Cloudinary URL transformations to generate a tiny placeholder background,
   then smoothly crossfades to the high-res image once downloaded.
   ========================================================================== */

import React, { useEffect, useRef } from 'react';
import '../gallery.css';

export default function BlurImage({ 
    src, // Original high-res image URL (expected to be a Cloudinary URL)
    alt, // Accessibility text
    className, // Classes applied directly to the <img> tag
    wrapperClassName, // Classes applied to the outer container
    fallback // SVG or base64 image to display if src is missing or fails to load
  }) {
  // Refs to directly manipulate DOM elements for the loading transition
  const imgRef = useRef(null);
  const wrapperRef = useRef(null);

  // 1. Ensure we always have a valid string to pass to the main img element
  const safeSrc = src || fallback;

  // 2. Generate the ultra-low-res (20px width) placeholder for the blur effect.
  // We do this by intercepting the Cloudinary URL path and injecting resize parameters.
  const placeholderSrc = src
    ? src.replace('/upload/', '/upload/w_20,f_auto,q_auto/')
    : fallback;

  // 3. Catch cached images. If the browser already has this high-res image downloaded, 
  // the standard onLoad event might not fire. This manually triggers the transition.
  useEffect(() => {
    if (imgRef.current?.complete) {
      wrapperRef.current?.classList.add('loaded');
    }
  }, [src]); // Re-run check if the source URL changes

  return (
    <div
      ref={wrapperRef}
      className={`blur-image-wrapper ${wrapperClassName || ''}`}
      style={{
        // The tiny placeholder is set as a background. CSS handles the blur filter animation.
        backgroundImage: `url(${placeholderSrc})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <picture>
        {/* Responsive Picture Element 
          We only render these modern format sources if a valid Cloudinary 'src' exists. 
          If it's falling back to the base64 SVG, we skip these so .replace() doesn't crash the app.
        */}
        <source type="image/avif" srcSet={`
            ${src.replace('/upload/', '/upload/w_400,f_avif,q_auto:good/')} 400w,
            ${src.replace('/upload/', '/upload/w_800,f_avif,q_auto:good/')} 800w,
            ${src.replace('/upload/', '/upload/w_1600,f_avif,q_auto:good/')} 1600w
            `}
        />
        <source type="image/webp" srcSet={`
            ${src.replace('/upload/', '/upload/w_400,f_webp,q_auto:good/')} 400w,
            ${src.replace('/upload/', '/upload/w_800,f_webp,q_auto:good/')} 800w,
            ${src.replace('/upload/', '/upload/w_1600,f_webp,q_auto:good/')} 1600w
            `}
        />
        <img
          ref={imgRef}
          // Base image fallback for older browsers or standard loading
          src={safeSrc.replace('/upload/', '/upload/w_800,f_auto,q_auto:good/')}
          alt={alt}
          // The 'sizes' attribute tells the browser how much screen width the image will take up 
          // at different breakpoints, allowing it to choose the optimal file size from the srcSet above.
          sizes="
            (max-width: 480px) calc(100vw - 1rem),
            (max-width: 1024px) calc(50vw - 2rem),
            700px
          "
          className={`blur-image ${className || ''}`}
          loading="lazy"

          // Reveal the high-res image once the network request finishes
          onLoad={(e) => e.currentTarget.closest('.blur-image-wrapper').classList.add('loaded')}
          
          // Failsafe: If the network drops or Cloudinary throws a 404, swap to the fallback SVG
          onError={(e) => {
              e.target.onerror = null;
              e.target.src = fallback;
              e.currentTarget.closest('.blur-image-wrapper').classList.add('loaded');
          }}
        />
      </picture>
    </div>
  );
}