import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import './gallery.css';
import './App.css';
 
// inline "no picture" SVG (encoded) — used as the only fallback
const NO_IMAGE_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e6e6e6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
const API_BASE_PATH = 'https://henry-swain-photography-backend.vercel.app';
// const API_BASE_PATH = 'http://localhost:3000'
// const API_BASE_PATH = "http://192.168.1.4:3000";
// helper to produce a safe src (encode real paths, leave data: URIs alone)
function safeSrc(url) {
  if (!url) return NO_IMAGE_SVG;
  return String(url).startsWith('data:') ? url : encodeURI(url);
}

// helper to clean up Cloudinary display names (remove random suffix, replace underscores with spaces)
function cleanDisplayName(displayName) {
  if (!displayName) return '';
  // Remove the random suffix after the last underscore (e.g., "bird_name_a1b2c3" -> "bird_name")
  const withoutSuffix = displayName.replace(/_[a-zA-Z0-9]{6}$/, '');
  // Replace all underscores with spaces
  return withoutSuffix.replace(/_/g, ' ');
}

// Configure your photo categories here
// Support for nested subcategories!
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
      // Add more subcategories as needed
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
    // No subcategories - this will show photos directly
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
    // No subcategories - this will show photos directly
  },
  {
    id: 'plants_landscapes_miscellaneous_others',
    name: 'Plants, Landscapes & Miscellaneous Others',
    folder: 'plants_landscapes_miscellaneous_others',
    // No subcategories - this will show photos directly
  },
  {
    id: 'reptiles',
    name: 'Reptiles',
    folder: "reptiles"
  },
];

// VACATION / TRIP GROUPS
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

const TARGET_ROW_HEIGHT = 300; // Target height for each row in pixels
const MARGIN = 4; // Gap between photos

function JustifiedGallery({ photos, onPhotoClick, selectedPhotos, onPhotoSelect, onLoadingChange }) {
  const [rows, setRows] = useState([]);
  const [photoDimensions, setPhotoDimensions] = useState({});
  const [orientation, setOrientation] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const containerRef = useRef(null);

  // Listen for orientation changes
  useEffect(() => {
    const handleOrientationChange = (event) => {
      const newOrientation = event?.target?.screen?.orientation?.angle || window.screen?.orientation?.angle || Date.now();
      setOrientation(newOrientation);
      // Force recalculation on next render
      if (containerRef.current) {
        containerRef.current.style.width = '100%';
      }
    };

    const handleResize = () => {
      // Use timestamp to force re-render on resize
      setOrientation(Date.now());
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const loadImageDimensions = async () => {
      setImagesLoaded(false);
      if (onLoadingChange) onLoadingChange(true);
      
      const dimensions = {};
      
      await Promise.all(
        photos.map((photo, index) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              dimensions[index] = {
                width: photo.width,
                height: photo.height,
                aspectRatio: photo.width / photo.height,
              };
              resolve();
            };
            img.onerror = () => {
              dimensions[index] = {
                width: 1,
                height: 1,
                aspectRatio: 1
              };
              resolve();
            };
            img.src = photo.secure_url;
          });
        })
      );
      
      setPhotoDimensions(dimensions);
      setImagesLoaded(true);
      if (onLoadingChange) onLoadingChange(false);
    };

    if (photos.length > 0) {
      loadImageDimensions();
    }
  }, [photos, onLoadingChange]);

  useEffect(() => {
    if (Object.keys(photoDimensions).length === 0 || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const justifyPhotos = () => {
      const newRows = [];
      let currentRow = [];
      let currentRowWidth = 0;

      photos.forEach((photo, index) => {
        const dim = photoDimensions[index];
        if (!dim) return;

        const photoWidth = TARGET_ROW_HEIGHT * dim.aspectRatio;
        
        if (currentRowWidth + photoWidth + (currentRow.length * MARGIN) <= containerWidth || currentRow.length === 0) {
          currentRow.push({ photo, index, ...dim });
          currentRowWidth += photoWidth;
        } else {
          newRows.push(currentRow);
          currentRow = [{ photo, index, ...dim }];
          currentRowWidth = photoWidth;
        }
      });

      if (currentRow.length > 0) {
        newRows.push(currentRow);
      }

      const justifiedRows = newRows.map((row, rowIndex) => {
        const isLastRow = rowIndex === newRows.length - 1;
        const totalMargin = (row.length - 1) * MARGIN;
        const availableWidth = containerWidth - totalMargin;
        
        const rowAspectRatio = row.reduce((sum, item) => sum + item.aspectRatio, 0);
        const rowHeight = isLastRow && row.length < 3 ? TARGET_ROW_HEIGHT : availableWidth / rowAspectRatio;

        return row.map(item => ({
          ...item,
          displayWidth: rowHeight * item.aspectRatio,
          displayHeight: rowHeight
        }));
      });

      setRows(justifiedRows);
    };

    justifyPhotos();

    const resizeObserver = new ResizeObserver(justifyPhotos);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [photoDimensions, photos, orientation]);

  console.log("Justified gallery rows:", rows);
  return (
    <div ref={containerRef} className="justified-gallery">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="gallery-row">
          {row.map((item) => (
            <div
              key={item.index}
              className={`gallery-item ${selectedPhotos.has(item.index) ? 'selected' : ''}`}
              style={{
                width: `${item.displayWidth}px`,
                height: `${item.displayHeight}px`,
              }}
              onClick={(e) => {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                  onPhotoSelect(item.index);
                } else {
                  onPhotoClick(item.index);
                }
              }}
            >
              <img
                src={item.photo.secure_url}
                alt={item.photo.display_name}
                className="gallery-image"
                loading="lazy"
                onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE_SVG; }}
              />
            {/* caption pulled from manifest second element */}
            <div className="photo-overlay">
              <div className="photo-title">{cleanDisplayName(item.photo.display_name)}</div>
              <div className="photo-number">{item.index + 1}</div>
            </div>
              {selectedPhotos.has(item.index) && (
                <div className="selection-overlay">
                  <div className="selection-checkmark">✓</div>
                </div>
              )}
              {/* <div className="photo-overlay">
                <div className="photo-number">{item.index + 1}</div>
              </div> */}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [categories, setCategories] = useState(PHOTO_CATEGORIES);
  // selection stack: each entry is a category/subcategory node { id, name, folder, subcategories?, photos?, thumbnail?, totalCount? }
  const [selectionStack, setSelectionStack] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  // Local page state: 'categories' | 'vacations'
  const [page, setPage] = useState('categories');

  // Vacation metadata (thumbnail + count) fetched up front for the Vacations page
  const [vacationMeta, setVacationMeta] = useState({});

  // Simple NavBar component
  const NavBar = () => {
    // consider the selection stack: if any entry originated from the Trips page,
    // the Trips tab should remain visually active while exploring that group
    const fromTrips = selectionStack && selectionStack.some && selectionStack.some(entry => entry && entry.__from === 'trips');
    const isTripsActive = page === 'trips' || fromTrips;
    const isCategoriesActive = page === 'categories' && !fromTrips;

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
  };

  // Vacations page: show trip groups/folders
  const TripsPage = () => (
    <div className="vacations-page">
      <h2 className="section-title">Trips</h2>
      <div className="category-grid">
        {VACATION_GROUPS.map((group) => (
          <div
            key={group.id}
            className="category-card"
            onClick={async () => {
              // create a category-like object and load it
              setCategoryLoading(true);
              try {
                console.log(`VacationsPage: loading group ${group.id} -> folder ${group.folder}`);
                // Preserve subcategories (if present) by forwarding the whole group object
                const catObj = { ...group };
                const loaded = await loadCategoryData(catObj);
                console.log('VacationsPage: loaded category data:', loaded);
                // Mark that this selection originated from the Trips page so the back button can restore it
                loaded.__from = 'trips';
                setSelectionStack(prev => [...prev, loaded]);
                // switch to the categories view (which shows the gallery behavior)
                setPage('categories');
              } catch (err) {
                console.error('VacationsPage: failed to load group', group.id, err);
                // Show a minimal UI hint
                alert(`Failed to load ${group.name}: ${err.message || err}`);
              } finally {
                setCategoryLoading(false);
              }
            }}
          >
            <div className="category-image-wrapper">
              <img src={vacationMeta[group.id]?.thumbnail?.secure_url || NO_IMAGE_SVG} alt={group.name} className="category-image" />
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

  // Load category data on demand
  const loadCategoryData = async (category) => {
    setCategoryLoading(true);
    try {
      let categoryData = { ...category };
      
      if (category.subcategories) {
        // Load all subcategories
        const loadedSubs = await Promise.all(
          category.subcategories.map(async (sub) => {
            // Skip if already loaded
            if (sub.photos && sub.photos.length > 0) return sub;

            try {
              // If this subcategory itself contains nested subcategories, summarize them instead of fetching the empty parent folder
              if (sub.subcategories && sub.subcategories.length > 0) {
                try {
                  const summary = await summarizeNode(sub);
                  // prefer an explicit thumbnail tag for the sub, else use the found thumbnail
                  let subThumb = null;
                  try {
                    const tagName = `${sub.id}-thumbnail`;
                    const tagResp = await fetch(`${API_BASE_PATH}/thumbnail/${tagName}`);
                    if (tagResp.ok) {
                      const tagData = await tagResp.json();
                      if (tagData.resources && tagData.resources.length > 0) subThumb = tagData.resources[0];
                    }
                  } catch (err) {
                    // ignore
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

              // Use the full folder path (supports nested folders) for leaf subcategories
              console.log(`Loading subcategory - ${sub.folder}`);
              const response = await fetch(`${API_BASE_PATH}/${sub.folder}`);
              if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new Error(`Manifest request failed: ${response.status} ${body}`);
              }
              const manifest = await response.json();
              console.log(`Manifest for ${sub.folder}:`, manifest);

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
        
        // Fetch outer category thumbnail
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
          console.log(`No specific thumbnail found for ${category.name}`);
        }
      } else {
        // Skip if already loaded
        if (!category.photos || category.photos.length === 0) {
          try {
            console.log(`Loading category - ${category.folder}`);
            const response = await fetch(`${API_BASE_PATH}/${category.folder}`);
            if (!response.ok) {
              const body = await response.text().catch(() => '');
              throw new Error(`Manifest request failed: ${response.status} ${body}`);
            }
            const manifest = await response.json();
            console.log(`Manifest for ${category.folder}:`, manifest);
            
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
      
      // Update categories array with loaded data
      setCategories(prev => prev.map(cat => 
        cat.id === category.id ? categoryData : cat
      ));
      
      setCategoryLoading(false);
      return categoryData;
    } catch (error) {
      console.error(`Failed to load category ${category.name}:`, error);
      setCategoryLoading(false);
      return category;
    }
  };

  // Helper: recursively summarize a category/group node (sum counts, return first thumbnail)
  async function summarizeNode(node) {
    // If node has nested subcategories, recurse
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

    // Leaf node: fetch manifest for the folder
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

  // Load thumbnail counts on initial load (lightweight) — now uses recursive summarizer for categories with nested subcategories
  useEffect(() => {
    const loadThumbnailCounts = async () => {
      setLoading(true);
      const updatedCategories = await Promise.all(
        PHOTO_CATEGORIES.map(async (category) => {
          try {
            if (category.subcategories) {
              // Prefer tag-based thumbnail, but always summarize subfolders for accurate counts
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
              // Leaf category — fetch manifest directly
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
      setLoading(false);
    };

    loadThumbnailCounts();
  }, []);

  // Load vacation metadata on initial load — use summarizeNode so groups with nested subfolders sum correctly
  useEffect(() => {
    const loadVacationMeta = async () => {
      const meta = {};
      await Promise.all(VACATION_GROUPS.map(async (group) => {
        try {
          // Prefer tag-based thumbnail (e.g. 'louisiana-thumbnail') for thumbnail selection
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

          // Use summarizer for groups (handles nested subfolders)
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

  const goBack = () => {
    if (selectionStack.length > 0) {
      setSelectionStack(prev => {
        const popped = prev[prev.length - 1];
        const newStack = prev.slice(0, -1);
        // If the item we popped came from the Vacations page and we are now at the top level,
        // restore the Vacations page instead of staying on Categories.
        if (popped && popped.__from === 'trips' && newStack.length === 0) {
          setPage('trips');
         }
         return newStack;
      });
      setLightboxIndex(null);
      setSelectedPhotos(new Set());
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

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [lightboxIndex]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  const currentPhotos = getCurrentPhotos();
  const topNode = selectionStack.length > 0 ? selectionStack[selectionStack.length - 1] : null;
  const showPhotos = topNode && topNode.photos && topNode.photos.length > 0 && (!topNode.subcategories || topNode.subcategories.length === 0);

  return (
    <div className="app">
      {(categoryLoading || galleryLoading) && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading photos...</p>
        </div>
      )}
      
      <header className="header">
        <div className="header-content">
          <h1 className="title">Henry Swain Photography</h1>
          <NavBar />
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
        {page === 'categories' && (
          // top-level view if nothing selected
          !topNode ? (
            <div className="category-grid">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="category-card"
                  onClick={async () => {
                    setCategoryLoading(true);
                    const loaded = await loadCategoryData(category);
                    // mark this selection as coming from the Categories page
                    if (loaded) loaded.__from = 'categories';
                    setSelectionStack(prev => [...prev, loaded]);
                    setCategoryLoading(false);
                  }}
                >
                  <div className="category-image-wrapper">
                    <img 
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
          ) : topNode.subcategories && (!topNode.photos || topNode.photos.length === 0) ? (
            <div className="photo-section">
              <h2 className="section-title">{topNode.name}</h2>
              <div className="category-grid">
                {topNode.subcategories.map((sub) => (
                  console.log('Rendering subcategory card:', sub.id, 'hasSubcategories=', !!sub.subcategories, 'subcategoriesLength=', sub.subcategories?.length, 'count=', sub.count, 'photosLen=', sub.photos?.length),
                  <div
                    key={sub.id}
                    className="category-card subcategory-card"
                    onClick={async () => {
                      setCategoryLoading(true);
                      const loaded = await loadCategoryData(sub);
                      // mark this selection as coming from the Categories page
                      if (loaded) loaded.__from = 'categories';
                      setSelectionStack(prev => [...prev, loaded]);
                      setCategoryLoading(false);
                    }}
                  >
                    <div className="category-image-wrapper">
                      <img
                        src={sub.thumbnail?.secure_url || NO_IMAGE_SVG}
                        alt={sub.name}
                        className="category-image"
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE_SVG; }}
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
            <div className="photo-section">
              <h2 className="section-title">{topNode.name}</h2>
              <JustifiedGallery
                photos={currentPhotos}
                onPhotoClick={openLightbox}
                selectedPhotos={selectedPhotos}
                onPhotoSelect={togglePhotoSelection}
                onLoadingChange={setGalleryLoading}
              />
            </div>
          ) : null
        )}

        {page === 'trips' && <TripsPage />}
       </main>

      {lightboxIndex !== null && currentPhotos.length > 0 && (
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
              <img
                src={currentPhotos[lightboxIndex].secure_url}
                alt={currentPhotos[lightboxIndex].display_name}
                className="lightbox-image"
              />
              <p style={{ color: 'white', fontSize: '1.5rem' }}>{cleanDisplayName(currentPhotos[lightboxIndex].display_name)}</p>
            <div className="lightbox-info">
              <div className="lightbox-counter">
                {lightboxIndex + 1} / {currentPhotos.length}
              </div>
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
        </div>
      )}
    </div>
  );
}

export default App;