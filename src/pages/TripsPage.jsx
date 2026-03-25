import React from 'react';
import { FolderOpen } from 'lucide-react';

// TripsPage
// - Renders a grid of vacation/trip groups defined in VACATION_GROUPS.
// - Props:
//   - VACATION_GROUPS: array of group objects (id, name, folder, optional subcategories)
//   - vacationMeta: precomputed thumbnail and totalCount for each group
//   - loadCategoryData: function to load a group's subcategories or manifest
//   - setCategoryLoading: toggle loading overlay while fetching
//   - setSelectionStack: push the loaded group to the selection stack so the Categories UI can render it
//   - setPage: used to switch the top-level page to 'categories' after opening a group
export default function TripsPage({ VACATION_GROUPS, vacationMeta, loadCategoryData, setCategoryLoading, setSelectionStack, setPage }) {
  return (
    <div className="vacations-page">
      <h2 className="section-title">Trips</h2>
      <div className="category-grid">
        {VACATION_GROUPS.map((group) => (
          <div
            key={group.id}
            className="category-card"
            onClick={async () => {
              // When a trip card is clicked we load its data and push it onto the selection stack.
              // Mark the loaded node with __from = 'trips' so back-navigation and nav active
              // state can restore the Trips page when appropriate.
              setCategoryLoading(true);
              try {
                const catObj = { ...group };
                const loaded = await loadCategoryData(catObj);
                if (loaded) loaded.__from = 'trips';
                setSelectionStack(prev => [...prev, loaded]);
                // Switch to the Categories page which renders the nested subcategories / gallery
                setPage('categories');
              } catch (err) {
                // Surface a minimal UI error for the user — errors are also logged by loadCategoryData
                alert(`Failed to load ${group.name}: ${err.message || err}`);
              } finally {
                setCategoryLoading(false);
              }
            }}
          >
            <div className="category-image-wrapper">
              {/* Choose a group thumbnail (prefer vacationMeta) and fallback to a placeholder */}
              <img src={vacationMeta[group.id]?.thumbnail?.secure_url || '/assets/profile-placeholder.png'} alt={group.name} className="category-image" />
              {group.subcategories && (
                <div className="subcategory-badge">
                  <FolderOpen size={16} />
                  <span>{group.subcategories.length} subcategories</span>
                </div>
              )}
            </div>
            <div className="category-content">
              <h2 className="category-name">{group.name}</h2>
              <p className="category-count">{vacationMeta[group.id]?.totalCount === undefined ? '...' : `${vacationMeta[group.id].totalCount} ${vacationMeta[group.id].totalCount === 1 ? 'photo' : 'photos'}`}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
