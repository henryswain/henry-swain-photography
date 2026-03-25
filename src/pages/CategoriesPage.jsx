// CategoriesPage: renders the top-level categories grid
// - Small, focused component intended to keep the main App file concise
// - Responsible for loading categories when clicked and pushing results to selectionStack

import React from 'react';
import { FolderOpen } from 'lucide-react';

// CategoriesPage: renders the top-level category grid. Clicking a card loads the
// selected category (via loadCategoryData) and pushes it onto the selectionStack.
export default function CategoriesPage({ categories, loadCategoryData, setCategoryLoading, setSelectionStack, NO_IMAGE_SVG }) {
  return (
    <div className="category-grid">
      {categories.map((category) => (
        <div
          key={category.id}
          className="category-card"
          onClick={async () => {
            // Load the category manifest (or nested summary) and push it onto the stack
            setCategoryLoading(true);
            try {
              const loaded = await loadCategoryData(category);
              if (loaded) loaded.__from = 'categories';
              setSelectionStack(prev => [...prev, loaded]);
            } catch (err) {
              console.error('Failed to load category', category.id, err);
            } finally {
              setCategoryLoading(false);
            }
          }}
        >
          <div className="category-image-wrapper">
            <img
              // Prefer explicit thumbnail, otherwise try the first nested thumbnail, otherwise show placeholder
              src={category.thumbnail?.secure_url || category.subcategories?.[0]?.thumbnail?.secure_url || NO_IMAGE_SVG}
              alt={category.name}
              className="category-image"
              loading="lazy"
              onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE_SVG; }}
            />
            {category.subcategories && (
              <div className="subcategory-badge">
                <FolderOpen size={16} />
                <span>{category.subcategories.length} subcategories</span>
              </div>
            )}
          </div>
          <div className="category-content">
            <h2 className="category-name">{category.name}</h2>
            <p className="category-count">{category.totalCount} photos</p>
          </div>
        </div>
      ))}
    </div>
  );
}
