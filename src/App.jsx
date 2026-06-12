/* ==========================================================================
   Main Application Entry Point
   Handles routing (via state), data fetching, navigation stack, 
   gallery rendering, and fullscreen lightbox functionality.
   ========================================================================== */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { X, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import './gallery.css';
import './App.css';
import NavBar from './components/NavBar';
import TripsPage from './pages/TripsPage';
import BlurImage from './components/BlurImage';
import ProfilePage from './pages/ProfilePage';
import CategoriesPage from './pages/CategoriesPage';
 
/* --- Constants & Configuration --- */

// Inline "no picture" SVG (encoded) — used as a lightweight fallback when images fail to load
const NO_IMAGE_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e6e6e6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';

// Environment targets for API requests

const API_BASE_PATH = 'https://henry-swain-photography-backend.vercel.app';
// const API_BASE_PATH = 'http://localhost:3000'
// const API_BASE_PATH = "http://172.17.178.59:3000";
// const API_BASE_PATH = "http://192.168.1.15:3000";


/**
 * Cleans up Cloudinary filenames for UI display.
 * Removes random alphanumeric suffixes and converts underscores to spaces.
 * Example: "red_tailed_hawk_a1b2c3" -> "red tailed hawk"
 */
function cleanDisplayName(displayName) {
  if (!displayName) return '';
  const withoutSuffix = displayName.replace(/_[a-zA-Z0-9]{6}$/, '');
  return withoutSuffix.replace(/_/g, ' ');
}

// Hierarchical definition of photo categories and subcategories
const PHOTO_CATEGORIES = [
  {
    id: 'birds',
    name: 'Birds',
    folder: 'birds',
    subcategories: [
      { id: 'blackbirds', name: 'Blackbirds', folder: 'birds/blackbirds' },
      { id: 'cardinals_grosebeaks_allies', name: 'Cardinals, Grosebeaks, and Allies', folder: 'birds/cardinals_grosebeaks_allies' },
      { id: 'finches', name: 'Finches', folder: 'birds/finches' },
      { id: 'flycatchers', name: 'Flycatchers', folder: 'birds/flycatchers' },
      { id: 'game_birds', name: 'Game birds', folder: 'birds/game_birds' },
      { id: 'miscellaneous_others', name: 'Miscellaneous others...', folder: 'birds/miscellaneous_others' },
      { id: 'raptors', name: 'Raptors', folder: 'birds/raptors', subcategories: [
        { id: 'other_raptors', name: 'Other Raptors', folder: 'birds/raptors/other_raptors'},
        { id: 'owls', name: 'Owls', folder: 'birds/raptors/owls'},
        { id: 'eagles', name: 'Eagles', folder: 'birds/raptors/eagles'}
      ]
      },
      { id: 'shorebirds_herons_cranes', name: 'Shore birds, Herons, Cranes', folder: 'birds/shorebirds_herons_cranes', subcategories: [
        { id: 'roseate_spoonbills', name: 'Roseate Spoonbills', folder: 'birds/shorebirds_herons_cranes/roseate_spoonbills'},
        { id: 'cranes', name: 'Cranes', folder: 'birds/shorebirds_herons_cranes/cranes'},
        { id: 'egrets', name: "Egrets", folder: 'birds/shorebirds_herons_cranes/egrets'},
        { id: 'herons', name: 'Herons', folder: 'birds/shorebirds_herons_cranes/herons'},
        { id: 'other_shore_birds', name: 'Other Shore Birds', folder: 'birds/shorebirds_herons_cranes/other_shore_birds'}
      ] },
      { id: 'sparrows', name: 'Sparrows', folder: 'birds/sparrows' },
      { id: 'warblers_kinglets', name: 'Warblers and Kinglets', folder: 'birds/warblers_kinglets' },
      { id: 'waterfowl_water_birds', name: 'Waterfowl/Water Birds', folder: 'birds/waterfowl_water_birds', subcategories: [
        { id: 'geese_ducks', name: "Geese and Ducks", folder: "birds/waterfowl_water_birds/geese_ducks" },
        { id: 'gulls_terns', name: "Gulls and Terns", folder: "birds/waterfowl_water_birds/gulls_terns"},
        { id: 'miscellaneous_water_birds', name: "Miscellaneous Water Birds", folder: 'birds/waterfowl_water_birds/miscellaneous_water_birds'}
      ] },
      { id: 'woodpeckers', name: 'Woodpeckers', folder: 'birds/woodpeckers' },
      { id: 'indian_peafowl', name: 'Indean Peafowl', folder: 'birds/indian_peafowl' }
    ]
  },
  {
    id: 'insects',
    name: 'Insects',
    folder: 'insects',
    subcategories: [
      { id: 'bees', name: "Bees", folder: "insects/bees"},
      { id: "butterflies", name: "Butterflies", folder: "insects/butterflies"},
      { id: "dragonflies_damselflies", name: "Dragonflies", folder: "insects/dragonflies_damselflies"},
      { id: "other_insects", name: "Other Insects", folder: "insects/other_insects"}
    ]
  },
  { 
    id: "cypress_swamp",
    name: "Cypress Swamp",
    folder: "cypress_swamp"
  },
  {
    id: 'mammals',
    name: 'Mammals',
    folder: 'mammals',
  },
  {
    id: 'plants_landscapes_miscellaneous_others',
    name: 'Plants, Landscapes & Miscellaneous Others',
    folder: 'plants_landscapes_miscellaneous_others',
  },
  {
    id: 'reptiles',
    name: 'Reptiles',
    folder: "reptiles"
  },
];

const VACATION_GROUPS = [
  { id: 'louisiana', name: 'Louisiana', folder: 'louisiana', subcategories: [
    { id: "alligators_other_reptiles", name: "Alligators and Other Reptiles", folder: "louisiana/alligators_other_reptiles" },
    { id: "egrets", name: "Egrets", folder: "louisiana/egrets" },
    { id: "cypress_swamp_related_tropical_foliage", name: "Cypress Swamp and Related Tropical Foliage", folder: "louisiana/cypress_swamp_related_tropical_foliage"},
    { id: "indian_peafowl", name: "Indian Peafowl", folder: "louisiana/indian_peafowl" },
    { id: "roseate_spoonbills", name: "Roseate Spoonbills", folder: "louisiana/roseate_spoonbills"},
    { id: "other_plants_insects", name: "Other Plants and Insects", folder: "louisiana/other_plants_insects"},
    { id: "other_birds", name: "Other Birds", folder: "louisiana/other_birds" }
  ]},
  { id: 'sleeping_bear_dunes', name: 'Sleeping Bear Dunes', folder: 'sleeping_bear_dunes' },
  { id: 'yellow_river_state_forest', name: 'Yellow River State Forest', folder: 'yellow_river_state_forest' },
  { id: 'sax_zim_bog', name: 'Sax Zim Bog', folder: 'sax_zim_bog' },
];

/* ==========================================================================
   Gallery Component
   Renders a flexbox grid that perfectly justifies images of varying sizes.
   ========================================================================== */
function JustifiedGallery({ photos, onPhotoClick, selectedPhotos, onPhotoSelect }) {
  return (
    <section className="justified-gallery">
      {photos.map((photo, index) => {
        // Calculate width and flex-grow based on aspect ratio
        // Using a base height of 200px to define the initial flex basis
        const aspectRatio = photo.width / photo.height;
        const baseHeight = 200;
        const calculatedWidth = baseHeight * aspectRatio;
        
        return (
          <div
            key={index}
            className={`gallery-item ${selectedPhotos.has(index) ? 'selected' : ''}`}
            style={{
              width: `${calculatedWidth}px`,
              flexGrow: calculatedWidth,
              // Lightweight placeholder image generated via Cloudinary transform
              backgroundImage: `url(${photo.secure_url.replace('/upload/', '/upload/w_20/')})`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}

            
            onClick={(e) => {
              if (e.shiftKey || e.ctrlKey || e.metaKey) {
                onPhotoSelect(index);
              } else {
                onPhotoClick(index);
              }
            }}
          >
            {/* Aspect-ratio padding trick: creates padding-bottom to maintain aspect ratio */}
            <i style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }}></i>

            {/* Responsive image serving using next-gen formats */}
            <picture>
              <source type="image/avif" srcSet={`
                ${photo.secure_url.replace('/upload/', '/upload/w_400,f_avif,q_auto/')} 400w,
                ${photo.secure_url.replace('/upload/', '/upload/w_800,f_avif,q_auto/')} 800w
              `} />
              <source type="image/webp" srcSet={`
                ${photo.secure_url.replace('/upload/', '/upload/w_400,f_webp,q_auto/')} 400w,
                ${photo.secure_url.replace('/upload/', '/upload/w_800,f_webp,q_auto/')} 800w
              `} />
              <img
                ref={(el) => { if (el?.complete) el.closest('.gallery-item')?.classList.add('loaded'); }}
                src={photo.secure_url.replace('/upload/', '/upload/w_500,f_auto,q_auto/')}
                className="gallery-image"
                sizes='400px'
                alt={photo.display_name}
                loading="lazy"
                onLoad={(e) => e.currentTarget.closest('.gallery-item').classList.add('loaded')}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = NO_IMAGE_SVG;
                  e.currentTarget.closest('.gallery-item').classList.add('loaded');
                }}
              />
            </picture>

            {/* Photo overlay with caption */}
            <div className="photo-overlay">
              <div className="photo-title">{cleanDisplayName(photo.display_name)}</div>
              <div className="photo-number">{index + 1}</div>

            </div>
            {/* Selection indicator */}
            {selectedPhotos.has(index) && (
              <div className="selection-overlay">
                <div className="selection-checkmark">✓</div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

/* ==========================================================================
   Main Application Component
   ========================================================================== */
function App() {
  /* --- Global Application State --- */
  const [categories, setCategories] = useState(PHOTO_CATEGORIES);
  const [vacationMeta, setVacationMeta] = useState({});
  const [page, setPage] = useState('profile'); // Top-level routing: 'categories' | 'trips' | 'profile'


/* --- Navigation & Gallery State --- */
  // selectionStack acts as a breadcrumb trail for deep navigation into subfolders
  const [selectionStack, setSelectionStack] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());

  // Refs for tracking Lightbox image loading status
  const lightboxImgRef = useRef(null);
  const lightboxWrapperRef = useRef(null);

  /* --- Data Fetching Logic --- */

  /**
   * Fetches full photo manifests for a given category/subcategory.
   * Triggered when a user clicks into a folder.
   */
  const loadCategoryData = async (category) => {
    try {
      let categoryData = { ...category };
      
      if (category.subcategories) {
        // Load data for all subcategories in parallel
        const loadedSubs = await Promise.all(
          category.subcategories.map(async (sub) => {
            if (sub.photos && sub.photos.length > 0) return sub;

            try {
              if (sub.subcategories && sub.subcategories.length > 0) {
                // If it's a folder containing more folders, summarize it rather than fetching all photos
                try {
                  const summary = await summarizeNode(sub);
                  let subThumb = null;
                  try {
                    const tagName = `${sub.id}-thumbnail`;
                    const tagResp = await fetch(`${API_BASE_PATH}/thumbnail/${tagName}`);
                    if (tagResp.ok) {
                      const tagData = await tagResp.json();
                      if (tagData.resources && tagData.resources.length > 0) subThumb = tagData.resources[0];
                    }
                  } catch (err) {
                  }

                  return {
                    ...sub,
                    photos: [],
                    thumbnail: subThumb || summary.thumbnail || null,
                    count: summary.total || 0
                  };
                } catch (err) {
                  console.warn(`Failed to summarize nested subcategory ${sub.id}:`, err);
                  return { ...sub, photos: [], thumbnail: null, count: 0 };
                }
              }

              // Fetch raw photo list from folder
              const response = await fetch(`${API_BASE_PATH}/${sub.folder}`);
              if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new Error(`Manifest request failed: ${response.status} ${body}`);
              }
              const manifest = await response.json();

              // Extract tagged thumbnail, fallback to first image
              const thumbnailImage = manifest["resources"].find(resource => 
                resource.tags && resource.tags.includes("thumbnail")
              ) || manifest["resources"][0];

              return {
                ...sub,
                photos: manifest["resources"],
                thumbnail: thumbnailImage,
                count: manifest["total_count"]
              };
            } catch (error) {
              console.error(`Failed to load ${sub.name}:`, error);
              return { ...sub, photos: [], thumbnail: null, count: 0 };
            }
          })
        );
        
        categoryData.subcategories = loadedSubs;
        categoryData.totalCount = loadedSubs.reduce((sum, sub) => sum + sub.count, 0);
        
        // Fetch explicit category thumbnail if one exists
        try {
          const thumbnailTagName = `${category.id}-thumbnail`;
          const thumbnailResponse = await fetch(`${API_BASE_PATH}/thumbnail/${thumbnailTagName}`);
          if (thumbnailResponse.ok) {
            const thumbnailData = await thumbnailResponse.json();
            if (thumbnailData.resources && thumbnailData.resources.length > 0) {
              categoryData.thumbnail = thumbnailData.resources[0];
            }
          }
        } catch (error) {
        }
      } else {
        // Leaf node logic: just fetch the photos for this specific folder
        if (!category.photos || category.photos.length === 0) {
          try {
            const response = await fetch(`${API_BASE_PATH}/${category.folder}`);
            if (!response.ok) {
              const body = await response.text().catch(() => '');
              throw new Error(`Manifest request failed: ${response.status} ${body}`);
            }
            const manifest = await response.json();
            
            const thumbnailImage = manifest["resources"].find(resource => 
              resource.tags && resource.tags.includes("thumbnail")
            ) || manifest["resources"][0];
            
            categoryData.photos = manifest["resources"];
            categoryData.thumbnail = thumbnailImage;
            categoryData.totalCount = manifest["total_count"];
          } catch (error) {
            console.error(`Failed to load ${category.name}:`, error);
            categoryData.photos = [];
            categoryData.thumbnail = null;
            categoryData.totalCount = 0;
          }
        }
      }
      
      // Update global state with newly fetched data
      setCategories(prev => prev.map(cat => 
        cat.id === category.id ? categoryData : cat
      ));
      
      return categoryData;
    } catch (error) {
      console.error(`Failed to load category ${category.name}:`, error);
      return category;
    }
  };

/**
   * Helper function to recursively summarize a deep nested folder structure.
   * Walks the tree to sum photo counts and return the first available thumbnail.
   */
  async function summarizeNode(node) {
    if (node && node.subcategories && node.subcategories.length > 0) {
      let total = 0;
      let firstThumb = null;
      await Promise.all(node.subcategories.map(async (sub) => {
        try {
          const res = await summarizeNode(sub);
          total += res.total || 0;
          if (!firstThumb && res.thumbnail) firstThumb = res.thumbnail;
        } catch (err) {
          console.warn(`summarizeNode: failed for ${sub.folder || sub.id}:`, err);
        }
      }));
      return { total, thumbnail: firstThumb };
    }

    try {
      const folder = node.folder || '';
      if (!folder) return { total: 0, thumbnail: null };
      const resp = await fetch(`${API_BASE_PATH}/${folder}`);
      if (!resp.ok) return { total: 0, thumbnail: null };
      const m = await resp.json();
      const total = m.total_count || (m.resources ? m.resources.length : 0) || 0;
      const thumb = (m.resources && m.resources.find && m.resources.find(r => r.tags && r.tags.includes('thumbnail'))) || m.resources?.[0] || null;
      return { total, thumbnail: thumb };
    } catch (err) {
      console.warn('summarizeNode: manifest fetch failed for', node.folder || node.id, err);
      return { total: 0, thumbnail: null };
    }
  }

  /* --- Lifecycle Hooks --- */

  // Reset lightbox loading wrapper when navigating between images
  useEffect(() => {
    if (lightboxWrapperRef.current) {
      lightboxWrapperRef.current.classList.remove('loaded');
    }
    if (lightboxImgRef.current?.complete) {
      lightboxWrapperRef.current?.classList.add('loaded');
    }
  }, [lightboxIndex]);

  // Initial load: Fetch lightweight metadata for Top-Level Categories
  useEffect(() => {
    const loadThumbnailCounts = async () => {
      const updatedCategories = await Promise.all(
        PHOTO_CATEGORIES.map(async (category) => {
          try {
            if (category.subcategories) {
              const thumbnailTagName = `${category.id}-thumbnail`;
              let thumbnailFromTag = null;
              try {
                const tagResp = await fetch(`${API_BASE_PATH}/thumbnail/${thumbnailTagName}`);
                if (tagResp.ok) {
                  const tagData = await tagResp.json();
                  if (tagData.resources && tagData.resources.length > 0) {
                    thumbnailFromTag = tagData.resources[0];
                  }
                }
              } catch (err) {
                console.warn(`Thumbnail tag lookup failed for ${thumbnailTagName}:`, err);
              }

              const summary = await summarizeNode(category);
              return {
                ...category,
                thumbnail: thumbnailFromTag || summary.thumbnail || null,
                totalCount: summary.total || 0
              };
            } else {
              try {
                const response = await fetch(`${API_BASE_PATH}/${category.folder}`);
                if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
                const manifest = await response.json();

                const resources = manifest && manifest.resources ? manifest.resources : [];
                const thumbnailImage = (resources.find && resources.find(resource => resource.tags && resource.tags.includes('thumbnail'))) || resources[0] || null;

                return {
                  ...category,
                  thumbnail: thumbnailImage,
                  totalCount: manifest?.total_count || resources.length || 0
                };
              } catch (err) {
                console.error(`Failed to load manifest for ${category.folder}:`, err);
                return {
                  ...category,
                  thumbnail: null,
                  totalCount: 0
                };
              }
            }
          } catch (error) {
            console.error(`Failed to load thumbnail for ${category.name}:`, error);
            return category;
          }
        })
      );
      setCategories(updatedCategories);
    };

    loadThumbnailCounts();
  }, []);

  // Initial load: Prefetch summary info for the Trips Page
  useEffect(() => {
    const loadVacationMeta = async () => {
      const meta = {};
      await Promise.all(VACATION_GROUPS.map(async (group) => {
        try {
          const tagName = `${group.id}-thumbnail`;
          let thumbnailFromTag = null;

          try {
            const tagResp = await fetch(`${API_BASE_PATH}/thumbnail/${tagName}`);
            if (tagResp.ok) {
              const tagData = await tagResp.json();
              if (tagData.resources && tagData.resources.length > 0) {
                thumbnailFromTag = tagData.resources[0];
              }
            }
          } catch (err) {
            console.warn(`Thumbnail tag lookup failed for ${tagName}:`, err);
          }

          const summary = await summarizeNode(group);
          const chosenThumb = thumbnailFromTag || summary.thumbnail || null;
          meta[group.id] = { thumbnail: chosenThumb, totalCount: summary.total || 0 };
        } catch (err) {
          console.warn(`Failed to load vacation meta for ${group.id}:`, err);
          meta[group.id] = { thumbnail: null, totalCount: 0 };
        }
      }));
      setVacationMeta(meta);
    };

    loadVacationMeta();
  }, []);

  // Ensure scroll position resets to top when drilling down into a new category
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectionStack]);

  /* --- UI Event Handlers --- */

  const getCurrentPhotos = () => {
    const top = selectionStack.length > 0 ? selectionStack[selectionStack.length - 1] : null;
    if (top && top.photos) {
      return top.photos;
    }
    return [];
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextPhoto = () => {
    const photos = getCurrentPhotos();
    if (lightboxIndex < photos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  /**
   * Handles "Back" navigation. 
   * Pops the current directory off the selection stack.
   * If popping returns us to the root, checks if we originally came from the Trips page to route properly.
   */
  const goBack = () => {
    if (selectionStack.length > 0) {
      setSelectionStack(prev => {
        const popped = prev[prev.length - 1];
        const newStack = prev.slice(0, -1);

        // Restore routing based on entry origin
        if (popped && popped.__from === 'trips' && newStack.length === 0) {
          setPage('trips');
        }
        return newStack;
      });
      setLightboxIndex(null);
      setSelectedPhotos(new Set()); // Clear active selections on folder change
    }
  };

  const togglePhotoSelection = (index) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPhotos(newSelected);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, selectionStack]);

  // Lock body scroll when Lightbox is open to prevent background scrolling behind the portal
  useEffect(() => {
    if (lightboxIndex !== null) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [lightboxIndex]);

  // Derived state values for rendering logic
  const currentPhotos = getCurrentPhotos();
  const topNode = selectionStack.length > 0 ? selectionStack[selectionStack.length - 1] : null;
  
  // Determine if we've reached a leaf node (a folder with actual photos and no more subdirectories)
  const showPhotos = topNode && topNode.photos && topNode.photos.length > 0 && (!topNode.subcategories || topNode.subcategories.length === 0);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title" style={{ cursor: 'pointer' }} onClick={() => { setPage('profile'); setSelectionStack([]); }}>Henry Swain Photography</h1>
          <NavBar page={page} setPage={setPage} selectionStack={selectionStack} setSelectionStack={setSelectionStack} />
          {showPhotos && selectedPhotos.size > 0 && (
            <div className="selection-info">
              {selectedPhotos.size} selected
            </div>
          )}
        </div>
        {selectionStack.length > 0 && (
          <button className="back-button" onClick={goBack}>
            ← Back
          </button>
        )}
      </header>

      <main className="main">
        {/* Category Page Router Logic */}
        {page === 'categories' && (
          !topNode ? (
            // State 1: Top Level Directory
            <CategoriesPage categories={categories} loadCategoryData={loadCategoryData} setSelectionStack={setSelectionStack} NO_IMAGE_SVG={NO_IMAGE_SVG} />
          ) : topNode.subcategories && (!topNode.photos || topNode.photos.length === 0) ? (
            // State 2: Intermediate Directory (Contains more folders)
            <div className="photo-section">
              <h2 className="section-title">{topNode.name}</h2>
              <div className="category-grid">
                {topNode.subcategories.map((sub) => (
                  <div
                    key={sub.id}
                    className="category-card subcategory-card"
                    onClick={async () => {
                      const loaded = await loadCategoryData(sub);
                      if (loaded) loaded.__from = 'categories';
                      setSelectionStack(prev => [...prev, loaded]);
                    }}
                  >
                    <div className="category-image-wrapper">
                      <BlurImage
                        src={sub.thumbnail?.secure_url}
                        alt={sub.name}
                        className="category-image"
                        fallback={NO_IMAGE_SVG}
                      />
                      { (sub.subcategories && sub.subcategories.length > 0) && (
                        <div className="subcategory-badge">
                          <FolderOpen size={16} />
                          <span>{sub.subcategories.length} subcategories</span>
                        </div>
                      ) }
                    </div>
                    <div className="category-content">
                      <h2 className="category-name">{sub.name}</h2>
                      <p className="category-count">{sub.count || sub.totalCount || ''} photos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : showPhotos ? (
            // State 3: Leaf Directory (Render the gallery)
            <div className="photo-section">
              <h2 className="section-title">{topNode.name}</h2>
              <JustifiedGallery
                photos={currentPhotos}
                onPhotoClick={openLightbox}
                selectedPhotos={selectedPhotos}
                onPhotoSelect={togglePhotoSelection}
                // onLoadingChange={setGalleryLoading}
              />
            </div>
          ) : null
        )}

        {/* Trips Page Router */}
        {page === 'trips' && <TripsPage VACATION_GROUPS={VACATION_GROUPS} vacationMeta={vacationMeta} loadCategoryData={loadCategoryData} setSelectionStack={setSelectionStack} setPage={setPage} NO_IMAGE_SVG={NO_IMAGE_SVG}/>}
        
        {/* Profile Page Router */}
        {page === 'profile' && <ProfilePage />}
        </main>

        {/* 
          Lightbox Portal Overlay 
          Uses React createPortal to render the lightbox safely at the top of the DOM structure, 
          avoiding any z-index or overflow trapping issues from parent elements.
        */}
        {lightboxIndex !== null && currentPhotos.length > 0 && typeof document !== 'undefined' && createPortal(
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            <X size={32} />
          </button>
          
          {lightboxIndex > 0 && (
            <button
              className="lightbox-nav lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
            >
              <ChevronLeft size={48} />
            </button>
          )}
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <div
                ref={lightboxWrapperRef}
                className="blur-image-wrapper lightbox-blur-wrapper"
                style={{
                 // Forces the wrapper to match the aspect ratio of the image to ensure clean loading transitions
                  aspectRatio: `${currentPhotos[lightboxIndex].width} / ${currentPhotos[lightboxIndex].height}`,
                  backgroundImage: `url(${currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_50,f_auto,q_auto/')})`,
                  backgroundSize: 'cover', 
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              >
                <picture className="lightbox-picture">
                  <source
                    type="image/avif"
                    srcSet={`
                      ${currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_800,f_avif,q_auto:good/')} 800w,
                      ${currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_1600,f_avif,q_auto:good/')} 1600w,
                      ${currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_1920,f_avif,q_auto:good/')} 1920w
                    `}
                    sizes="100vw"
                  />
                  <source
                    type="image/webp"
                    srcSet={`
                      ${currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_800,f_webp,q_auto:good/')} 800w,
                      ${currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_1600,f_webp,q_auto:good/')} 1600w,
                      ${currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_1920,f_webp,q_auto:good/')} 1920w
                    `}
                    sizes="100vw"
                  />
                  <img
                    ref={lightboxImgRef}
                    src={currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_1280,f_auto,q_auto:good/')}
                    srcSet={`
                      ${currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_800,f_auto,q_auto:good/')} 800w,
                      ${currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_1600,f_auto,q_auto:good/')} 1600w,
                      ${currentPhotos[lightboxIndex].secure_url.replace('/upload/', '/upload/w_1920,f_auto,q_auto:good/')} 1920w
                    `}
                    sizes="100vw"
                    alt={currentPhotos[lightboxIndex].display_name}
                    className="blur-image lightbox-image"
                    onLoad={(e) => e.currentTarget.closest('.blur-image-wrapper').classList.add('loaded')}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.currentTarget.closest('.blur-image-wrapper').classList.add('loaded')}
                    }
                  />
                </picture>

                <p className="lightbox-caption">
                  {cleanDisplayName(currentPhotos[lightboxIndex].display_name)}
                </p>
                <div className="lightbox-counter-badge">
                  {lightboxIndex + 1} / {currentPhotos.length}
                </div>
              </div>

              {/* 
                HIDDEN PRELOADER 
                Silently fetches the adjacent images (previous and next) in the array 
                so they render instantly when the user clicks next/prev navigation buttons. 
              */}
              <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }} aria-hidden="true">
                {[lightboxIndex - 1, lightboxIndex + 1].map((preloadIndex) => {
                  if (preloadIndex >= 0 && preloadIndex < currentPhotos.length) {
                    const preloadPhoto = currentPhotos[preloadIndex];
                    return (
                      <picture key={`preload-${preloadIndex}`}>
                        <source
                          type="image/avif"
                          srcSet={`
                            ${preloadPhoto.secure_url.replace('/upload/', '/upload/w_800,f_avif,q_auto:good/')} 800w,
                            ${preloadPhoto.secure_url.replace('/upload/', '/upload/w_1600,f_avif,q_auto:good/')} 1600w,
                            ${preloadPhoto.secure_url.replace('/upload/', '/upload/w_1920,f_avif,q_auto:good/')} 1920w
                          `}
                          sizes="100vw"
                        />
                        <source
                          type="image/webp"
                          srcSet={`
                            ${preloadPhoto.secure_url.replace('/upload/', '/upload/w_800,f_webp,q_auto:good/')} 800w,
                            ${preloadPhoto.secure_url.replace('/upload/', '/upload/w_1600,f_webp,q_auto:good/')} 1600w,
                            ${preloadPhoto.secure_url.replace('/upload/', '/upload/w_1920,f_webp,q_auto:good/')} 1920w
                          `}
                          sizes="100vw"
                        />
                        <img
                          src={preloadPhoto.secure_url.replace('/upload/', '/upload/w_1280,f_auto,q_auto:good/')}
                          srcSet={`
                            ${preloadPhoto.secure_url.replace('/upload/', '/upload/w_800,f_auto,q_auto:good/')} 800w,
                            ${preloadPhoto.secure_url.replace('/upload/', '/upload/w_1600,f_auto,q_auto:good/')} 1600w,
                            ${preloadPhoto.secure_url.replace('/upload/', '/upload/w_1920,f_auto,q_auto:good/')} 1920w
                          `}
                          sizes="100vw"
                          alt="preload"
                          loading="eager" // Force immediate download
                          decoding="async" // Prevent the main thread from blocking while it decodes
                        />
                      </picture>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          {lightboxIndex < currentPhotos.length - 1 && (
            <button
              className="lightbox-nav lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
            >
              <ChevronRight size={48} />
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default App;