/* ==========================================================================
   Categories Page Component
   Renders the primary top-level grid of photo categories (e.g., Birds, Mammals).
   Acts as the main entry point for users to drill down into specific galleries.
   ========================================================================== */

import { FolderOpen } from 'lucide-react';
import BlurImage from '../components/BlurImage';

export default function CategoriesPage({ 
    categories, // Array of category objects pre-fetched in App.js
    loadCategoryData, // Async function to fetch full photo manifests when a folder is clicked
    setSelectionStack, // State setter to push the new folder onto the breadcrumb trail
    NO_IMAGE_SVG // Fallback placeholder image for empty/broken thumbnails
  }) {
  return (
    <div className="category-grid">
      {categories.map((category) => (
        <div
          key={category.id}
          className="category-card"
          onClick={async () => {
            try {
              const loaded = await loadCategoryData(category);
              if (loaded) {
                // 2. Flag this node so the `goBack` function in App.js 
                // tracks that this navigation path originated from the Categories page.
                loaded.__from = 'categories';
              }

              // 3. Push the loaded data into the navigation stack to trigger a re-render 
              // into either a subcategory grid or a photo gallery.
              setSelectionStack(prev => [...prev, loaded]);
            } catch (err) {
              console.error('Failed to load category', category.id, err);
            } finally {
            }
          }}
        >
          {/* --- Card Thumbnail --- */}
          <div className="category-image-wrapper">
          <BlurImage
            // Tries the explicitly tagged thumbnail first,
            // then falls back to the first nested subcategory's thumbnail if the 
            // parent folder doesn't have a direct image.
            src={category.thumbnail?.secure_url || category.subcategories?.[0]?.thumbnail?.secure_url}
            alt={category.name}
            className="category-image"
            fallback={NO_IMAGE_SVG}
          />
            {/* Overlay badge indicating if this folder acts as a directory for more folders */}
            {category.subcategories && (
              <div className="subcategory-badge">
                <FolderOpen size={16} />
                <span>{category.subcategories.length} subcategories</span>
              </div>
            )}
          </div>
      
          {/* --- Card Details --- */}
          <div className="category-content">
            <h2 className="category-name">{category.name}</h2>
            {/* Displays the summed total of all photos inside this folder and its subfolders */}
            <p className="category-count">{category.totalCount} photos</p>
          </div>
        </div>
      ))}
    </div>
  );
}