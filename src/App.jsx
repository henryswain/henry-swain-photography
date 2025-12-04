import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import './gallery.css';
 
// inline "no picture" SVG (encoded) — used as the only fallback
const NO_IMAGE_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e6e6e6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';

// helper to produce a safe src (encode real paths, leave data: URIs alone)
function safeSrc(url) {
  if (!url) return NO_IMAGE_SVG;
  return String(url).startsWith('data:') ? url : encodeURI(url);
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

function JustifiedGallery({ photos, onPhotoClick, selectedPhotos, onPhotoSelect }) {
  const [rows, setRows] = useState([]);
  const [photoDimensions, setPhotoDimensions] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    const loadImageDimensions = async () => {
      const dimensions = {};
      
      await Promise.all(
        photos.map((photo, index) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              dimensions[index] = {
                width: photo[2],
                height: photo[3],
                aspectRatio: photo[2] / photo[3],
              };
              resolve();
            };
            // img.onerror = () => {
            //   dimensions[index] = {
            //     width: 1,
            //     height: 1,
            //     aspectRatio: 1
            //   };
            //   resolve();
            // };
            img.src = photo[0];
          });
        })
      );
      
      setPhotoDimensions(dimensions);
    };

    if (photos.length > 0) {
      loadImageDimensions();
    }
  }, [photos]);

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
  }, [photoDimensions, photos]);

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
                src={ safeSrc(item.photo[5]?.small || item.photo[0]) }
                alt={`Photo ${item.index + 1}`}
                className="gallery-image"
                loading="lazy"
                onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE_SVG; }}
              />
            {/* caption pulled from manifest second element */}
            <div className="photo-overlay">
              <div className="photo-title">{item.photo[1]}</div>
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
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());

  useEffect(() => {
    const loadCategories = async () => {
      const loadedCategories = await Promise.all(
        PHOTO_CATEGORIES.map(async (category) => {
          try {
            let categoryData = { ...category };
            if (category.subcategories) {
              const loadedSubs = await Promise.all(
                category.subcategories.map(async (sub) => {
                  try {
                    const response = await fetch(`/photos/${sub.folder}/manifest.json`);
                    if (!response.ok) throw new Error('Manifest not found');
                    const manifest = await response.json();
                    return {
                      ...sub,
                      photos: manifest.photos,
                      thumbnail: manifest.thumbnail,
                        // ? `/photos/${sub.folder}/${manifest.thumbnail}`
                        // : `/photos/${sub.folder}/${manifest.photos[0]}`,
                      count: manifest.photos.length
                    };
                  } catch (error) {
                    console.error(`Failed to load ${sub.name}:`, error);
                    return { ...sub, photos: [], thumbnail: null, count: 0 };
                  }
                })
              );
              categoryData.subcategories = loadedSubs;
              categoryData.totalCount = loadedSubs.reduce((sum, sub) => sum + sub.count, 0);
            } else {
              try {
                const response = await fetch(`/photos/${category.folder}/manifest.json`);
                if (!response.ok) throw new Error('Manifest not found');
                const manifest = await response.json();
                categoryData.photos = manifest.photos;
                categoryData.thumbnail = manifest.thumbnail 
                  // ? `/photos/${category.folder}/${manifest.thumbnail}`
                  // : `/photos/${category.folder}/${manifest.photos[0]}`;
                categoryData.totalCount = manifest.photos.length;
              } catch (error) {
                console.error(`Failed to load ${category.name}:`, error);
                categoryData.photos = [];
                categoryData.thumbnail = null;
                categoryData.totalCount = 0;
              }
            }
            
            return categoryData;
          } catch (error) {
            console.error(`Failed to load category ${category.name}:`, error);
            return { ...category, photos: [], thumbnail: null, totalCount: 0 };
          }
        })
      );
      setCategories(loadedCategories);
      setLoading(false);
    };

    loadCategories();
  }, []);

  const getCurrentPhotos = () => {
    if (selectedSubcategory) {
      return selectedSubcategory.photos;
    } else if (selectedCategory && selectedCategory.photos) {
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
                onClick={() => setSelectedCategory(category)}
              >
                <div className="category-image-wrapper">
                  <img
                    src={safeSrc(
                      category.thumbnail?.[5]?.small
                      || category.thumbnail?.[0]
                      || category.subcategories?.[0]?.thumbnail?.[5]?.small
                      || category.subcategories?.[0]?.thumbnail?.[0]
                    )}
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
                  onClick={() => setSelectedSubcategory(sub)}
                >
                  <div className="category-image-wrapper">
                    <img
                      src={safeSrc(sub.thumbnail?.[5]?.small || sub.thumbnail?.[0])}
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
            {/* <div className='lightbox-content'> */}
              <img
                src={currentPhotos[lightboxIndex][0]}
                alt={`Photo ${lightboxIndex + 1}`}
                className="lightbox-image"
              />
              <p style={{ color: 'white', fontSize: '1.5rem' }}>{currentPhotos[lightboxIndex][1]}</p>
              <div className="lightbox-product-info">
                <h3 className="lightbox-product-title">Click here to see buying options</h3>
              </div>
            {/* </div> */}
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