'use strict';

// Graceful GSAP fallback shim (guarantees accordion works offline, on weak mobile connections, or if CDN blocked)
if (typeof window !== 'undefined' && typeof window.gsap === 'undefined') {
  window.gsap = {
    timeline: function() {
      return {
        to: function(targets, vars) {
          const list = Array.isArray(targets) ? targets : [targets];
          list.forEach(el => {
            if (!el || !el.style) return;
            if (vars.flexGrow !== undefined) el.style.flexGrow = vars.flexGrow;
            if (vars.opacity !== undefined) el.style.opacity = vars.opacity;
            if (vars['--ag-gray'] !== undefined) el.style.setProperty('--ag-gray', vars['--ag-gray']);
            if (vars['--ag-dim'] !== undefined) el.style.setProperty('--ag-dim', vars['--ag-dim']);
            if (vars.rotateY !== undefined || vars.rotateX !== undefined) {
              const rx = vars.rotateX || 0;
              const ry = vars.rotateY || 0;
              el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
            }
            if (vars.xPercent !== undefined || vars.yPercent !== undefined || vars.x !== undefined || vars.y !== undefined) {
              const xp = vars.xPercent !== undefined ? vars.xPercent : 0;
              const yp = vars.yPercent !== undefined ? vars.yPercent : 0;
              const x = vars.x || 0;
              const y = vars.y || 0;
              el.style.transform = `translate(calc(${xp}% + ${x}px), calc(${yp}% + ${y}px))`;
            }
          });
          return this;
        },
        kill: function() {}
      };
    }
  };
}

/* ===================================================================
   EKKOMI — NOCTURNE COLLECTION
   Data & Interaction Logic: Department Tabs + Dynamic Showcase
   =================================================================== */

// Ekkomi WhatsApp Business Configuration
const EKKOMI_WHATSAPP_NUMBER = (typeof window !== 'undefined' && (window.EKKOMI_WHATSAPP_NUMBER || document.documentElement.dataset.ekkomiWhatsapp)) || '';
let currentSelectedSize = 'M';
let currentSelectedQuantity = 1;
let currentSelectedVariantId = null;

/* -------------------------------------------------------------------
   MEN'S COLLECTION DATA (5 JACKETS — 100% MALE / STILL GARMENT)
   ------------------------------------------------------------------- */

const SHOPIFY_PRODUCT_TAGLINES = {
  curiosity: "The room was loud. The impulse was quiet. Curiosity doesn’t ask for permission.",
  temptation: "You knew where the line was. You stepped across it on purpose.",
  desire: "Wanting more is not greed. Sometimes it is vision.",
  audacity: "Confidence before permission arrives.",
  insolence: "The rules were written by people who wanted you to stay quiet."
};
const STANDARD_SIZES = ['S', 'M', 'L', 'XL'];
const MAX_ORDER_QUANTITY = 10;
const getVariantAvailability = (variant) => {
  if (!variant) return null;
  if (variant.availableForSale === false || variant.currentlyNotInStock === true || variant.quantityAvailable === 0) return false;
  if (variant.availableForSale === true && (variant.quantityAvailable == null || variant.quantityAvailable > 0)) return true;
  return null;
};
const isVariantAvailable = (variant) => getVariantAvailability(variant) === true;
const isVariantSoldOut = (variant) => getVariantAvailability(variant) === false;
const getVariantQuantityLimit = (variant) => {
  if (!isVariantAvailable(variant)) return 0;
  // If Shopify does not grant quantityAvailable access, fail conservatively to one.
  return variant.quantityAvailable == null
    ? 1
    : Math.min(MAX_ORDER_QUANTITY, Math.max(0, variant.quantityAvailable));
};
const productHasAvailableStandardSize = (jacket) => STANDARD_SIZES.some((size) =>
  isVariantAvailable(jacket?.variants?.find((variant) => variant.size === size))
);
const productIsConfirmedSoldOut = (jacket) => {
  const standardVariants = STANDARD_SIZES.map((size) => jacket?.variants?.find((variant) => variant.size === size));
  return standardVariants.every(Boolean) && standardVariants.every(isVariantSoldOut);
};
let refreshActiveProductInventory = null;
if (!window.ekkomiInventoryRefreshListenersBound) {
  const revalidateVisibleProduct = () => {
    if (document.visibilityState === 'visible') refreshActiveProductInventory?.();
  };
  window.addEventListener('focus', revalidateVisibleProduct);
  document.addEventListener('visibilitychange', revalidateVisibleProduct);
  window.ekkomiInventoryRefreshListenersBound = true;
}
const METAFIELD_LABELS = {
  material: 'The Material',
  embroidery: 'The Embroidery',
  inner_world: 'The Inner World',
  craft: 'Craftsmanship'
};

function mapShopifyProduct(product, gender, index) {
  const key = product.handle.replace(/-women$/, '');
  const variants = (product.variants || []).map((variant) => ({
    ...variant,
    size: variant.selectedOptions.find((option) => option.name.toLowerCase() === 'size')?.value || variant.title
  }));
  const sizeOption = (product.options || []).find((option) => option.name.toLowerCase() === 'size');
  const sizes = [...new Set([...(sizeOption?.values || []), ...variants.map((variant) => variant.size)])]
    .filter((size) => STANDARD_SIZES.includes(size))
    .sort((a, b) => STANDARD_SIZES.indexOf(a) - STANDARD_SIZES.indexOf(b));
  const defaultVariant = variants.find((variant) => variant.size === 'M' && variant.availableForSale)
    || variants.find((variant) => variant.availableForSale)
    || variants.find((variant) => STANDARD_SIZES.includes(variant.size));
  const colourOption = (product.options || []).find((option) => /colou?r/i.test(option.name));
  const metafields = (product.metafields || []).filter(Boolean);
  const metafieldColour = metafields.find((field) => ['colour', 'color'].includes(field.key))?.value;
  const images = [...(product.featuredImage ? [product.featuredImage] : []), ...(product.images || [])]
    .filter((image, imageIndex, all) => image?.url && all.findIndex((candidate) => candidate?.url === image.url) === imageIndex);
  const impulse = product.title;
  const number = String(index + 1).padStart(2, '0');

  return {
    id: product.id,
    productId: product.id,
    handle: product.handle,
    key,
    gender,
    number,
    impulse,
    name: impulse,
    colour: colourOption?.values?.[0] || metafieldColour || '',
    hex: null,
    price: defaultVariant?.price?.amount || '0',
    currencyCode: defaultVariant?.price?.currencyCode || 'GBP',
    compareAtPrice: defaultVariant?.compareAtPrice?.amount || null,
    inStock: STANDARD_SIZES.some((size) => isVariantAvailable(variants.find((variant) => variant.size === size))),
    image: images[0]?.url || '',
    label: `${number} / ${impulse}`,
    headline: metafields.find((field) => field.key === 'tagline')?.value || SHOPIFY_PRODUCT_TAGLINES[key] || '',
    narrative: product.description || '',
    craft: metafields
      .filter((field) => METAFIELD_LABELS[field.key])
      .map((field) => ({ title: METAFIELD_LABELS[field.key], desc: field.value })),
    sizes,
    variants,
    views: images.map((image, imageIndex) => ({
      label: image.altText || `Perspective ${String(imageIndex + 1).padStart(2, '0')}`,
      src: image.url,
      alt: image.altText || `${impulse} — perspective ${imageIndex + 1}`
    }))
  };
}

const shopifyCatalog = window.EKKOMI_SHOPIFY_CATALOG;
const mensJackets = (shopifyCatalog?.men || []).map((product, index) => mapShopifyProduct(product, 'men', index));
const womensJackets = (shopifyCatalog?.women || []).map((product, index) => mapShopifyProduct(product, 'women', index));
const allCollectionJackets = [...mensJackets, ...womensJackets];
const JACKET_CATALOG = {
  men: mensJackets.map((jacket) => ({ ...jacket, name: jacket.impulse })),
  women: womensJackets.map((jacket) => ({ ...jacket, name: jacket.impulse }))
};

const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const getSelectedVariant = (jacket, size = currentSelectedSize) =>
  jacket?.variants?.find((variant) => variant.id === currentSelectedVariantId)
  || jacket?.variants?.find((variant) => variant.size === size)
  || null;

const formatGBP = (amount, currencyCode = 'GBP') => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: currencyCode,
  useGrouping: false,
  maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
}).format(amount);

/* -------------------------------------------------------------------
   STATE & UTILITIES
   ------------------------------------------------------------------- */

const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let selectedJacketId = window.currentSelectedJacket?.id || '';
let activeDepartment = 'men';

// Expose state for external consumers (e.g. registration modal, telemetry)
window.currentSelectedJacket = mensJackets.find((jacket) => jacket.key === 'desire') || mensJackets[0] || null;
window.currentSelectedDepartment = 'men';

/* -------------------------------------------------------------------
   SMOOTH SCROLLING
   ------------------------------------------------------------------- */

function scrollToShowcase(smooth = true) {
  const showcase = document.getElementById('productShowcase');
  if (!showcase) return;
  const header = document.querySelector('.site-header');
  const navBar = document.querySelector('.collection-nav-bar');
  const offset = (header ? header.offsetHeight : 82) + (navBar ? navBar.offsetHeight : 50) + 16;
  const targetTop = showcase.getBoundingClientRect().top + window.pageYOffset - offset;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: (smooth && !isReducedMotion()) ? 'smooth' : 'auto'
  });
}

function scrollToDepartmentHeader(dept, smooth = true) {
  const targetId = dept === 'men' ? 'mens-department' : 'womens-department';
  const target = document.getElementById(targetId);
  if (!target) return;
  const header = document.querySelector('.site-header');
  const navBar = document.querySelector('.collection-nav-bar');
  const offset = (header ? header.offsetHeight : 82) + (navBar ? navBar.offsetHeight : 50) + 12;
  const targetTop = target.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: (smooth && !isReducedMotion()) ? 'smooth' : 'auto'
  });
}

/* -------------------------------------------------------------------
   DEPARTMENT TABS (MEN vs WOMEN SEPARATE SECTIONS)
   ------------------------------------------------------------------- */

function switchDepartment(dept, { syncJacket = true, scroll = false } = {}) {
  if (dept !== 'men' && dept !== 'women') return;
  activeDepartment = dept;
  window.currentSelectedDepartment = dept;
  document.body.dataset.activeDepartment = dept;

  const tabMen = document.getElementById('tab-gender-men');
  const tabWomen = document.getElementById('tab-gender-women');
  if (tabMen) {
    tabMen.classList.toggle('is-active', dept === 'men');
    tabMen.setAttribute('aria-selected', dept === 'men' ? 'true' : 'false');
  }
  if (tabWomen) {
    tabWomen.classList.toggle('is-active', dept === 'women');
    tabWomen.setAttribute('aria-selected', dept === 'women' ? 'true' : 'false');
  }

  const mensBlock = document.getElementById('mens-department');
  const womensBlock = document.getElementById('womens-department');

  if (dept === 'men') {
    if (womensBlock) {
      womensBlock.classList.remove('is-active');
      womensBlock.classList.add('is-hidden');
      womensBlock.style.display = 'none';
    }
    if (mensBlock) {
      mensBlock.style.display = 'block';
      mensBlock.classList.remove('is-hidden');
      mensBlock.classList.add('is-active');
      window.accordionMenAPI?.measure();
    }
  } else {
    if (mensBlock) {
      mensBlock.classList.remove('is-active');
      mensBlock.classList.add('is-hidden');
      mensBlock.style.display = 'none';
    }
    if (womensBlock) {
      womensBlock.style.display = 'block';
      womensBlock.classList.remove('is-hidden');
      womensBlock.classList.add('is-active');
      window.accordionWomenAPI?.measure();
    }
  }

  if (syncJacket) {
    // Pick the default/active jacket for this department
    const departmentJackets = dept === 'men' ? mensJackets : womensJackets;
    const target = departmentJackets.find((jacket) => jacket.key === 'desire') || departmentJackets[0];
    if (target) selectJacket(target.id, { scroll, fromDepartmentSwitch: true });
  }

  if (scroll) {
    scrollToDepartmentHeader(dept);
  }
}

/* -------------------------------------------------------------------
   DYNAMIC PRODUCT SHOWCASE (UPDATES IN-PLACE WITHOUT LONG SCROLLING)
   ------------------------------------------------------------------- */


/* -------------------------------------------------------------------
   SIZE GUIDE MODAL CONTROLLER (IOS SAFARI & CROSS-DEVICE COMPATIBLE)
   ------------------------------------------------------------------- */
let sizeGuidePrevFocus = null;
let sizeGuideScrollY = 0;

function openSizeGuide() {
  const modal = document.getElementById('sizeGuideModal');
  if (!modal) return;
  sizeGuidePrevFocus = document.activeElement;

  // Capture current scroll position and lock background body on iOS Safari & Android
  sizeGuideScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.body.style.position = 'fixed';
  document.body.style.top = `-${sizeGuideScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
  document.body.classList.add('size-guide-open');

  modal.classList.add('is-active');
  modal.setAttribute('aria-hidden', 'false');

  // Reset scroll positions on open so columns and headers start in view
  const tableWrap = modal.querySelector('.size-guide-table-wrap');
  if (tableWrap) {
    tableWrap.scrollLeft = 0;
    tableWrap.scrollTop = 0;
  }
  const dialog = modal.querySelector('.size-guide-modal-dialog');
  if (dialog) {
    dialog.scrollTop = 0;
  }

  const closeBtn = document.getElementById('sizeGuideCloseBtn');
  if (closeBtn) {
    window.setTimeout(() => closeBtn.focus(), 60);
  }
}

function closeSizeGuide() {
  const modal = document.getElementById('sizeGuideModal');
  if (!modal) return;

  modal.classList.remove('is-active');
  modal.setAttribute('aria-hidden', 'true');

  // Restore background scroll position cleanly
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.paddingRight = '';
  document.body.classList.remove('size-guide-open');

  window.scrollTo(0, sizeGuideScrollY);

  if (sizeGuidePrevFocus && typeof sizeGuidePrevFocus.focus === 'function') {
    try { sizeGuidePrevFocus.focus(); } catch (e) {}
  }
}

function initSizeGuide() {
  const modal = document.getElementById('sizeGuideModal');
  if (!modal) return;
  const closeBtn = document.getElementById('sizeGuideCloseBtn');
  if (closeBtn && !closeBtn._sizeGuideBound) {
    closeBtn._sizeGuideBound = true;
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeSizeGuide();
    });
  }

  if (!modal._sizeGuideBound) {
    modal._sizeGuideBound = true;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeSizeGuide();
      }
    });
    // Ensure smooth scrolling inside modal without rubber-banding background
    modal.addEventListener('touchmove', (e) => {
      const scrollable = e.target.closest('.size-guide-table-wrap');
      if (!scrollable) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  if (!document._sizeGuideKeyBound) {
    document._sizeGuideKeyBound = true;
    document.addEventListener('keydown', (e) => {
      const activeModal = document.getElementById('sizeGuideModal');
      if (activeModal && activeModal.classList.contains('is-active') && e.key === 'Escape') {
        closeSizeGuide();
      }
    });
  }

  if (!document._sizeGuideClickBound) {
    document._sizeGuideClickBound = true;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#btnSizeGuide, .btn-size-guide');
      if (btn) {
        e.preventDefault();
        openSizeGuide();
      }
    });
  }
}

window.openEkkomiSizeGuide = openSizeGuide;
window.closeEkkomiSizeGuide = closeSizeGuide;

/* -------------------------------------------------------------------
   PRODUCT IMAGE ZOOM & LIGHTBOX MODAL CONTROLLER
   ------------------------------------------------------------------- */
let zoomModalState = {
  isOpen: false,
  jacket: null,
  viewIndex: 0,
  scale: 1.0,
  panX: 0,
  panY: 0,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  panInitialX: 0,
  panInitialY: 0,
  prevActiveElement: null
};

function updateZoomModalView() {
  const modal = document.getElementById('productZoomModal');
  if (!modal || !zoomModalState.jacket) return;
  const jacket = zoomModalState.jacket;
  const views = jacket.views || [];
  const view = views[zoomModalState.viewIndex] || views[0];
  if (!view) return;

  const img = document.getElementById('zoomModalImg');
  const jacketName = document.getElementById('zoomModalJacketName');
  const viewLabel = document.getElementById('zoomModalViewLabel');
  const counter = document.getElementById('zoomModalCounter');
  const prevBtn = document.getElementById('zoomPrevBtn');
  const nextBtn = document.getElementById('zoomNextBtn');
  const thumbWrap = document.getElementById('zoomModalThumbnails');

  if (img) {
    img.style.opacity = '0.4';
    const temp = new Image();
    temp.onload = () => {
      img.src = view.src;
      img.alt = view.alt || jacket.impulse;
      img.style.opacity = '1';
    };
    temp.src = view.src;
  }

  if (jacketName) {
    jacketName.textContent = `${jacket.impulse} - ${jacket.gender === 'men' ? 'MEN' : 'WOMEN'}`;
  }
  if (viewLabel) {
    viewLabel.textContent = view.label || `Perspective ${String(zoomModalState.viewIndex + 1).padStart(2, '0')}`;
  }
  if (counter) {
    counter.textContent = `${String(zoomModalState.viewIndex + 1).padStart(2, '0')} / ${String(views.length).padStart(2, '0')}`;
  }
  if (prevBtn) prevBtn.disabled = zoomModalState.viewIndex === 0;
  if (nextBtn) nextBtn.disabled = zoomModalState.viewIndex === views.length - 1;

  // Update active thumbnail
  if (thumbWrap) {
    const thumbs = thumbWrap.querySelectorAll('.zoom-thumbnail');
    thumbs.forEach((thumb, idx) => {
      const isActive = idx === zoomModalState.viewIndex;
      thumb.classList.toggle('is-active', isActive);
      thumb.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) {
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }

  // Reset zoom scale & pan on view switch
  resetZoomTransform(true);

  // Synchronise with main page gallery
  if (typeof window.setCollectionActiveView === 'function') {
    window.setCollectionActiveView(zoomModalState.viewIndex);
  }
}

function resetZoomTransform(animate = true) {
  zoomModalState.scale = 1.0;
  zoomModalState.panX = 0;
  zoomModalState.panY = 0;
  applyZoomTransform(animate);
}

function applyZoomTransform(animate = true) {
  const stage = document.getElementById('zoomModalStage');
  const indicator = document.getElementById('zoomLevelIndicator');
  const viewport = document.getElementById('zoomModalViewport');
  const panHint = document.getElementById('zoomPanHint');
  if (!stage) return;

  if (animate) {
    stage.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)';
  } else {
    stage.style.transition = 'none';
  }

  stage.style.transform = `translate3d(${zoomModalState.panX}px, ${zoomModalState.panY}px, 0) scale(${zoomModalState.scale})`;

  if (indicator) {
    indicator.textContent = `${Math.round(zoomModalState.scale * 100)}%`;
  }

  if (viewport) {
    viewport.classList.toggle('is-zoomed', zoomModalState.scale > 1.05);
    viewport.classList.toggle('is-dragging', zoomModalState.isPanning);
  }

  if (panHint) {
    panHint.classList.toggle('is-hidden', zoomModalState.scale > 1.05);
  }
}

function clampZoomPan() {
  if (zoomModalState.scale <= 1.0) {
    zoomModalState.panX = 0;
    zoomModalState.panY = 0;
    return;
  }
  const viewport = document.getElementById('zoomModalViewport');
  const img = document.getElementById('zoomModalImg');
  if (!viewport || !img) return;

  const vpRect = viewport.getBoundingClientRect();
  const scaledW = (img.offsetWidth || vpRect.width) * zoomModalState.scale;
  const scaledH = (img.offsetHeight || vpRect.height) * zoomModalState.scale;

  const maxPanX = Math.max(0, (scaledW - vpRect.width) / 2);
  const maxPanY = Math.max(0, (scaledH - vpRect.height) / 2);

  zoomModalState.panX = Math.max(-maxPanX, Math.min(maxPanX, zoomModalState.panX));
  zoomModalState.panY = Math.max(-maxPanY, Math.min(maxPanY, zoomModalState.panY));
}

function openProductZoomModal(jacket, viewIndex = 0, autoZoom = false, normX = 0.5, normY = 0.5) {
  const modal = document.getElementById('productZoomModal');
  if (!modal || !jacket) return;

  zoomModalState.isOpen = true;
  zoomModalState.jacket = jacket;
  zoomModalState.viewIndex = Math.max(0, Math.min(viewIndex, (jacket.views || []).length - 1));
  zoomModalState.prevActiveElement = document.activeElement;

  try {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  } catch (e) {}

  document.body.classList.add('zoom-modal-open');
  modal.classList.add('is-active');
  modal.setAttribute('aria-hidden', 'false');

  // Build thumbnails
  const thumbWrap = document.getElementById('zoomModalThumbnails');
  if (thumbWrap) {
    thumbWrap.innerHTML = (jacket.views || []).map((v, i) => `
      <button type="button" class="zoom-thumbnail${i === zoomModalState.viewIndex ? ' is-active' : ''}" data-index="${i}" role="tab" aria-label="${v.label}">
        <img src="${v.src}" alt="${v.alt || v.label}" loading="lazy" />
      </button>
    `).join('');

    thumbWrap.querySelectorAll('.zoom-thumbnail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        zoomModalState.viewIndex = Number(btn.dataset.index);
        updateZoomModalView();
      });
    });
  }

  updateZoomModalView();

  if (autoZoom) {
    setTimeout(() => {
      const viewport = document.getElementById('zoomModalViewport');
      if (viewport) {
        const vpRect = viewport.getBoundingClientRect();
        const offsetX = (normX - 0.5) * vpRect.width;
        const offsetY = (normY - 0.5) * vpRect.height;
        zoomModalState.scale = 2.2;
        zoomModalState.panX = -offsetX * (zoomModalState.scale - 1);
        zoomModalState.panY = -offsetY * (zoomModalState.scale - 1);
        clampZoomPan();
        applyZoomTransform(true);
      }
    }, 60);
  } else {
    resetZoomTransform(false);
  }

  const closeBtn = document.getElementById('zoomModalCloseBtn');
  if (closeBtn) {
    setTimeout(() => closeBtn.focus(), 60);
  }
}

function closeProductZoomModal() {
  const modal = document.getElementById('productZoomModal');
  if (!modal) return;

  zoomModalState.isOpen = false;
  modal.classList.remove('is-active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('zoom-modal-open');
  document.body.style.paddingRight = '';

  resetZoomTransform(false);

  if (zoomModalState.prevActiveElement && typeof zoomModalState.prevActiveElement.focus === 'function') {
    try { zoomModalState.prevActiveElement.focus(); } catch (e) {}
  }
}

function initProductZoomModal() {
  const modal = document.getElementById('productZoomModal');
  if (!modal || modal._zoomBound) return;
  modal._zoomBound = true;

  const closeBtn = document.getElementById('zoomModalCloseBtn');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');
  const prevBtn = document.getElementById('zoomPrevBtn');
  const nextBtn = document.getElementById('zoomNextBtn');
  const viewport = document.getElementById('zoomModalViewport');

  if (closeBtn) closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeProductZoomModal(); });

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      zoomModalState.scale = Math.min(4.0, Number((zoomModalState.scale + 0.5).toFixed(1)));
      clampZoomPan();
      applyZoomTransform(true);
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      zoomModalState.scale = Math.max(1.0, Number((zoomModalState.scale - 0.5).toFixed(1)));
      clampZoomPan();
      applyZoomTransform(true);
    });
  }

  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetZoomTransform(true);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (zoomModalState.viewIndex > 0) {
        zoomModalState.viewIndex--;
        updateZoomModalView();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const max = (zoomModalState.jacket?.views || []).length - 1;
      if (zoomModalState.viewIndex < max) {
        zoomModalState.viewIndex++;
        updateZoomModalView();
      }
    });
  }

  // Wheel zoom inside viewport
  if (viewport) {
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.35 : -0.35;
      zoomModalState.scale = Math.max(1.0, Math.min(4.0, Number((zoomModalState.scale + delta).toFixed(2))));
      clampZoomPan();
      applyZoomTransform(true);
    }, { passive: false });

    // One-tap zoom toggle & Double-click toggle
    let lastClickTime = 0;
    viewport.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const now = Date.now();
      if (now - lastClickTime < 320) {
        // Double click: toggle zoom
        if (zoomModalState.scale > 1.05) {
          resetZoomTransform(true);
        } else {
          zoomModalState.scale = 2.5;
          clampZoomPan();
          applyZoomTransform(true);
        }
      } else if (zoomModalState.scale <= 1.05) {
        // One-tap zoom: smoothly magnify directly at tap/click point
        const vpRect = viewport.getBoundingClientRect();
        const clickX = e.clientX - vpRect.left - vpRect.width / 2;
        const clickY = e.clientY - vpRect.top - vpRect.height / 2;
        zoomModalState.scale = 2.2;
        zoomModalState.panX = -clickX * (zoomModalState.scale - 1);
        zoomModalState.panY = -clickY * (zoomModalState.scale - 1);
        clampZoomPan();
        applyZoomTransform(true);
      } else {
        // One-tap reset: when already zoomed in, tapping resets to normal
        resetZoomTransform(true);
      }
      lastClickTime = now;
    });

    // Mouse drag to pan when zoomed
    viewport.addEventListener('mousedown', (e) => {
      if (zoomModalState.scale <= 1.05 || e.target.closest('button')) return;
      zoomModalState.isPanning = true;
      zoomModalState.panStartX = e.clientX;
      zoomModalState.panStartY = e.clientY;
      zoomModalState.panInitialX = zoomModalState.panX;
      zoomModalState.panInitialY = zoomModalState.panY;
      viewport.classList.add('is-dragging');
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!zoomModalState.isOpen || !zoomModalState.isPanning) return;
      const dx = e.clientX - zoomModalState.panStartX;
      const dy = e.clientY - zoomModalState.panStartY;
      zoomModalState.panX = zoomModalState.panInitialX + dx;
      zoomModalState.panY = zoomModalState.panInitialY + dy;
      clampZoomPan();
      applyZoomTransform(false);
    });

    window.addEventListener('mouseup', () => {
      if (!zoomModalState.isOpen || !zoomModalState.isPanning) return;
      zoomModalState.isPanning = false;
      if (viewport) viewport.classList.remove('is-dragging');
      applyZoomTransform(true);
    });

    // Touch events: pinch-to-zoom, pan, swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let initialPanX = 0;
    let initialPanY = 0;
    let initialPinchDist = 0;
    let initialPinchScale = 1.0;
    let isPinching = false;
    let isTouchPanning = false;

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        isTouchPanning = false;
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialPinchScale = zoomModalState.scale;
      } else if (e.touches.length === 1) {
        isPinching = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        initialPanX = zoomModalState.panX;
        initialPanY = zoomModalState.panY;
        if (zoomModalState.scale > 1.05) {
          isTouchPanning = true;
        }
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (initialPinchDist > 0) {
          const factor = currentDist / initialPinchDist;
          zoomModalState.scale = Math.max(1.0, Math.min(4.0, initialPinchScale * factor));
          clampZoomPan();
          applyZoomTransform(false);
        }
      } else if (isTouchPanning && e.touches.length === 1 && zoomModalState.scale > 1.05) {
        e.preventDefault();
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        zoomModalState.panX = initialPanX + dx;
        zoomModalState.panY = initialPanY + dy;
        clampZoomPan();
        applyZoomTransform(false);
      }
    }, { passive: false });

    viewport.addEventListener('touchend', (e) => {
      if (isPinching && e.touches.length < 2) {
        isPinching = false;
        applyZoomTransform(true);
      }
      if (isTouchPanning && e.touches.length === 0) {
        isTouchPanning = false;
        applyZoomTransform(true);
      }
      if (e.touches.length === 0 && !isPinching && zoomModalState.scale <= 1.05) {
        const dx = (e.changedTouches[0]?.clientX || 0) - touchStartX;
        const dy = (e.changedTouches[0]?.clientY || 0) - touchStartY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          const max = (zoomModalState.jacket?.views || []).length - 1;
          if (dx < 0 && zoomModalState.viewIndex < max) {
            zoomModalState.viewIndex++;
            updateZoomModalView();
          } else if (dx > 0 && zoomModalState.viewIndex > 0) {
            zoomModalState.viewIndex--;
            updateZoomModalView();
          }
        }
      }
    }, { passive: true });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!zoomModalState.isOpen) return;
    if (e.key === 'Escape') {
      closeProductZoomModal();
    } else if (e.key === 'ArrowLeft') {
      if (zoomModalState.viewIndex > 0) {
        zoomModalState.viewIndex--;
        updateZoomModalView();
      }
    } else if (e.key === 'ArrowRight') {
      const max = (zoomModalState.jacket?.views || []).length - 1;
      if (zoomModalState.viewIndex < max) {
        zoomModalState.viewIndex++;
        updateZoomModalView();
      }
    } else if (e.key === '+' || e.key === '=') {
      zoomModalState.scale = Math.min(4.0, Number((zoomModalState.scale + 0.5).toFixed(1)));
      clampZoomPan();
      applyZoomTransform(true);
    } else if (e.key === '-' || e.key === '_') {
      zoomModalState.scale = Math.max(1.0, Number((zoomModalState.scale - 0.5).toFixed(1)));
      clampZoomPan();
      applyZoomTransform(true);
    } else if (e.key === '0') {
      resetZoomTransform(true);
    }
  });

  // Backdrop click closes when not zoomed
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeProductZoomModal();
    }
  });
}

window.openEkkomiZoomModal = openProductZoomModal;
window.closeEkkomiZoomModal = closeProductZoomModal;


function renderShowcase(jacket) {
  const initialVariant = jacket.variants.find((variant) => variant.size === 'M' && isVariantAvailable(variant))
    || jacket.variants.find((variant) => STANDARD_SIZES.includes(variant.size) && isVariantAvailable(variant))
    || jacket.variants.find((variant) => STANDARD_SIZES.includes(variant.size));
  currentSelectedSize = initialVariant?.size || null;
  currentSelectedVariantId = initialVariant?.id || null;
  currentSelectedQuantity = 1;
  const showcase = document.getElementById('productShowcase');
  if (!showcase) return;

  // Subtle luxury fade transition
  showcase.classList.add('is-updating');

  setTimeout(() => {
    const currentList = jacket.gender === 'men' ? mensJackets : womensJackets;
    const currentIndex = currentList.findIndex(j => j.id === jacket.id);
    const prevIndex = (currentIndex - 1 + currentList.length) % currentList.length;
    const nextIndex = (currentIndex + 1) % currentList.length;
    const prevJacket = currentList[prevIndex];
    const nextJacket = currentList[nextIndex];

    const departmentTitle = jacket.gender === 'men' ? "Men's Collection" : "Women's Collection";
    const safeTitle = escapeHTML(jacket.impulse);
    const safeDepartmentTitle = escapeHTML(departmentTitle);
    const carouselId = jacket.gender === 'men' ? 'accordionGalleryMen' : 'accordionGalleryWomen';

    const craftHtml = jacket.craft.map(c => `
      <div class="craft-item">
        <dt>${escapeHTML(c.title)}</dt>
        <dd>${escapeHTML(c.desc)}</dd>
      </div>
    `).join('');

    const firstView = jacket.views[0] || { src: '', alt: jacket.impulse, label: 'Product image unavailable' };
    const selectedPrice = Number.parseFloat(initialVariant?.price?.amount || '0');
    const compareAtPrice = Number.parseFloat(initialVariant?.compareAtPrice?.amount || '0');
    const currencyCode = initialVariant?.price?.currencyCode || jacket.currencyCode || 'GBP';
    const hasImage = Boolean(firstView.src);
    const sizeControlsHtml = jacket.sizes.map((size) => {
      const selected = size === currentSelectedSize;
      return `<button type="button" class="size-pill${selected ? ' is-active' : ''}" data-size="${escapeHTML(size)}" role="radio" aria-label="${escapeHTML(size)}" aria-checked="${selected}"><span class="size-pill-label">${escapeHTML(size)}</span><span class="size-pill-status is-hidden">SOLD OUT</span></button>`;
    }).join('');
    const viewsHtml = jacket.views.map((v, i) => `
      <button class="gallery-view-card${i === 0 ? ' is-active' : ''}"
              type="button"
              role="listitem"
              aria-label="View ${escapeHTML(v.label)} for ${safeTitle}"
              aria-pressed="${i === 0 ? 'true' : 'false'}"
              data-jacket-id="${jacket.id}"
              data-view-index="${i}"
              data-src="${escapeHTML(v.src)}"
              data-alt="${escapeHTML(v.alt)}"
              data-label="${escapeHTML(v.label)}">
        <div class="view-card__frame">
          <img class="view-card__img"
               src="${escapeHTML(v.src)}"
               alt="${escapeHTML(v.alt)}"
               loading="lazy"
               decoding="async"
               width="400"
               height="600" />
          <span class="view-card__overlay" aria-hidden="true"></span>
        </div>
      </button>
    `).join('');

    showcase.innerHTML = `
      <div class="section jacket-detail-inner">
        <div class="showcase-unified-grid">
          <!-- Left Column: Sticky Hero Stage Gallery -->
          <div class="showcase-stage-col">
            <div class="gallery-stage" id="showcaseStage">
              <div class="gallery-stage__frame" role="button" tabindex="0" aria-label="Open full-screen image viewer: ${firstView.label}">
                ${hasImage ? `<img class="gallery-stage__img"
                     id="showcaseStageImg"
                     src="${escapeHTML(firstView.src)}"
                     alt="${escapeHTML(firstView.alt)}"
                     loading="eager"
                     decoding="async"
                     fetchpriority="high"
                     width="1200"
                     height="1800" />
                <button type="button" class="gallery-stage__zoom-btn" id="stageZoomTriggerBtn" aria-label="Click to zoom photograph">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span class="zoom-btn-tooltip" role="tooltip">Click to zoom</span>
                </button>
                <button type="button" class="gallery-nav-arrow gallery-nav-arrow--prev" id="stagePrevArrow" aria-label="Previous perspective" disabled>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button type="button" class="gallery-nav-arrow gallery-nav-arrow--next" id="stageNextArrow" aria-label="Next perspective" ${jacket.views.length <= 1 ? 'disabled' : ''}>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>` : '<div class="gallery-image-unavailable" role="img" aria-label="Product image unavailable">Product image unavailable</div>'}
                <div class="gallery-mobile-controls" aria-label="Product image navigation">
                  <button type="button" class="gallery-mobile-arrow gallery-mobile-arrow--prev" aria-label="Previous product image" disabled>
                    <span aria-hidden="true">&larr;</span>
                  </button>
                  <button type="button" class="gallery-mobile-arrow gallery-mobile-arrow--next" aria-label="Next product image" ${jacket.views.length <= 1 ? 'disabled' : ''}>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Unified Story, Perspectives & Craftsmanship -->
          <div class="showcase-narrative-col">
            <!-- Jacket Title Row -->
            <div class="jacket-title-row">
              <h3 class="jacket-name" id="showcaseJacketTitle">${safeTitle}</h3>
              <span class="jacket-stock-badge is-hidden" id="productStockStatus" role="status">OUT OF STOCK</span>
              <div class="jacket-meta-tags">
                ${jacket.colour ? `<span class="jacket-colour-tag" aria-label="Colour: ${escapeHTML(jacket.colour)}">
                  <span class="colour-swatch" style="background-color: ${escapeHTML(jacket.hex)};" aria-hidden="true"></span>
                  ${escapeHTML(jacket.colour)}
                </span>` : ''}
              </div>
            </div>

            <div class="product-offer-row">
              <span class="product-offer-label">Introductory Offer</span>
            </div>

            <!-- Price & Tax Row -->
            <div class="product-price-row">
              <span class="product-original-price${compareAtPrice > selectedPrice ? '' : ' is-hidden'}">${compareAtPrice > selectedPrice ? formatGBP(compareAtPrice, currencyCode) : ''}</span>
              <span class="product-price">${formatGBP(selectedPrice, currencyCode)}</span>
              <span class="product-tax-note">Taxes &amp; duties included &middot; Complimentary delivery</span>
            </div>

            <!-- Product description sits with the price and product details. -->
            <p class="jacket-narrative jacket-narrative--intro">${escapeHTML(jacket.narrative)}</p>

            <!-- Commerce Controls Block (Gargee Functional Adaptation) -->
            <div class="product-commerce-controls" id="productCommerceControls">
              <!-- Size Selection -->
              <div class="product-option-group product-size-group">
                <div class="product-option-header">
                  <span class="product-option-label">Select Size</span>
                </div>
                <button type="button" class="btn-size-guide" id="btnSizeGuide" aria-label="Open Size Guide" aria-haspopup="dialog">SIZE GUIDE</button>
                <div class="product-size-pills" role="radiogroup" aria-label="Select size for ${safeTitle}">
                  ${sizeControlsHtml || '<span class="product-sizes-unavailable">No standard sizes are listed.</span>'}
                  <button type="button" class="size-pill size-pill--custom" data-size="Custom" role="radio" aria-checked="false">Custom</button>
                </div>
                <div class="product-waitlist-row is-hidden" id="productWaitlistRow" aria-label="Waitlist for unavailable sizes"></div>
                <p class="custom-sizing-note is-hidden" id="customSizingNote">
                  Bespoke sizing selected &mdash; please contact our stylist to arrange your made-to-measure specifications.
                </p>
              </div>

              <!-- Quantity Selector -->
              <div class="product-option-group product-quantity-group">
                <span class="product-option-label">Quantity</span>
                <div class="product-quantity-counter" role="group" aria-label="Product quantity">
                  <button type="button" class="qty-btn qty-btn--minus" id="qtyMinusBtn" aria-label="Decrease quantity" disabled>
                    <span aria-hidden="true">&minus;</span>
                  </button>
                  <span class="qty-value" id="productQtyDisplay" aria-live="polite">1</span>
                  <button type="button" class="qty-btn qty-btn--plus" id="qtyPlusBtn" aria-label="Increase quantity">
                    <span aria-hidden="true">&plus;</span>
                  </button>
                </div>
                <p class="inventory-quantity-message is-hidden" id="inventoryQuantityMessage" role="status" aria-live="polite"></p>
                <button type="button" class="inventory-retry-btn is-hidden" id="inventoryRetryBtn">Check availability again</button>
              </div>

              <!-- CTA Stack -->
              <div class="product-cta-stack">
                <!-- Dual WhatsApp Enquiry Buttons (Equal Width Side-by-Side) -->
                <div class="whatsapp-cta-grid">
                  <button type="button" class="btn-whatsapp btn-whatsapp-stylist" id="btnWhatsappStylist" aria-label="Speak to Our Stylist on WhatsApp">
                    <svg class="wa-btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.02 8.48 7.02 9.68C7.02 10.88 7.9 12.03 8.02 12.19C8.14 12.35 9.73 14.81 12.17 15.86C12.75 16.11 13.2 16.26 13.55 16.37C14.13 16.56 14.67 16.53 15.09 16.47C15.56 16.4 16.53 15.88 16.73 15.31C16.94 14.74 16.94 14.25 16.88 14.15C16.81 14.05 16.66 13.99 16.43 13.88C16.2 13.77 15.07 13.21 14.86 13.13C14.65 13.05 14.5 13.01 14.34 13.24C14.19 13.47 13.75 14.01 13.62 14.17C13.49 14.33 13.36 14.35 13.13 14.23C12.9 14.12 11.93 13.8 10.78 12.78C9.89 11.98 9.28 11 9.05 10.61C8.82 10.22 9.03 10.01 9.14 9.9C9.25 9.79 9.38 9.61 9.5 9.47C9.62 9.33 9.66 9.23 9.74 9.07C9.82 8.91 9.78 8.77 9.72 8.65C9.66 8.53 9.22 7.45 9.04 7.01C8.86 6.58 8.68 6.64 8.53 6.63L8.53 7.33Z"/>
                    </svg>
                    <span>SPEAK TO OUR STYLIST</span>
                  </button>
                  <button type="button" class="btn-whatsapp btn-whatsapp-custom" id="btnWhatsappCustom" aria-label="Customise Your Jacket on WhatsApp">
                    <svg class="wa-btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.02 8.48 7.02 9.68C7.02 10.88 7.9 12.03 8.02 12.19C8.14 12.35 9.73 14.81 12.17 15.86C12.75 16.11 13.2 16.26 13.55 16.37C14.13 16.56 14.67 16.53 15.09 16.47C15.56 16.4 16.53 15.88 16.73 15.31C16.94 14.74 16.94 14.25 16.88 14.15C16.81 14.05 16.66 13.99 16.43 13.88C16.2 13.77 15.07 13.21 14.86 13.13C14.65 13.05 14.5 13.01 14.34 13.24C14.19 13.47 13.75 14.01 13.62 14.17C13.49 14.33 13.36 14.35 13.13 14.23C12.9 14.12 11.93 13.8 10.78 12.78C9.89 11.98 9.28 11 9.05 10.61C8.82 10.22 9.03 10.01 9.14 9.9C9.25 9.79 9.38 9.61 9.5 9.47C9.62 9.33 9.66 9.23 9.74 9.07C9.82 8.91 9.78 8.77 9.72 8.65C9.66 8.53 9.22 7.45 9.04 7.01C8.86 6.58 8.68 6.64 8.53 6.63L8.53 7.33Z"/>
                    </svg>
                    <span>CUSTOMISE YOUR JACKET</span>
                  </button>
                </div>

                <!-- Purchase Buttons -->
                <button type="button" class="btn-purchase btn-add-to-bag" id="btnAddToBag" disabled>
                  ADD TO BAG
                </button>
              </div>
            </div>

            <!-- Photographic Perspectives Gallery -->
            <div class="jacket-perspectives-block" data-gallery-jacket="${escapeHTML(jacket.id)}">
              <div class="gallery-section-bar">
                <h4 class="gallery-heading">Photographic Perspectives</h4>
                <span class="gallery-counter-tag">${jacket.views.length} Perspectives</span>
              </div>
              <div class="gallery-views-grid" role="list" aria-label="${safeDepartmentTitle} ${safeTitle} product images">
                ${viewsHtml}
              </div>
            </div>

            <!-- Craftsmanship Specifications -->
            ${craftHtml ? `<dl class="jacket-craft-list">${craftHtml}</dl>` : ''}

          </div>
        </div>

        <!-- Understated Product Navigation Bar -->
        <nav class="showcase-bottom-nav" aria-label="Jacket navigation">
          <button type="button" class="showcase-nav-btn prev-jacket-btn" id="prevJacketBtn" aria-label="Previous jacket: ${escapeHTML(prevJacket.number)} ${escapeHTML(prevJacket.impulse)}">
            <span class="nav-arrow" aria-hidden="true">&larr;</span>
            <span class="nav-label-wrap">
              <span class="nav-jacket-name">${escapeHTML(prevJacket.impulse)}</span>
            </span>
          </button>

          <a class="nav-back-link" id="backToCarouselLink" href="#${carouselId}" aria-label="Return to ${safeDepartmentTitle} carousel">
            Back to Carousel
          </a>

          <button type="button" class="showcase-nav-btn next-jacket-btn" id="nextJacketBtn" aria-label="Next jacket: ${escapeHTML(nextJacket.number)} ${escapeHTML(nextJacket.impulse)}">
            <span class="nav-label-wrap">
              <span class="nav-jacket-name">${escapeHTML(nextJacket.impulse)}</span>
            </span>
            <span class="nav-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </nav>
      </div>    `;

    // Bind thumbnail click events for main stage swapping
    const stage = document.getElementById('showcaseStage');
    const stageImg = document.getElementById('showcaseStageImg');
    const cards = showcase.querySelectorAll('.gallery-view-card');
    const frame = showcase.querySelector('.gallery-stage__frame');
    const zoomBtn = showcase.querySelector('#stageZoomTriggerBtn');
    const mobileCounter = showcase.querySelector('.gallery-mobile-counter');
    const mobilePrev = showcase.querySelector('.gallery-mobile-arrow--prev');
    const mobileNext = showcase.querySelector('.gallery-mobile-arrow--next');
    const originalPriceEl = showcase.querySelector('.product-original-price');
    const currentPriceEl = showcase.querySelector('.product-price');
    const addBagBtn = showcase.querySelector('#btnAddToBag');
    const stockStatus = showcase.querySelector('#productStockStatus');
    const waitlistRow = showcase.querySelector('#productWaitlistRow');
    const quantityMessage = showcase.querySelector('#inventoryQuantityMessage');
    const inventoryRetryBtn = showcase.querySelector('#inventoryRetryBtn');
    const minusBtn = document.getElementById('qtyMinusBtn');
    const plusBtn = document.getElementById('qtyPlusBtn');
    const qtyDisplay = document.getElementById('productQtyDisplay');

    const setInventoryMessage = (message) => {
      if (!quantityMessage) return;
      quantityMessage.textContent = message;
      quantityMessage.classList.toggle('is-hidden', !message);
    };

    let inventoryRefreshVerified = false;
    let inventoryVerificationFailed = false;
    const applyInventoryToSizeControls = () => {
      const hasStock = inventoryRefreshVerified && productHasAvailableStandardSize(jacket);
      const confirmedSoldOut = inventoryRefreshVerified && productIsConfirmedSoldOut(jacket);
      jacket.inStock = inventoryRefreshVerified ? hasStock : null;
      if (stockStatus) stockStatus.classList.toggle('is-hidden', !confirmedSoldOut);
      if (waitlistRow) {
        const soldOutSizes = inventoryRefreshVerified
          ? STANDARD_SIZES.filter((size) => isVariantSoldOut(jacket.variants.find((variant) => variant.size === size)))
          : [];
        waitlistRow.innerHTML = soldOutSizes.length
          ? `<span class="waitlist-row-text">Unavailable sizes:</span>${soldOutSizes.map((size) => `<button type="button" class="btn-link-waitlist btn-notify-when-available" data-notify-jacket data-size="${size}" aria-label="Join the waitlist for size ${size}">Join waitlist · ${size}</button>`).join('')}`
          : '';
        waitlistRow.classList.toggle('is-hidden', soldOutSizes.length === 0);
      }
      sizePills.forEach((pill) => {
        if (pill.dataset.size === 'Custom') return;
        const variant = jacket.variants.find((item) => item.size === pill.dataset.size);
        const availability = getVariantAvailability(variant);
        const soldOut = inventoryRefreshVerified && availability === false;
        pill.disabled = soldOut;
        pill.classList.toggle('is-sold-out', soldOut);
        const availabilityNotConfirmed = !inventoryRefreshVerified || availability === null;
        pill.setAttribute('aria-label', `${pill.dataset.size}${soldOut ? ', sold out' : availabilityNotConfirmed ? ', availability not confirmed' : ''}`);
        const soldOutLabel = pill.querySelector('.size-pill-status');
        if (soldOutLabel) {
          soldOutLabel.textContent = 'SOLD OUT';
          soldOutLabel.classList.toggle('is-hidden', !soldOut);
        }
      });
    };

    const syncSelectedVariant = () => {
      const variant = getSelectedVariant(jacket);
      currentSelectedVariantId = variant?.id || null;
      const amount = Number.parseFloat(variant?.price?.amount || '0');
      const currency = variant?.price?.currencyCode || jacket.currencyCode || 'GBP';
      const compareAt = Number.parseFloat(variant?.compareAtPrice?.amount || '0');
      if (currentPriceEl) currentPriceEl.textContent = formatGBP(amount, currency);
      if (originalPriceEl) {
        originalPriceEl.textContent = compareAt > amount ? formatGBP(compareAt, currency) : '';
        originalPriceEl.classList.toggle('is-hidden', !(compareAt > amount));
      }
      const isCustom = currentSelectedSize === 'Custom';
      const variantAvailable = inventoryRefreshVerified && isVariantAvailable(variant);
      const maxQuantity = isCustom ? MAX_ORDER_QUANTITY : getVariantQuantityLimit(variant);
      if (!isCustom && (maxQuantity === 0 || currentSelectedQuantity > maxQuantity)) {
        currentSelectedQuantity = maxQuantity || 1;
        if (qtyDisplay) qtyDisplay.textContent = String(currentSelectedQuantity);
      }
      const hasStock = inventoryRefreshVerified && productHasAvailableStandardSize(jacket);
      const waitlistOnly = !isCustom && inventoryRefreshVerified && productIsConfirmedSoldOut(jacket);
      const canProceed = isCustom || (hasStock && variantAvailable && currentSelectedQuantity <= maxQuantity);
      if (addBagBtn) {
        addBagBtn.textContent = waitlistOnly ? 'JOIN THE WAITLIST' : 'ADD TO BAG';
        addBagBtn.setAttribute('aria-label', waitlistOnly ? `Join the waitlist for ${jacket.impulse}` : 'Add to bag');
        addBagBtn.classList.toggle('is-waitlist-cta', waitlistOnly);
        addBagBtn.disabled = waitlistOnly ? false : !canProceed;
      }
      if (plusBtn) plusBtn.disabled = isCustom ? currentSelectedQuantity >= MAX_ORDER_QUANTITY : !variantAvailable || currentSelectedQuantity >= maxQuantity;
      if (minusBtn) minusBtn.disabled = currentSelectedQuantity <= 1;

      if (isCustom) {
        setInventoryMessage('');
        if (inventoryRetryBtn) inventoryRetryBtn.classList.add('is-hidden');
      } else if (!inventoryRefreshVerified) {
        setInventoryMessage(inventoryVerificationFailed
          ? 'Live stock could not be verified. Please check again before purchasing.'
          : 'Checking current availability…');
        if (inventoryRetryBtn) inventoryRetryBtn.classList.toggle('is-hidden', !inventoryVerificationFailed);
      } else if (!variantAvailable) {
        setInventoryMessage(isVariantSoldOut(variant)
          ? 'This size is sold out. Join the waitlist or choose another size.'
          : 'Availability for this size could not be confirmed. Please try again shortly.');
        if (inventoryRetryBtn) inventoryRetryBtn.classList.add('is-hidden');
      } else if (variant?.quantityAvailable == null) {
        setInventoryMessage(currentSelectedQuantity >= maxQuantity
          ? 'Live stock quantity is unavailable, so quantity is temporarily limited to 1.'
          : '');
        if (inventoryRetryBtn) inventoryRetryBtn.classList.add('is-hidden');
      } else if (currentSelectedQuantity >= maxQuantity) {
        setInventoryMessage(`Maximum available quantity: ${maxQuantity}.`);
        if (inventoryRetryBtn) inventoryRetryBtn.classList.add('is-hidden');
      } else {
        setInventoryMessage('');
        if (inventoryRetryBtn) inventoryRetryBtn.classList.add('is-hidden');
      }
    };

    let inventoryRefreshPromise = null;
    const refreshInventory = () => {
      if (!showcase.isConnected || window.currentSelectedJacket?.id !== jacket.id) {
        return Promise.resolve(false);
      }
      if (inventoryRefreshPromise) return inventoryRefreshPromise;
      const ids = jacket.variants.map((variant) => variant.id);
      if (!ids.length) return Promise.resolve(false);
      inventoryRefreshPromise = fetch('/api/shopify/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ variantIds: ids })
      }).then(async (response) => {
        if (!response.ok) throw new Error('Shopify inventory could not be refreshed.');
        const result = await response.json();
        if (!Array.isArray(result.variants)) throw new Error('Shopify inventory response was invalid.');
        const updated = new Map(result.variants.map((variant) => [variant.id, variant]));
        if (ids.some((id) => !updated.has(id))) throw new Error('Shopify returned incomplete inventory.');
        jacket.variants = jacket.variants.map((variant) => ({
          ...variant,
          ...updated.get(variant.id)
        }));
        if (window.currentSelectedJacket?.id !== jacket.id) return false;
        inventoryRefreshVerified = true;
        inventoryVerificationFailed = false;
        applyInventoryToSizeControls();
        syncSelectedVariant();
        return true;
      }).catch(() => {
        inventoryRefreshVerified = false;
        inventoryVerificationFailed = true;
        applyInventoryToSizeControls();
        syncSelectedVariant();
        return false;
      }).finally(() => {
        inventoryRefreshPromise = null;
      });
      return inventoryRefreshPromise;
    };
    refreshActiveProductInventory = refreshInventory;
    if (inventoryRetryBtn) inventoryRetryBtn.addEventListener('click', () => { void refreshInventory(); });

    let activeViewIndex = 0;
    const setActiveView = (index) => {
      if (!cards.length) return;
      activeViewIndex = Math.max(0, Math.min(index, cards.length - 1));
      const card = cards[activeViewIndex];
      const src = card.dataset.src;
      const alt = card.dataset.alt;

      cards.forEach((item, itemIndex) => {
        item.classList.toggle('is-active', itemIndex === activeViewIndex);
        item.setAttribute('aria-pressed', itemIndex === activeViewIndex ? 'true' : 'false');
      });
      if (stage && stageImg) {
        stage.classList.add('is-switching');
        window.setTimeout(() => {
          stageImg.src = src;
          stageImg.alt = alt;
          stage.classList.remove('is-switching');
        }, 140);
      }
      if (mobileCounter) mobileCounter.textContent = `${String(activeViewIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
      if (mobilePrev) mobilePrev.disabled = activeViewIndex === 0;
      if (mobileNext) mobileNext.disabled = activeViewIndex === cards.length - 1;
    };

    if (stagePrevArrow) {
      stagePrevArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveView(activeViewIndex - 1);
      });
    }
    if (stageNextArrow) {
      stageNextArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveView(activeViewIndex + 1);
      });
    }
    if (zoomBtn) {
      zoomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openProductZoomModal(jacket, activeViewIndex);
      });
    }
    if (mobilePrev) mobilePrev.addEventListener('click', () => setActiveView(activeViewIndex - 1));
    if (mobileNext) mobileNext.addEventListener('click', () => setActiveView(activeViewIndex + 1));

    // Expose setActiveView globally for Zoom Lightbox synchronisation
    window.setCollectionActiveView = setActiveView;

    // One-Tap Zoom / Manual Zoom Interaction (No intrusive automatic hover magnifying glass)
    if (frame) {
      // One-tap zoom on photograph
      frame.addEventListener('click', (e) => {
        if (e.target.closest('.gallery-nav-arrow') || e.target.closest('.gallery-mobile-arrow')) return;
        const isTriggerBtn = !!e.target.closest('.gallery-stage__zoom-btn');
        const rect = frame.getBoundingClientRect();
        const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        // If clicking photo directly, open and zoom in at tapped spot (one-tap zoom). If clicking button, open fit view.
        openProductZoomModal(jacket, activeViewIndex, !isTriggerBtn, normX, normY);
      });

      // Touch events for mobile: swipe to navigate vs clean tap to open lightbox
      let pointerStart = null;
      let pointerMoved = false;
      frame.addEventListener('pointerdown', (event) => {
        if (event.target.closest('.gallery-mobile-arrow')) return;
        pointerStart = { x: event.clientX, y: event.clientY, time: Date.now() };
        pointerMoved = false;
      }, { passive: true });

      frame.addEventListener('pointermove', (event) => {
        if (!pointerStart) return;
        if (Math.abs(event.clientX - pointerStart.x) > 10 || Math.abs(event.clientY - pointerStart.y) > 10) {
          pointerMoved = true;
        }
      }, { passive: true });

      frame.addEventListener('pointerup', (event) => {
        if (!pointerStart) return;
        const deltaX = event.clientX - pointerStart.x;
        const deltaY = event.clientY - pointerStart.y;
        const duration = Date.now() - pointerStart.time;
        pointerStart = null;

        if (Math.abs(deltaX) >= 42 && Math.abs(deltaX) >= Math.abs(deltaY) * 1.2) {
          setActiveView(activeViewIndex + (deltaX < 0 ? 1 : -1));
          return;
        }

        if (event.pointerType === 'touch' && !pointerMoved && duration < 500 && !event.target.closest('.gallery-mobile-arrow')) {
          openProductZoomModal(jacket, activeViewIndex);
        }
      }, { passive: true });

      frame.addEventListener('pointercancel', () => { pointerStart = null; }, { passive: true });
    }

    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveView(Number(card.dataset.viewIndex));
      });
    });

    // Bind Previous / Next Navigation (Both bottom buttons & top quick buttons)
    const prevBtn = document.getElementById('prevJacketBtn');
    const nextBtn = document.getElementById('nextJacketBtn');
    const prevQuick = document.getElementById('prevQuickBtn');
    const nextQuick = document.getElementById('nextQuickBtn');

    const handlePrev = (e) => {
      e.preventDefault();
      selectJacket(prevJacket.id, { scroll: true, userInitiated: true });
    };

    const handleNext = (e) => {
      e.preventDefault();
      selectJacket(nextJacket.id, { scroll: true, userInitiated: true });
    };

    if (prevBtn) prevBtn.addEventListener('click', handlePrev);
    if (nextBtn) nextBtn.addEventListener('click', handleNext);
    if (prevQuick) prevQuick.addEventListener('click', handlePrev);
    if (nextQuick) nextQuick.addEventListener('click', handleNext);

    // Size pills selection
    const sizePills = showcase.querySelectorAll('.size-pill');
    const customNote = document.getElementById('customSizingNote');
    sizePills.forEach(pill => {
      pill.addEventListener('click', () => {
        sizePills.forEach(p => {
          p.classList.remove('is-active');
          p.setAttribute('aria-checked', 'false');
        });
        pill.classList.add('is-active');
        pill.setAttribute('aria-checked', 'true');
        currentSelectedSize = pill.dataset.size;
        if (currentSelectedSize !== 'Custom') {
          const variant = jacket.variants.find((item) => item.size === currentSelectedSize);
          currentSelectedVariantId = variant?.id || null;
          currentSelectedQuantity = 1;
          if (qtyDisplay) qtyDisplay.textContent = '1';
        }
        syncSelectedVariant();
        if (currentSelectedSize !== 'Custom') void refreshInventory();
        if (customNote) {
          if (currentSelectedSize === 'Custom') {
            customNote.classList.remove('is-hidden');
          } else {
            customNote.classList.add('is-hidden');
          }
        }
      });
    });

    applyInventoryToSizeControls();
    syncSelectedVariant();
    void refreshInventory();

    // Quantity selector
    const updateQty = (newQty) => {
      const isCustom = currentSelectedSize === 'Custom';
      const variant = getSelectedVariant(jacket);
      const maximum = isCustom ? MAX_ORDER_QUANTITY : getVariantQuantityLimit(variant);
      if (newQty > maximum) {
        if (!isCustom && variant?.quantityAvailable == null && isVariantAvailable(variant)) {
          setInventoryMessage('Live stock quantity is unavailable, so quantity is temporarily limited to 1.');
        } else if (maximum > 0) {
          setInventoryMessage(`Maximum available quantity: ${maximum}.`);
        }
        return;
      }
      currentSelectedQuantity = Math.max(1, Math.min(maximum, newQty));
      if (qtyDisplay) qtyDisplay.textContent = String(currentSelectedQuantity);
      if (minusBtn) minusBtn.disabled = currentSelectedQuantity <= 1;
      syncSelectedVariant();
    };

    if (minusBtn) minusBtn.addEventListener('click', () => updateQty(currentSelectedQuantity - 1));
    if (plusBtn) plusBtn.addEventListener('click', () => updateQty(currentSelectedQuantity + 1));

    // WhatsApp Stylist CTA
    const stylistBtn = document.getElementById('btnWhatsappStylist');
    if (stylistBtn) {
      stylistBtn.addEventListener('click', () => {
        const productName = jacket.impulse;
        const currentUrl = `${window.location.origin}/collection#${jacket.key}`;
        const message = `Hello Ekkomi, I'm interested in the ${productName} and would love to speak with your stylist. Could you please assist me?\n\nProduct: ${productName}\nProduct URL: ${currentUrl}`;
        const waUrl = `https://wa.me/${EKKOMI_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      });
    }

    // WhatsApp Customise CTA
    const customBtn = document.getElementById('btnWhatsappCustom');
    if (customBtn) {
      customBtn.addEventListener('click', () => {
        const productName = jacket.impulse;
        const currentUrl = `${window.location.origin}/collection#${jacket.key}`;
        const message = `Hello Ekkomi, I'm interested in the ${productName} and would like to explore customisation possibilities. Could you please guide me?\n\nProduct: ${productName}\nProduct URL: ${currentUrl}`;
        const waUrl = `https://wa.me/${EKKOMI_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      });
    }

    // Size Guide Trigger
    const sizeGuideBtn = document.getElementById('btnSizeGuide');
    if (sizeGuideBtn) {
      sizeGuideBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSizeGuide();
      });
    }

    // Add to Bag. Standard variants use Shopify Cart API; CUSTOM remains a stylist WhatsApp enquiry.
    let addToBagPending = false;
    const openWaitlistForProduct = (size = null) => {
      window.EkkomiWaitlist?.open({
        collection: jacket.gender === 'women' ? 'women' : 'men',
        jacketKey: jacket.key,
        jacketName: jacket.impulse,
        jacketHex: jacket.hex,
        jacketColour: jacket.colour,
        size,
        outOfStock: true
      });
    };
    const handleAddToBag = async () => {
      if (addToBagPending) return;
      if (currentSelectedSize === 'Custom') {
        const productName = jacket.impulse;
        const currentUrl = `${window.location.origin}/collection#${jacket.key}`;
        const colourLine = jacket.colour ? `\nColour: ${jacket.colour}` : '';
        const customMessage = `Hello Ekkomi, I'm interested in a bespoke custom-fitted ${productName} (Quantity: ${currentSelectedQuantity}) and would like to explore customisation possibilities with your stylist.${colourLine}\n\nProduct: ${productName}\nQuantity: ${currentSelectedQuantity}\nProduct URL: ${currentUrl}`;
        const customWaUrl = `https://wa.me/${EKKOMI_WHATSAPP_NUMBER}?text=${encodeURIComponent(customMessage)}`;
        window.open(customWaUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      if (inventoryRefreshVerified && productIsConfirmedSoldOut(jacket)) {
        openWaitlistForProduct();
        return;
      }

      const requestedQuantity = currentSelectedQuantity;
      const inventoryVerified = await refreshInventory();
      if (!inventoryVerified) {
        setInventoryMessage('We could not verify live availability. Please try again shortly.');
        return;
      }

      const selectedVariant = getSelectedVariant(jacket);
      if (productIsConfirmedSoldOut(jacket)) {
        openWaitlistForProduct();
        return;
      }
      if (isVariantSoldOut(selectedVariant)) {
        openWaitlistForProduct(currentSelectedSize);
        return;
      }
      const maximum = getVariantQuantityLimit(selectedVariant);
      if (!isVariantAvailable(selectedVariant)) {
        setInventoryMessage('This size is sold out. Choose another size.');
        return;
      }
      if (requestedQuantity > maximum) {
        setInventoryMessage(`Stock changed. The maximum available quantity is now ${maximum}.`);
        return;
      }

      const variantId = selectedVariant?.id;
      if (!variantId) {
        setInventoryMessage('This size is not available for online purchase. Choose another size.');
        return;
      }
      addToBagPending = true;
      if (addBagBtn) { addBagBtn.disabled = true; addBagBtn.textContent = 'ADDING TO BAG…'; }
      try {
        const response = await fetch('/api/shopify/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ variantId, quantity: requestedQuantity })
        });
        const result = await response.json();
        if (!response.ok || !result.cart) throw new Error(result.error || 'This item could not be added.');
        setInventoryMessage('');
        window.dispatchEvent(new CustomEvent('ekkomi:cart-updated', { detail: { cart: result.cart, open: true } }));
      } catch (error) {
        setInventoryMessage(error && error.message ? error.message : 'This item could not be added. Please try again.');
      } finally {
        addToBagPending = false;
        if (addBagBtn) { addBagBtn.textContent = 'ADD TO BAG'; syncSelectedVariant(); }
      }
    };

    if (addBagBtn) addBagBtn.addEventListener('click', handleAddToBag);

    // Dynamic Floating WhatsApp update
    const floatingWa = document.getElementById('floatingWhatsappBtn');
    if (floatingWa) {
      const productName = jacket.impulse;
      const currentUrl = `${window.location.origin}/collection#${jacket.key}`;
      const waText = `Hello Ekkomi, I'm interested in the ${productName} and would love to speak with your stylist. Could you please assist me?\n\nProduct: ${productName}\nProduct URL: ${currentUrl}`;
      floatingWa.href = `https://wa.me/${EKKOMI_WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
    }

    // Bind Back to Carousel Link
    const backLink = document.getElementById('backToCarouselLink');
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToDepartmentHeader(jacket.gender);
      });
    }

    // Reveal with subtle fade in
    showcase.classList.remove('is-updating');
  }, 160);
}

/* -------------------------------------------------------------------
   SELECT JACKET
   ------------------------------------------------------------------- */

function selectJacket(id, { scroll = false, fromAccordion = false, fromDepartmentSwitch = false, userInitiated = false } = {}) {
  const item = allCollectionJackets.find(j => j.id === id);
  if (!item) return;

  if (item.gender !== activeDepartment) {
    switchDepartment(item.gender, { syncJacket: false });
  }

  selectedJacketId = id;
  window.currentSelectedJacket = item;
  if (userInitiated) {
    window.userHasSelectedJacket = true;
  }
  document.body.dataset.selectedJacket = id;

  // Sync accordion active panel
  if (!fromAccordion) {
    if (item.gender === 'men' && window.accordionMenAPI) {
      window.accordionMenAPI.setActiveById(id, false);
    } else if (item.gender === 'women' && window.accordionWomenAPI) {
      window.accordionWomenAPI.setActiveById(id, false);
    }
  }

  // Render into dynamic showcase
  renderShowcase(item);

  if (scroll) {
    scrollToShowcase(true);
  }

  // Clear any existing pending waitlist popup timer
  if (window.pendingWaitlistTimer) {
    clearTimeout(window.pendingWaitlistTimer);
    window.pendingWaitlistTimer = null;
  }

  // Out-of-stock jackets display prominent 'NOTIFY ME WHEN AVAILABLE' CTA in showcase.
  // Popup is user-initiated by clicking the button, not auto-interrupted by timer.
}

/* -------------------------------------------------------------------
   GENERIC ACCORDION GALLERY INITIALIZER (REUSABLE GSAP ACCORDION)
   ------------------------------------------------------------------- */

function createAccordionGallery({
  rootId,
  items,
  defaultIndex = 0,
  expandRatio = 0.52,
  onSelectJacket
}) {
  const root = document.getElementById(rootId);
  if (!root) return null;

  let activeIndex = defaultIndex >= 0 && defaultIndex < items.length ? defaultIndex : 0;
  const duration = 0.6;
  const ease = 'power3.out';
  const parallax = 0.5;
  const tilt = 8;
  const stagger = 0.06;
  const count = items.length;

  const prefersReduced = () =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  root.innerHTML = '';

  const panelEls = [];
  const mediaEls = [];
  const barEls = [];
  const textEls = [];
  let tl = null;
  let firstRun = true;
  let mediaSize = 320;

  items.forEach((item, i) => {
    const isActive = i === activeIndex;
    const panel = document.createElement('div');
    panel.className = `ag-panel${isActive ? ' ag-panel--active' : ''}`;
    panel.tabIndex = 0;
    panel.setAttribute('role', 'listitem');
    panel.setAttribute('aria-label', `${item.impulse} — Ekkomi Nocturne`);
    panel.dataset.index = String(i);
    panel.dataset.jacket = item.id;

    const frame = document.createElement('span');
    frame.className = 'ag-panel__frame';

    const media = document.createElement('span');
    media.className = 'ag-panel__media';

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = `${item.impulse} jacket — Ekkomi Nocturne`;
    img.draggable = false;
    img.loading = 'lazy';

    if (item.image) {
      media.appendChild(img);
    } else {
      media.classList.add('ag-panel__media--empty');
      media.textContent = 'Image unavailable';
    }
    frame.appendChild(media);

    const overlay = document.createElement('span');
    overlay.className = 'ag-panel__overlay';
    overlay.setAttribute('aria-hidden', 'true');
    frame.appendChild(overlay);

    panel.appendChild(frame);

    const label = document.createElement('span');
    label.className = 'ag-panel__label';
    label.setAttribute('aria-hidden', 'true');

    const bar = document.createElement('span');
    bar.className = 'ag-panel__bar';
    barEls[i] = bar;

    const text = document.createElement('span');
    text.className = 'ag-panel__text';
    const jacketName = item.label.replace(/^\d+\s*\/\s*/, '');
    text.innerHTML = `<span class="ag-label-title">${escapeHTML(jacketName)}</span>`;
    textEls[i] = text;

    label.appendChild(bar);
    label.appendChild(text);
    panel.appendChild(label);

    panelEls[i] = panel;
    mediaEls[i] = media;
    root.appendChild(panel);
  });

  function applyLayout(animate = true) {
    if (!panelEls.length) return;
    const isVert = window.innerWidth <= 640;
    root.classList.toggle('accordion-gallery--vertical', isVert);

    const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
    const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;

    tl?.kill();
    const dur = animate && !prefersReduced() ? duration : 0;
    tl = gsap.timeline();

    panelEls.forEach((panel, i) => {
      if (!panel) return;
      const isActive = i === activeIndex;
      panel.classList.toggle('ag-panel--active', isActive);
      panel.setAttribute('aria-current', isActive ? 'true' : 'false');

      const media = mediaEls[i];
      const bar = barEls[i];
      const text = textEls[i];

      const rot = isActive ? 0 : i < activeIndex ? tilt : -tilt;
      const rotProp = isVert ? { rotateX: -rot, rotateY: 0 } : { rotateY: rot, rotateX: 0 };

      tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease }, 0);

      if (media) {
        const drift = Math.max(-1.5, Math.min(1.5, activeIndex - i));
        const shift = drift * parallax * mediaSize * 0.06;
        const gray = isActive ? 0 : 1;
        tl.to(
          media,
          {
            xPercent: -50,
            yPercent: -50,
            x: isVert ? 0 : (isActive ? 0 : shift),
            y: isVert ? (isActive ? 0 : shift) : 0,
            '--ag-gray': gray,
            '--ag-dim': isActive ? 0 : 0.35,
            duration: dur,
            ease
          },
          0
        );
      }

      if (bar && text) {
        if (isVert) {
          tl.to([bar, text], { opacity: isActive ? 1 : 0.9, x: 0, duration: dur, ease }, 0);
        } else {
          if (isActive) {
            tl.to([bar, text], { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced() ? 0 : stagger }, 0);
          } else {
            tl.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0);
          }
        }
      }
    });
  }

  const measure = () => {
    const isVert = window.innerWidth <= 640;
    root.classList.toggle('accordion-gallery--vertical', isVert);
    const rect = root.getBoundingClientRect();
    const total = isVert ? rect.height : rect.width;
    const gap = isVert ? 8 : 12;
    const usable = Math.max(total - gap * (count - 1), 120);
    const size = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22);
    mediaSize = size;
    root.style.setProperty('--ag-media-size', `${size}px`);
    applyLayout(!firstRun);
  };

  measure();
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(measure);
    ro.observe(root);
  } else {
    window.addEventListener('resize', measure, { passive: true });
  }

  applyLayout(!firstRun);
  firstRun = false;

  function setActive(i, triggerScroll = false) {
    if (i >= 0 && i < count) {
      activeIndex = i;
      applyLayout(true);
      if (triggerScroll && onSelectJacket) {
        onSelectJacket(items[i].id);
      }
    }
  }

  // Event Listeners: expand on hover / focus, select on click
  panelEls.forEach((panel, i) => {
    panel.addEventListener('mouseenter', () => setActive(i, false));
    panel.addEventListener('click', (e) => {
      e.preventDefault();
      setActive(i, false);
      if (onSelectJacket) {
        onSelectJacket(items[i].id);
      }
    });
    panel.addEventListener('focus', () => setActive(i, false));
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActive(i, false);
        if (onSelectJacket) {
          onSelectJacket(items[i].id);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (i + 1) % count;
        setActive(next, false);
        panelEls[next]?.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (i - 1 + count) % count;
        setActive(prev, false);
        panelEls[prev]?.focus();
      }
    });
  });

  return {
    setActiveById: (id, triggerScroll = false) => {
      const idx = items.findIndex(j => j.id === id);
      if (idx >= 0 && idx !== activeIndex) {
        setActive(idx, triggerScroll);
      }
    },
    measure: () => {
      measure();
    }
  };
}

/* -------------------------------------------------------------------
   3D PERSPECTIVE DRIFT WALL (HERO)
   ------------------------------------------------------------------- */

const wallTiles = allCollectionJackets.flatMap((jacket) => jacket.views.map((view) => ({
  image: view.src,
  // Keep the drift wall's accessible label concise; avoid repeating Shopify's
  // descriptive product suffixes and perspective numbering in the visual fallback.
  title: jacket.key.toUpperCase(),
  jacket: jacket.id
})));
function initDriftWall() {
  const container = document.getElementById('heroDriftWall');
  if (!container) return;

  const columns = 5;
  const tileWidth = 220;
  const tileHeight = 300;
  const gap = 16;
  const radius = 8;
  const tilt = 14;
  const turn = -12;
  const roll = 0;
  const perspective = 1100;
  const depth = 100;
  const speed = 28;
  const direction = 'up';
  const variance = 0.4;
  const autoPlay = true;

  const root = document.createElement('div');
  root.className = 'drift-wall';
  root.style.setProperty('--dw-tile-w', `${tileWidth}px`);
  root.style.setProperty('--dw-tile-h', `${tileHeight}px`);
  root.style.setProperty('--dw-gap', `${gap}px`);
  root.style.setProperty('--dw-radius', `${radius}px`);

  const plane = document.createElement('div');
  plane.className = 'drift-wall__plane';
  root.appendChild(plane);

  const colPools = [];
  const colElements = [];
  const tracks = [];
  const itemHeight = tileHeight + gap;

  for (let c = 0; c < columns; c++) {
    const col = document.createElement('div');
    col.className = 'drift-wall__col';
    const pool = [];
    // Distribute 40 unique tiles across columns with zero cross-column image repetition
    for (let i = c; i < wallTiles.length; i += columns) {
      pool.push(wallTiles[i]);
    }
    colPools.push(pool);

    const track = document.createElement('div');
    track.className = 'drift-wall__track';
    col.appendChild(track);
    plane.appendChild(col);
    colElements.push(col);
    tracks.push(track);
  }

  container.innerHTML = '';
  container.appendChild(root);

  const colOffsets = new Array(columns).fill(0);
  const colSpeeds = [];
  for (let c = 0; c < columns; c++) {
    const mid = (columns - 1) / 2;
    const dist = Math.abs(c - mid) / (mid || 1);
    const mod = 1 - dist * variance;
    colSpeeds.push(speed * Math.max(mod, 0.45));
    colOffsets[c] = (c * itemHeight * 0.45) % (colPools[c].length * itemHeight);
  }

  const trackHeights = new Array(columns).fill(0);
  const activeTileEls = [];

  function fillTracks() {
    const rootH = root.clientHeight || 700;
    const renderH = rootH + itemHeight * 5;

    for (let c = 0; c < columns; c++) {
      const track = tracks[c];
      const pool = colPools[c];
      const curH = trackHeights[c];
      if (curH >= renderH) continue;

      const needed = Math.ceil((renderH - curH) / itemHeight) + 2;
      for (let k = 0; k < needed; k++) {
        const itemIdx = (Math.floor(curH / itemHeight) + k) % pool.length;
        const item = pool[itemIdx];

        const tile = document.createElement('div');
        tile.className = 'drift-wall__tile';
        tile.tabIndex = 0;
        tile.setAttribute('role', 'button');
        tile.setAttribute('aria-label', item.title);
        tile.dataset.jacket = item.jacket;

        const inner = document.createElement('span');
        inner.className = 'drift-wall__inner';

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title;
        img.draggable = false;
        img.loading = 'lazy';

        inner.appendChild(img);
        tile.appendChild(inner);
        track.appendChild(tile);
        activeTileEls.push(tile);
      }
      trackHeights[c] += needed * itemHeight;
    }
  }

  fillTracks();

  let pointer = { x: 0, y: 0 };
  let smoothPointer = { x: 0, y: 0 };
  let targetTilt = tilt;
  let targetTurn = turn;
  let curTilt = tilt;
  let curTurn = turn;
  let wallHovered = false;

  const updatePlaneTransform = () => {
    smoothPointer.x += (pointer.x - smoothPointer.x) * 0.08;
    smoothPointer.y += (pointer.y - smoothPointer.y) * 0.08;

    const mouseTurn = -smoothPointer.x * 6;
    const mouseTilt = smoothPointer.y * 5;

    curTilt += (targetTilt + mouseTilt - curTilt) * 0.08;
    curTurn += (targetTurn + mouseTurn - curTurn) * 0.08;

    plane.style.transform = `perspective(${perspective}px) translateZ(${depth}px) rotateX(${curTilt}deg) rotateY(${curTurn}deg) rotateZ(${roll}deg)`;
  };

  let lastTime = performance.now();

  let wallInView = true;
  let wallRafId = null;

  function animateWall(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (autoPlay && !isReducedMotion()) {
      for (let c = 0; c < columns; c++) {
        const poolH = colPools[c].length * itemHeight;
        const dist = colSpeeds[c] * dt;
        if (direction === 'up') {
          colOffsets[c] = (colOffsets[c] + dist) % poolH;
        } else {
          colOffsets[c] = (colOffsets[c] - dist + poolH) % poolH;
        }
        tracks[c].style.transform = `translate3d(0, ${-colOffsets[c]}px, 0)`;
      }
    }

    updatePlaneTransform();
  }

  function driftLoop(now) {
    if (!wallInView || document.hidden || isReducedMotion()) {
      wallRafId = null;
      return;
    }
    animateWall(now);
    wallRafId = requestAnimationFrame(driftLoop);
  }

  function startDriftLoop() {
    if (!wallRafId && wallInView && !document.hidden && !isReducedMotion()) {
      lastTime = performance.now();
      wallRafId = requestAnimationFrame(driftLoop);
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      wallInView = entries[0].isIntersecting;
      if (wallInView) {
        startDriftLoop();
      }
    }, { threshold: 0.05 });
    observer.observe(container);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && wallInView) {
      startDriftLoop();
    }
  }, { passive: true });

  startDriftLoop();

  root.addEventListener('pointermove', (e) => {
    const rect = root.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointer.x = Math.max(-1, Math.min(1, nx));
    pointer.y = Math.max(-1, Math.min(1, ny));
    wallHovered = true;
  });

  root.addEventListener('pointerleave', () => {
    wallHovered = false;
    pointer.x = 0;
    pointer.y = 0;
  });
}

/* -------------------------------------------------------------------
   INIT
   ------------------------------------------------------------------- */

function init() {
  initDriftWall();

  // Initialize Men's Accordion Carousel (5 jackets)
  window.accordionMenAPI = createAccordionGallery({
    rootId: 'accordionGalleryMen',
    items: mensJackets,
    defaultIndex: Math.max(0, mensJackets.findIndex((jacket) => jacket.key === 'desire')),
    onSelectJacket: (id) => {
      selectJacket(id, { scroll: true, fromAccordion: true, userInitiated: true });
    }
  });

  // Initialize Women's Accordion Carousel (3 jackets)
  window.accordionWomenAPI = createAccordionGallery({
    rootId: 'accordionGalleryWomen',
    items: womensJackets,
    defaultIndex: Math.max(0, womensJackets.findIndex((jacket) => jacket.key === 'desire')),
    onSelectJacket: (id) => {
      selectJacket(id, { scroll: true, fromAccordion: true, userInitiated: true });
    }
  });

  // Department switch button click listeners
  const tabMen = document.getElementById('tab-gender-men');
  const tabWomen = document.getElementById('tab-gender-women');

  if (tabMen) {
    tabMen.addEventListener('click', (e) => {
      e.preventDefault();
      switchDepartment('men', { syncJacket: true, scroll: false });
    });
  }

  if (tabWomen) {
    tabWomen.addEventListener('click', (e) => {
      e.preventDefault();
      switchDepartment('women', { syncJacket: true, scroll: false });
    });
  }

  initSizeGuide();
  initProductZoomModal();

  // Pre-render the default active jacket (Men's Desire) in showcase
  const defaultJacket = mensJackets.find((jacket) => jacket.key === 'desire') || mensJackets[0];
  if (defaultJacket) renderShowcase(defaultJacket);

  // Preload primary assets
  allCollectionJackets.forEach(j => {
    if (j.image) {
      const img = new Image();
      img.src = j.image;
    }
    if (j.views && j.views[0]) {
      const vImg = new Image();
      vImg.src = j.views[0].src;
    }
  });
}

window.initEkkomiCollection = function() {
  init();
  if (window.initEkkomiWaitlist) {
    window.initEkkomiWaitlist();
  }
};

// Kick off when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


// ─── WAITLIST.JS ───
/**
 * EKKOMI NOCTURNE — JOIN THE WAITING LIST CONTROLLER
 * Multi-step, editorial, high-fashion modal experience.
 *
 * Prepared for:
 * 1. Local & Remote backend registration storage
 * 2. Real email confirmation delivery (SendGrid / Postmark / SES / Shopify Email)
 * 3. Shopify inventory verification & native Add to Cart / Buy Now integration
 */

(function () {
  'use strict';

  // Configurable available sizes (centralised for future adjustment)
  const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL'];

  const CONSENT_STORAGE_KEY = 'ekkomi_consent_v1';
  const LEGACY_CONSENT_STORAGE_KEY = 'ekkomi_cookie_consent';
  const DRAFT_STORAGE_KEY = 'ekkomi_waitlist_draft';
  const CONSENT_VERSION = 1;
  const CONSENT_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;
  const DRAFT_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

  function hasFunctionalStorageConsent() {
    try {
      const currentRaw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (currentRaw) {
        const value = JSON.parse(currentRaw);
        const timestamp = Date.parse(value?.timestamp);
        const age = Date.now() - timestamp;
        return value?.necessary === true &&
          value?.functional === true &&
          value?.version === CONSENT_VERSION &&
          Number.isFinite(timestamp) &&
          age >= 0 &&
          age < CONSENT_LIFETIME_MS;
      }

      // Support a previously used Collection-only consent record until it expires.
      const legacy = JSON.parse(localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY) || 'null');
      return legacy?.necessary === true &&
        legacy?.functional === true &&
        typeof legacy?.policyVersion === 'string' &&
        Number(legacy?.expiresAt) > Date.now();
    } catch {
      return false;
    }
  }

  function readWaitlistDraft() {
    if (!hasFunctionalStorageConsent()) return null;
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      const age = Date.now() - Number(draft?.savedAt);
      const jackets = JACKET_CATALOG[draft?.collection?.toLowerCase()] || [];
      const jacket = jackets.find((item) => item.key === draft?.jacketKey);
      if (
        !Number.isFinite(age) || age < 0 || age > DRAFT_LIFETIME_MS ||
        !jacket || !['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(draft?.size) ||
        typeof draft?.fullName !== 'string' ||
        typeof draft?.email !== 'string' ||
        typeof draft?.phone !== 'string'
      ) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return null;
      }
      return { ...draft, collection: draft.collection.toLowerCase(), jacket };
    } catch {
      try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { }
      return null;
    }
  }


  // Backend API Configuration (Local Dev & Hosted Supabase Edge Function)
  // Backend API Configuration — Supabase Edge Function
  const BACKEND_CONFIG = {
    supabaseEndpoint:
      'https://chjzsdnypkllihdzokhg.supabase.co/functions/v1/waitlist',

    getEndpoint: function () {
      return this.supabaseEndpoint;
    }
  };

  // State
  const state = {
    isOpen: false,
    currentStep: 1,
    collection: 'men',
    jacket: null,
    size: null,
    fullName: '',
    email: '',
    phone: '',
    consent: false,
    isSubmitting: false,
    history: [1]
  };

  // DOM Elements cache
  let backdropEl = null;
  let dialogEl = null;
  let backBtn = null;
  let closeBtn = null;
  let progressEl = null;
  let steps = {};

  function init() {
    backdropEl = document.getElementById('waitlistBackdrop');
    dialogEl = document.getElementById('waitlistDialog');
    backBtn = document.getElementById('waitlistBackBtn');
    closeBtn = document.getElementById('waitlistCloseBtn');
    progressEl = document.getElementById('waitlistProgress');

    if (!backdropEl || !dialogEl) return;

    for (let i = 1; i <= 6; i++) {
      steps[i] = document.getElementById(`waitlistStep${i}`);
    }

    // Bind Controls
    if (closeBtn) closeBtn.addEventListener('click', closeWaitlist);
    if (backBtn) backBtn.addEventListener('click', goBack);

    // Backdrop click closes modal
    backdropEl.addEventListener('click', (e) => {
      if (e.target === backdropEl) {
        closeWaitlist();
      }
    });

    // Keyboard navigation (Escape key)
    document.addEventListener('keydown', (e) => {
      if (state.isOpen && e.key === 'Escape') {
        closeWaitlist();
      }
    });

    // Step 1: Continue button
    const step1Btn = document.getElementById('step1ContinueBtn');
    if (step1Btn) {
      step1Btn.addEventListener('click', () => {
        goToStep(2);
      });
    }

    // Step 2: Collection selection cards
    const collectionBtns = dialogEl.querySelectorAll('[data-collection]');
    collectionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const col = btn.getAttribute('data-collection');
        selectCollection(col);
        goToStep(3);
      });
    });

    // Step 5: Form submission
    const form = document.getElementById('waitlistForm');
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }

    // Step 5: Edit Pill
    const editBtn = document.getElementById('pillEditBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        goToStep(2);
      });
    }

    // Step 6: Explore EKKOMI Collections
    const backToCollBtn = document.getElementById('backToCollectionBtn');
    if (backToCollBtn) {
      backToCollBtn.addEventListener('click', () => {
        closeWaitlist();
        const colSection = document.getElementById('collection');
        if (colSection) {
          colSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Bind page-level entry buttons
    bindEntryButtons();

    // Render sizes grid
    renderSizesGrid();
  }

  function bindEntryButtons() {
    // Header button
    const headerBtn = document.getElementById('headerWaitlistBtn');
    if (headerBtn) {
      headerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openWaitlist();
      });
    }

    // Hero button
    const heroBtn = document.getElementById('heroWaitlistBtn');
    if (heroBtn) {
      heroBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openWaitlist();
      });
    }

    // Floating waitlist button
    const floatingBtn = document.getElementById('floatingWaitlistBtn');
    if (floatingBtn) {
      floatingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // A general Join CTA always opens the introduction at step 1.
        openWaitlist();
      });
    }

    // Document-level listener for dynamically rendered buttons (e.g. inside dynamic product showcase)
    document.addEventListener('click', (e) => {
      const cookieBtn = e.target.closest('[data-open-cookie-settings]');
      if (cookieBtn) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ekkomi:open-cookie-settings'));
        return;
      }
      const notifyBtn = e.target.closest('.btn-notify-when-available, #showcaseNotifyBtn, [data-notify-jacket]');
      if (notifyBtn) {
        e.preventDefault();
        const activeDept = notifyBtn.dataset.collection || window.currentSelectedDepartment || document.body.dataset.activeDepartment || 'men';
        const activeJacketKey = notifyBtn.dataset.jacketKey || (window.currentSelectedJacket ? window.currentSelectedJacket.key : null);
        const catalog = JACKET_CATALOG[activeDept] || mensJackets;
        const jacketObj = (catalog && catalog.find(j => j.key === activeJacketKey)) || window.currentSelectedJacket;

        openWaitlist({
          collection: activeDept,
          jacketKey: activeJacketKey,
          jacketName: jacketObj ? (jacketObj.impulse || jacketObj.name) : null,
          jacketNumber: jacketObj ? jacketObj.number : null,
          jacketHex: jacketObj ? jacketObj.hex : null,
          jacketColour: jacketObj ? jacketObj.colour : null,
          size: notifyBtn.dataset.size || null,
          outOfStock: true
        });
        return;
      }
      const target = e.target.closest('#showcaseWaitlistBtn, .btn-join-waitlist, [data-open-waitlist]');
      if (target) {
        e.preventDefault();
        // Unlike Notify, Join starts the complete waitlist flow at step 1.
        openWaitlist();
      }
    });
  }

  let previouslyFocusedElement = null;

  function openWaitlist(preselects = {}) {
    if (state.isOpen && !preselects.collection && !preselects.jacketKey) {
      return;
    }
    try {
      previouslyFocusedElement = document.activeElement;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } catch (e) { }

    state.isOpen = true;
    state.outOfStock = !!preselects.outOfStock;
    document.body.classList.add('waitlist-open');
    window.dispatchEvent(new Event('ekkomi:modal-scroll-lock'));

    // Preselect collection if passed or keep existing
    if (preselects.collection && (preselects.collection === 'men' || preselects.collection === 'women')) {
      selectCollection(preselects.collection, false);
    }

    // Preselect jacket if passed
    if (preselects.jacketKey) {
      const catalog = JACKET_CATALOG[state.collection] || [];
      const found = catalog.find(j => j.key === preselects.jacketKey);
      if (found) {
        state.jacket = found;
      }
    }

    // Direct routing:
    // If a specific jacket is preselected (e.g. from NOTIFY WHEN AVAILABLE button):
    // Jump straight to Step 4: Size Selection with jacket preselected
    if (preselects.jacketKey && preselects.collection) {
      if (STANDARD_SIZES.includes(preselects.size)) {
        state.size = preselects.size;
        state.history = [1, 2, 3, 4];
        goToStep(5, false);
      } else {
        state.size = null;
        state.history = [1, 2, 3];
        goToStep(4, false);
      }
    } else {
      // Automatic popup on page load, or general header/floating CTA:
      // Always start at Step 1: SOLD OUT intro screen
      state.history = [1];
      goToStep(1, false);
    }

    backdropEl.classList.add('is-active');
    backdropEl.setAttribute('aria-hidden', 'false');

    // Focus first interactive element for keyboard accessibility
    setTimeout(() => {
      const firstFocusable = dialogEl.querySelector('button:not([disabled]), input:not([disabled])');
      if (firstFocusable) firstFocusable.focus();
    }, 150);
  }

  function closeWaitlist() {
    state.isOpen = false;
    document.body.classList.remove('waitlist-open');
    document.body.style.paddingRight = '';
    window.dispatchEvent(new Event('ekkomi:modal-scroll-unlock'));
    backdropEl.classList.remove('is-active');
    backdropEl.setAttribute('aria-hidden', 'true');

    if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
      try { previouslyFocusedElement.focus(); } catch (e) { }
    }

  }

  function goToStep(stepNum, pushHistory = true) {
    if (stepNum < 1 || stepNum > 6) return;

    if (pushHistory && state.currentStep !== stepNum) {
      state.history.push(stepNum);
    }

    state.currentStep = stepNum;

    // Show / hide step containers
    for (let i = 1; i <= 6; i++) {
      if (steps[i]) {
        if (i === stepNum) {
          steps[i].classList.remove('is-hidden');
        } else {
          steps[i].classList.add('is-hidden');
        }
      }
    }

    // Update Header Controls: Back button visible on steps 2-5
    if (backBtn) {
      if (stepNum >= 2 && stepNum <= 5) {
        backBtn.classList.remove('is-hidden');
      } else {
        backBtn.classList.add('is-hidden');
      }
    }

    // Update Progress Indicator
    if (progressEl) {
      if (stepNum >= 1 && stepNum <= 5) {
        progressEl.classList.remove('is-hidden');
        const dots = progressEl.querySelectorAll('.progress-dot');
        dots.forEach(dot => {
          const dStep = parseInt(dot.getAttribute('data-step'), 10);
          dot.classList.toggle('is-active', dStep === stepNum);
          dot.classList.toggle('is-completed', dStep < stepNum);
        });
      } else {
        progressEl.classList.add('is-hidden');
      }
    }

    // Step-specific renders
    if (stepNum === 2) {
      syncCollectionUI();
    } else if (stepNum === 3) {
      renderJacketsList();
    } else if (stepNum === 4) {
      syncSizesUI();
    } else if (stepNum === 5) {
      syncSummaryPill();
    }

    // Smooth focus
    setTimeout(() => {
      const activeStep = steps[stepNum];
      if (activeStep) {
        const focusable = activeStep.querySelector('button:not([disabled]), input:not([disabled])');
        if (focusable) focusable.focus();
      }
    }, 100);
  }

  function goBack() {
    if (state.history.length > 1) {
      state.history.pop(); // Remove current
      const prevStep = state.history[state.history.length - 1] || 1;
      goToStep(prevStep, false);
    } else {
      goToStep(1, false);
    }
  }

  function selectCollection(col, reRender = true) {
    state.collection = col;
    // If the jacket currently selected does not exist in this collection (e.g. Insolence in women), clear it
    if (state.jacket) {
      const available = JACKET_CATALOG[col].some(j => j.key === state.jacket.key);
      if (!available) {
        state.jacket = null;
      }
    }
    if (reRender) {
      syncCollectionUI();
    }
  }

  function syncCollectionUI() {
    const cards = dialogEl.querySelectorAll('[data-collection]');
    cards.forEach(card => {
      const isSelected = card.getAttribute('data-collection') === state.collection;
      card.classList.toggle('is-selected', isSelected);
      card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });
  }

  function renderJacketsList() {
    const listEl = document.getElementById('waitlistJacketsList');
    const labelEl = document.getElementById('summaryCollectionLabel');
    if (!listEl) return;

    if (labelEl) {
      labelEl.textContent = state.collection === 'men' ? "MEN'S COLLECTION" : "WOMEN'S COLLECTION";
    }

    const jackets = JACKET_CATALOG[state.collection] || [];

    listEl.innerHTML = jackets.map(j => {
      const isSelected = state.jacket && state.jacket.key === j.key;
      return `
        <button type="button"
                class="waitlist-jacket-card${isSelected ? ' is-selected' : ''}"
                data-jacket-key="${escapeHTML(j.key)}"
                role="radio"
                aria-checked="${isSelected ? 'true' : 'false'}">
          <div class="jacket-card-left">
            ${j.image ? `
              <div class="jacket-thumb-wrapper">
                <img src="${escapeHTML(j.image)}" alt="${escapeHTML(j.name)} jacket" class="jacket-thumb-img" loading="eager" decoding="async">
              </div>
            ` : ''}
            ${j.hex ? `<span class="jacket-swatch" style="background-color: ${escapeHTML(j.hex)};" aria-hidden="true"></span>` : ''}
            <div class="jacket-meta">
              <span class="jacket-name">${escapeHTML(j.name)}</span>
            </div>
          </div>
          <span class="jacket-select-radio" aria-hidden="true"></span>
        </button>
      `;
    }).join('');

    // Bind jacket card clicks
    const cards = listEl.querySelectorAll('[data-jacket-key]');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-jacket-key');
        const jacket = jackets.find(j => j.key === key);
        if (jacket) {
          state.jacket = jacket;
          // Visual selection feedback
          cards.forEach(c => c.classList.remove('is-selected'));
          card.classList.add('is-selected');
          setTimeout(() => {
            goToStep(4);
          }, 180);
        }
      });
    });
  }

  function renderSizesGrid() {
    const gridEl = document.getElementById('waitlistSizesGrid');
    if (!gridEl) return;

    gridEl.innerHTML = AVAILABLE_SIZES.map(s => `
      <button type="button"
              class="waitlist-size-btn"
              data-size="${s}"
              role="radio"
              aria-checked="false">
        ${s}
      </button>
    `).join('');

    const sizeBtns = gridEl.querySelectorAll('[data-size]');
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.getAttribute('data-size');
        state.size = size;
        sizeBtns.forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        setTimeout(() => {
          goToStep(5);
        }, 180);
      });
    });
  }

  function syncSizesUI() {
    const jacketLabel = document.getElementById('summaryJacketLabel');
    const sizeSubtitle = document.getElementById('step4Subtitle');
    if (sizeSubtitle) {
      if (state.outOfStock) {
        sizeSubtitle.textContent = 'This piece is currently unavailable. Select your size to join the waiting list.';
      } else {
        sizeSubtitle.textContent = 'Select your size to join the waiting list.';
      }
    }
    if (jacketLabel && state.jacket) {
      jacketLabel.textContent = state.jacket.name;
    }

    const sizeBtns = dialogEl.querySelectorAll('[data-size]');
    sizeBtns.forEach(btn => {
      const isSelected = btn.getAttribute('data-size') === state.size;
      btn.classList.toggle('is-selected', isSelected);
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });
  }

  function syncSummaryPill() {
    const textEl = document.getElementById('pillSummaryText');
    const dotEl = document.getElementById('pillColorDot');

    if (textEl && state.jacket && state.size) {
      const colLabel = state.collection === 'men' ? 'Men' : 'Women';
      textEl.textContent = `${colLabel} · ${state.jacket.name} · Size ${state.size}`;
    }

    if (dotEl && state.jacket) {
      dotEl.style.backgroundColor = state.jacket.hex || '#773A3C';
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (state.isSubmitting) return;

    // Reset error messages
    clearErrors();

    const nameInput = document.getElementById('waitlistFullName');
    const emailInput = document.getElementById('waitlistEmail');
    const phoneInput = document.getElementById('waitlistPhone');
    const consentInput = document.getElementById('waitlistConsent');
    const submitBtn = document.getElementById('submitWaitlistBtn');
    const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;

    const fullName = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const consent = consentInput ? consentInput.checked : false;

    // Validation
    let hasError = false;

    if (!fullName || fullName.length < 2) {
      showError('nameError', 'Please enter your full name.');
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showError('emailError', 'Please enter a valid email address.');
      hasError = true;
    }

    const phoneClean = phone.replace(/[\s\-\(\)\.]/g, '');
    if (!phone || phoneClean.length < 7 || !/^(\+)?\d{7,16}$/.test(phoneClean)) {
      showError('phoneError', 'Please enter a valid phone number.');
      hasError = true;
    }

    if (!state.collection || !state.jacket || !state.size) {
      showError('generalFormError', 'Please select your collection, jacket, and size.');
      hasError = true;
    }

    if (!consent) {
      showError('consentError', 'Please confirm your consent to receive availability updates.');
      hasError = true;
    }

    if (hasError) return;

    // Build payload
    const payload = {
      fullName: fullName,
      email: email,
      phone: phone,
      collection: state.collection === 'men' ? 'Men' : 'Women',
      jacketId: state.jacket.id,
      jacketName: state.jacket.name,
      jacketColour: state.jacket.colour,
      size: state.size,
      consent: true,
      timestamp: new Date().toISOString()
    };

    // Prepare Confirmation Email Text (for backend dispatch)

    // Prevent duplicate submissions & set loading state
    state.isSubmitting = true;
    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'REGISTERING...';
    if (btnSpinner) btnSpinner.classList.remove('is-hidden');

    try {
      let isSuccess = false;
      let errorMessage = 'Unable to complete your registration. Please try again.';

      // Anti-Spam Honeypot Check
      const honeypotInput = document.getElementById('waitlistHoneypot');
      if (honeypotInput && honeypotInput.value) {
        payload.b_company_url = honeypotInput.value;
      }

      // Store draft details only when the visitor has enabled Functional storage.
      if (hasFunctionalStorageConsent()) {
        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
            collection: payload.collection,
            jacketKey: state.jacket ? state.jacket.key : null,
            size: payload.size,
            fullName: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            savedAt: Date.now()
          }));
        } catch { }
      }

      // Attempt to post to real backend endpoint
      const endpoint = BACKEND_CONFIG.getEndpoint();
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const resData = await response.json().catch(() => ({}));

        if (response.ok && resData.success) {
          isSuccess = true;
          state.registrationId = resData.registrationId;
        } else {
          errorMessage = resData.error || 'Registration could not be completed at this time. Please verify your details.';
          console.warn('[WAITLIST] Backend rejected the registration.', response.status);
        }
      } catch (netErr) {
        console.warn('[WAITLIST] Network connection error.');
        errorMessage = 'Unable to reach the server. Please check your connection and retry.';
      }

      // Show success ONLY after backend confirms the registration
      if (isSuccess) {
        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (consentInput) consentInput.checked = false;

        if (hasFunctionalStorageConsent()) {
          try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { }
        }

        try {
          sessionStorage.setItem('ekkomi_waitlist_success', JSON.stringify({
            jacketName: state.jacket ? state.jacket.name : '',
            size: state.size || '',
            collection: state.collection || '',
            registrationId: state.registrationId || '',
            timestamp: Date.now()
          }));
        } catch { }

        // Client requirement: redirect browser to dedicated /thank-you page
        window.location.href = '/thank-you';
        return;
      } else {
        // Keep customer details intact and show specific error
        showError('generalFormError', errorMessage);
      }
    } catch (err) {
      console.error('[WAITLIST ERROR]', err);
      showError('generalFormError', 'A system error occurred. Please try again.');
    } finally {
      state.isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'JOIN THE WAITING LIST';
      if (btnSpinner) btnSpinner.classList.add('is-hidden');
    }
  }

  function showError(elementId, msg) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = msg;
      el.classList.add('is-visible');
    }
  }

  function clearErrors() {
    const errors = dialogEl.querySelectorAll('.waitlist-error, .waitlist-form-error');
    errors.forEach(e => {
      e.textContent = '';
      e.classList.remove('is-visible');
    });
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.initEkkomiWaitlist = init;

  // Expose global API
  window.EkkomiWaitlist = {
    open: openWaitlist,
    close: closeWaitlist,
    goToStep: goToStep,
    getState: () => ({ ...state }),
    init: init
  };

})();
