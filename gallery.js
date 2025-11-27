window.addEventListener("load", () => {
    const user = "tydaytygx";
    const repo = "combatserver_mc";
    const dir = "screenshots_combatserver";
    initThemeToggle();
    loadGallery(user, repo, dir);
    initLightbox();
});

const gallery = document.getElementById("gallery");
const imageList = [];
let currentIndex = -1;

function loadGallery(user, repo, dir) {
    const apiURL = `https://api.github.com/repos/${user}/${repo}/contents/${dir}`;
    const cdnPrefix = `https://gcore.jsdelivr.net/gh/${user}/${repo}/`;

    fetch(apiURL)
        .then(res => {
            if (!res.ok) throw new Error("GitHub API 请求失败:" + res.status);
            return res.json();
        })
        .then(files => {
            if (!Array.isArray(files)) throw new Error("返回的文件列表无效");
            files.filter(file => file.type === "file" && /\.(jpe?g|png|gif|bmp|webp)$/i.test(file.name))
                .forEach(file => {
                    const imageURL = cdnPrefix + dir + "/" + file.name;
                    createImageElement(imageURL, file.name);
                });
            if (imageList.length === 0) {
                gallery.innerHTML = "<p>未找到图片。</p>";
            }
        })
        .catch(err => {
            gallery.innerHTML = "<p>无法加载图库，请检查 GitHub 目录。</p>";
            console.error(err);
        });
}

function createImageElement(src, title) {
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.tabIndex = 0; // keyboard focus

    const img = document.createElement("img");
    img.src = src; // we can directly set; optional lazy placeholder could override
    img.alt = title;
    img.title = title;
    img.loading = "lazy"; // native lazy loading
    img.setAttribute("data-loading", "true");

    img.addEventListener("load", () => {
        img.setAttribute("data-loading", "false");
    });
    img.addEventListener("error", () => {
        img.setAttribute("data-loading", "false");
        img.alt = title + " (加载失败)";
        div.classList.add("error");
    });

    img.addEventListener("click", () => {
        openLightbox(imageList.indexOf(src));
    });
    div.addEventListener("keydown", (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(imageList.indexOf(src));
        }
    });

    div.appendChild(img);
    gallery.appendChild(div);
    imageList.push(src);
}

// Theme toggle with localStorage persistence
function initThemeToggle() {
    const btn = document.getElementById("themeToggle");
    const saved = localStorage.getItem("gallery-theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    btn.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
        const mode = document.documentElement.classList.contains("dark") ? "dark" : "light";
        localStorage.setItem("gallery-theme", mode);
    });
}

// Lightbox logic
let lightbox, lightboxImg, lightboxCaption, btnClose, btnPrev, btnNext;

function initLightbox() {
    lightbox = document.getElementById("lightbox");
    lightboxImg = document.getElementById("lightboxImg");
    lightboxCaption = document.getElementById("lightboxCaption");
    btnClose = document.getElementById("lightboxClose");
    btnPrev = lightbox.querySelector(".nav.prev");
    btnNext = lightbox.querySelector(".nav.next");

    btnClose.addEventListener("click", closeLightbox);
    btnPrev.addEventListener("click", () => navigate(-1));
    btnNext.addEventListener("click", () => navigate(1));

    document.addEventListener("keydown", (e) => {
        if (lightbox.classList.contains("active")) {
            if (e.key === "Escape") closeLightbox();
            else if (e.key === "ArrowLeft") navigate(-1);
            else if (e.key === "ArrowRight") navigate(1);
        }
    });

    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox(); // click backdrop
    });
}

function openLightbox(index) {
    if (index < 0 || index >= imageList.length) return;
    currentIndex = index;
    const src = imageList[index];
    lightboxImg.src = src;
    lightboxImg.alt = "预览 " + (index + 1);
    lightboxCaption.textContent = getCaption(src);
    lightbox.classList.add("active");
    // Prevent scroll background
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
    currentIndex = -1;
}

function navigate(delta) {
    if (currentIndex === -1) return;
    let next = currentIndex + delta;
    if (next < 0) next = imageList.length - 1; // wrap
    if (next >= imageList.length) next = 0;
    openLightbox(next);
}

function getCaption(src) {
    // Extract filename and decode
    try {
        const fileName = src.split("/").pop();
        return decodeURIComponent(fileName || "");
    } catch {
        return src;
    }
}

// Optional IntersectionObserver for advanced lazy effects (already using native lazy)
// If needed for older browsers:
(function enhanceLazy() {
    if ('loading' in HTMLImageElement.prototype) return; // native supported, skip
    const imgs = document.querySelectorAll('img[loading="lazy"]');
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                io.unobserve(img);
            }
        });
    }, {rootMargin: '200px'});
    imgs.forEach(img => io.observe(img));
})();
