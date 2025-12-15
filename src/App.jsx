import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import './gallery.css';
 
// inline "no picture" SVG (encoded) — used as the only fallback
const NO_IMAGE_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e6e6e6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
const API_BASE_PATH = 'https://henry-swain-photography-backend.vercel.app';

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
      { id: 'raptors', name: 'Raptors', folder: 'birds/raptors' },
      { id: 'shorebirds_herons_cranes', name: 'Shore birds, Herons, Cranes', folder: 'birds/shorebirds_herons_cranes' },
      { id: 'sparrows', name: 'Sparrows', folder: 'birds/sparrows' },
      { id: 'warblers_kinglets', name: 'Warblers and Kinglets', folder: 'birds/warblers_kinglets' },
      { id: 'waterfowl_water_birds', name: 'Waterfowl/Water Birds', folder: 'birds/waterfowl_water_birds' },
      { id: 'woodpeckers', name: 'Woodpeckers', folder: 'birds/woodpeckers' },
      // Add more subcategories as needed
    ]
  },
  {
    id: 'insects',
    name: 'Insects',
    folder: 'insects',
    // No subcategories - this will show photos directly
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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());

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
              console.log(`Loading subcategory - ${sub.folder.split('/')[1]}`);
              const response = await fetch(`${API_BASE_PATH}/birds/${sub.folder.split('/')[1]}`);
              if (!response.ok) throw new Error('Manifest not found');
              const manifest = await response.json();
              
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
            if (!response.ok) throw new Error('Manifest not found');
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

  // Load thumbnail counts on initial load (lightweight)
  useEffect(() => {
    const loadThumbnailCounts = async () => {
      setLoading(true);
      const updatedCategories = await Promise.all(
        PHOTO_CATEGORIES.map(async (category) => {
          try {
            if (category.subcategories) {
              // Just get counts for subcategories (no photo data)
              const thumbnailTagName = `${category.id}-thumbnail`;
              const thumbnailResponse = await fetch(`${API_BASE_PATH}/thumbnail/${thumbnailTagName}`);
              let thumbnail = null;
              if (thumbnailResponse.ok) {
                const thumbnailData = await thumbnailResponse.json();
                if (thumbnailData.resources && thumbnailData.resources.length > 0) {
                  thumbnail = thumbnailData.resources[0];
                }
              }
              
              return {
                ...category,
                thumbnail,
                totalCount: '...' // Placeholder
              };
            } else {
              // Get thumbnail for non-subcategory items
              const response = await fetch(`${API_BASE_PATH}/${category.folder}`);
              const manifest = await response.json();
              const thumbnailImage = manifest["resources"].find(resource => 
                resource.tags && resource.tags.includes("thumbnail")
              ) || manifest["resources"][0];
              
              return {
                ...category,
                thumbnail: thumbnailImage,
                totalCount: manifest["total_count"]
              };
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

  const getCurrentPhotos = () => {
    if (selectedSubcategory) {
      console.log("Selected subcategory photos:", selectedSubcategory.photos);
      return selectedSubcategory.photos;
    } else if (selectedCategory && selectedCategory.photos) {
      console.log("Selected category photos:", selectedCategory.photos);
      return selectedCategory.photos;
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
    if (selectedSubcategory) {
      setSelectedSubcategory(null);
      setLightboxIndex(null);
      setSelectedPhotos(new Set());
    } else {
      setSelectedCategory(null);
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
  }, [lightboxIndex, selectedCategory, selectedSubcategory]);

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
  const showPhotos = selectedSubcategory || (selectedCategory && !selectedCategory.subcategories);

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
          {showPhotos && selectedPhotos.size > 0 && (
            <div className="selection-info">
              {selectedPhotos.size} selected
            </div>
          )}
        </div>
        {(selectedCategory || selectedSubcategory) && (
          <button className="back-button" onClick={goBack}>
            ← Back
          </button>
        )}
      </header>

      <main className="main">
        {!selectedCategory ? (
          <div className="category-grid">
            {categories.map((category) => (
              <div
                key={category.id}
                className="category-card"
                onClick={async () => {
                  const loadedCategory = await loadCategoryData(category);
                  setSelectedCategory(loadedCategory);
                }}
              >
                <div className="category-image-wrapper">
                  <img 
                    src={category.thumbnail?.secure_url || category.subcategories?.[0]?.thumbnail?.secure_url || NO_IMAGE_SVG} 
                    alt={category.name}
                    className="category-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = NO_IMAGE_SVG;
                    }}
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
        ) : selectedCategory.subcategories && !selectedSubcategory ? (
          <div className="photo-section">
            <h2 className="section-title">{selectedCategory.name}</h2>
            <div className="category-grid">
              {selectedCategory.subcategories.map((sub) => (
                <div
                  key={sub.id}
                  className="category-card subcategory-card"
                  onClick={() => {
                    setCategoryLoading(true);
                    // Small delay to show spinner, then set subcategory
                    setTimeout(() => {
                      setSelectedSubcategory(sub);
                      setCategoryLoading(false);
                    }, 50);
                  }}
                >
                  <div className="category-image-wrapper">
                    <img
                      src={sub.thumbnail?.secure_url || NO_IMAGE_SVG}
                      alt={sub.name}
                      className="category-image"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = NO_IMAGE_SVG;
                      }}
                    />
                  </div>
                  <div className="category-content">
                    <h2 className="category-name">{sub.name}</h2>
                    <p className="category-count">{sub.count} photos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : showPhotos ? (
          <div className="photo-section">
            <h2 className="section-title">
              {selectedSubcategory ? selectedSubcategory.name : selectedCategory.name}
            </h2>
            <JustifiedGallery
              photos={currentPhotos}
              onPhotoClick={openLightbox}
              selectedPhotos={selectedPhotos}
              onPhotoSelect={togglePhotoSelection}
              onLoadingChange={setGalleryLoading}
            />
          </div>
        ) : null}
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