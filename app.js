const DEFAULT_CONFIG = {
  instagram: {
    accessToken: "",
    userId: "",
    limit: 9,
  },
  reviews: {
    endpoint: "",
    apiKey: "",
    places: [
      { name: "Thodupuzha", placeId: "" },
      { name: "Muvattupuzha", placeId: "" },
    ],
  },
  locations: {
    thodupuzha: {
      address: "",
      hours: "",
      mapsQuery: "",
    },
    muvattupuzha: {
      address: "",
      hours: "",
      mapsQuery: "",
    },
  },
};

const CP_CONFIG = window.CP_CONFIG || DEFAULT_CONFIG;

const PRELOADER_MAX_MS = 1520;
const preloader = document.getElementById("preloader");
let preloaderHidden = false;

const hidePreloader = () => {
  if (preloaderHidden || !preloader) return;
  preloaderHidden = true;
  preloader.classList.add("hidden");
};

setTimeout(hidePreloader, PRELOADER_MAX_MS);
window.addEventListener("load", () => {
  setTimeout(hidePreloader, 100);
});

const revealOnScroll = () => {
  const elements = document.querySelectorAll("[data-animate], .about-card");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  elements.forEach((el) => observer.observe(el));
};

const sampleInstagram = [
  {
    id: "sample-1",
    media_url:
      "https://images.unsplash.com/photo-1462917882517-e150004895ff?auto=format&fit=crop&w=600&q=80",
    permalink: "https://www.instagram.com/chaya_premi/",
  },
  {
    id: "sample-2",
    media_url:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    permalink: "https://www.instagram.com/chaya_premi/",
  },
  {
    id: "sample-3",
    media_url:
      "https://images.unsplash.com/photo-1507915135761-41a0a222c709?auto=format&fit=crop&w=600&q=80",
    permalink: "https://www.instagram.com/chaya_premi/",
  },
  {
    id: "sample-4",
    media_url:
      "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=600&q=80",
    permalink: "https://www.instagram.com/chaya_premi/",
  },
  {
    id: "sample-5",
    media_url:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    permalink: "https://www.instagram.com/chaya_premi/",
  },
  {
    id: "sample-6",
    media_url:
      "https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=600&q=80",
    permalink: "https://www.instagram.com/chaya_premi/",
  },
];

const renderInstagram = (items) => {
  const grid = document.getElementById("instagram-grid");
  if (!grid) return;
  grid.innerHTML = "";
  items.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.permalink;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "gram-item";

    const img = document.createElement("img");
    img.src = item.media_url;
    img.alt = item.caption ? item.caption.slice(0, 120) : "Chaya Premi post";
    img.loading = "lazy";

    link.appendChild(img);
    grid.appendChild(link);
  });
};

const loadInstagram = async () => {
  const { accessToken, userId, limit } = CP_CONFIG.instagram || {};
  if (!accessToken || !userId) {
    renderInstagram(sampleInstagram.slice(0, limit || 6));
    return;
  }

  const url = `https://graph.instagram.com/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Instagram API error");
    const data = await response.json();
    const items = (data.data || [])
      .filter((item) => ["IMAGE", "CAROUSEL_ALBUM", "VIDEO"].includes(item.media_type))
      .slice(0, limit || 9)
      .map((item) => ({
        id: item.id,
        media_url: item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url,
        permalink: item.permalink,
        caption: item.caption || "",
      }));
    renderInstagram(items);
  } catch (error) {
    renderInstagram(sampleInstagram.slice(0, limit || 6));
  }
};

const sampleReviews = [
  {
    author: "Naseer P.",
    rating: 5,
    text: "Fast service, strong chai, and the best late-night spot in town.",
    location: "Thodupuzha",
  },
  {
    author: "Jiya M.",
    rating: 5,
    text: "Love the vibe. Perfect for friends and a quick snack.",
    location: "Muvattupuzha",
  },
  {
    author: "Rahul K.",
    rating: 4,
    text: "Great snacks and a lively atmosphere. Always busy for a reason.",
    location: "Thodupuzha",
  },
  {
    author: "Anu S.",
    rating: 5,
    text: "Clean, energetic, and the chai is always on point.",
    location: "Muvattupuzha",
  },
];

const normalizeGoogleReviews = (places) => {
  const normalized = [];
  places.forEach((place) => {
    (place.reviews || []).forEach((review) => {
      if (review.rating < 4) return;
      normalized.push({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        location: place.name,
      });
    });
  });
  return normalized;
};

const fetchReviewsFromPlacesApi = async () => {
  const { apiKey, places } = CP_CONFIG.reviews || {};
  if (!apiKey || !places || !places.length) return null;

  const requests = places
    .filter((place) => place.placeId)
    .map((place) =>
      fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.placeId}&fields=name,rating,reviews&key=${apiKey}`
      ).then((response) => response.json())
    );

  const results = await Promise.all(requests);
  const placeResults = results.map((result) => result.result).filter(Boolean);
  return normalizeGoogleReviews(placeResults);
};

const fetchReviews = async () => {
  const { endpoint } = CP_CONFIG.reviews || {};
  try {
    if (endpoint) {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Reviews endpoint error");
      const data = await response.json();
      return data.reviews || [];
    }
    const apiReviews = await fetchReviewsFromPlacesApi();
    if (apiReviews && apiReviews.length) return apiReviews;
  } catch (error) {
    return sampleReviews;
  }
  return sampleReviews;
};

const renderReviews = (reviews) => {
  const track = document.getElementById("reviews-track");
  if (!track) return;
  track.innerHTML = "";
  reviews.forEach((review) => {
    const initial = (review.author || "?")[0].toUpperCase();
    const stars = "★".repeat(Math.round(review.rating || 0)) + "☆".repeat(5 - Math.round(review.rating || 0));

    const card = document.createElement("article");
    card.className = "review-card";
    card.innerHTML = `
      <div class="review-card-header">
        <div class="review-avatar">${initial}</div>
        <div class="review-card-info">
          <h4>${review.author}</h4>
          <div class="review-meta">
            <span class="review-rating">${stars}</span>
            <span class="review-location">${review.location}</span>
          </div>
        </div>
      </div>
      <p>${review.text}</p>
      <div class="review-card-footer">
        <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Posted on Google
      </div>
    `;
    track.appendChild(card);
  });
};

const setupReviewsSlider = (count) => {
  const track = document.getElementById("reviews-track");
  const prevBtn = document.getElementById("reviews-prev");
  const nextBtn = document.getElementById("reviews-next");
  if (!track || !prevBtn || !nextBtn) return;

  let index = 0;
  const update = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
  };

  prevBtn.addEventListener("click", () => {
    index = index === 0 ? count - 1 : index - 1;
    update();
  });

  nextBtn.addEventListener("click", () => {
    index = index === count - 1 ? 0 : index + 1;
    update();
  });

  let startX = 0;
  let currentX = 0;
  track.addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
  });
  track.addEventListener("touchmove", (event) => {
    currentX = event.touches[0].clientX;
  });
  track.addEventListener("touchend", () => {
    if (startX - currentX > 40) {
      index = index === count - 1 ? 0 : index + 1;
    } else if (currentX - startX > 40) {
      index = index === 0 ? count - 1 : index - 1;
    }
    update();
  });

  setInterval(() => {
    index = index === count - 1 ? 0 : index + 1;
    update();
  }, 4800);
};

const initLocations = () => {
  const { locations } = CP_CONFIG;
  ["thodupuzha", "muvattupuzha"].forEach((key) => {
    const config = locations?.[key];
    if (!config) return;
    const address = document.querySelector(`[data-address="${key}"]`);
    const hours = document.querySelector(`[data-hours="${key}"]`);
    const link = document.querySelector(`[data-directions="${key}"]`);
    if (address && config.address) address.textContent = config.address;
    if (hours && config.hours) hours.textContent = config.hours;
    if (link && config.mapsQuery) {
      const query = encodeURIComponent(config.mapsQuery);
      link.href = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
      link.target = "_blank";
    }
  });
};

const initScrollProgress = () => {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;
  const update = () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? `${(scrolled / total) * 100}%` : "0%";
  };
  window.addEventListener("scroll", update, { passive: true });
};

const initActiveNav = () => {
  const links = document.querySelectorAll(".bottom-nav a");
  const sections = Array.from(links)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
};

const init = async () => {
  revealOnScroll();
  initLocations();
  initScrollProgress();
  initActiveNav();
  await loadInstagram();
  const reviews = await fetchReviews();
  const cleaned = reviews.filter((review) => review.rating >= 4);
  const finalReviews = cleaned.length ? cleaned : sampleReviews;
  renderReviews(finalReviews);
  if (finalReviews.length > 1) {
    setupReviewsSlider(finalReviews.length);
  }
};

init();
