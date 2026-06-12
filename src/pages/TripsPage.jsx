/* ==========================================================================
   Trips Page Component
   Renders the top-level grid of vacation/trip folders.
   Acts as an entry point into the nested folder structure, passing
   rendering duties off to the Categories page once a folder is selected.
   ========================================================================== */

import { FolderOpen } from 'lucide-react';
import BlurImage from '../components/BlurImage';

export default function TripsPage({ 
    VACATION_GROUPS, // Array of root-level vacation folders defined in App.js
    vacationMeta, // Pre-fetched dictionary of { thumbnail, totalCount } keyed by group.id
    loadCategoryData, // Async function to fetch full photo manifests
    setSelectionStack, // State setter to push the new folder onto the breadcrumb trail
    setPage, // Router function to switch active views
    NO_IMAGE_SVG // Fallback placeholder image
  }) {
  return (
    <div className="vacations-page">
      <h2 className="section-title">Trips</h2>
      <div className="category-grid">
        {VACATION_GROUPS.map((group) => (
          <div
            key={group.id}
            className="category-card"
            onClick={async () => {
              try {
                // 1. Create a shallow copy of the group to avoid mutating the original constant
                const catObj = { ...group };

                // 2. Fetch the heavy photo manifest for this specific trip
                const loaded = await loadCategoryData(catObj);
                if (loaded) {
                  // 3. IMPORTANT: Flag this node so the `goBack` function in App.js 
                  // knows to return to the 'trips' page when we pop this off the stack, 
                  // rather than dumping the user into the standard 'categories' page.
                  loaded.__from = 'trips';
                }

                // 4. Push the loaded data into the navigation stack
                setSelectionStack(prev => [...prev, loaded]);

                // 5. Hand off UI rendering to the generic Categories view
                setPage('categories');
              } catch (err) {
                alert(`Failed to load ${group.name}: ${err.message || err}`);
              } finally {
              }
            }}
          >
            {/* --- Card Thumbnail --- */}
            <div className="category-image-wrapper">
              <BlurImage
                // Pulls the pre-fetched thumbnail from App.js metadata state
                src={vacationMeta[group.id]?.thumbnail?.secure_url}
                alt={group.name}
                className="category-image"
                fallback={NO_IMAGE_SVG}
              />
              {/* Overlay badge indicating if this trip contains nested subfolders */}
              {group.subcategories && (
                <div className="subcategory-badge">
                  <FolderOpen size={16} />
                  <span>{group.subcategories.length} subcategories</span>
                </div>
              )}
            </div>

            {/* --- Card Details --- */}
            <div className="category-content">
              <h2 className="category-name">{group.name}</h2>
              <p className="category-count">
                {/* 
                  handles the brief moment before vacationMeta finishes 
                  fetching on initial app load, and properly pluralizes the result 
                */}
                {vacationMeta[group.id]?.totalCount === undefined
                  ? '...'
                  : `${vacationMeta[group.id].totalCount} ${vacationMeta[group.id].totalCount === 1 ? 'photo' : 'photos'}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}