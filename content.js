(() => {
    const BOX_ID = "vgenCustomBox";
    const STORAGE_KEY = "tagsArray";
    let selectedTag = null;
    let searchQuery = "";

    /* ------------------------------
     * Helpers
     * ------------------------------ */
    function getTags() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    function saveTag(tag) {
        let tags = getTags();
        if (!tags.includes(tag)) {
            tags.unshift(tag);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
            console.log("Saved tags:", tags);
        } else {
            console.log("Tag already exists:", tag);
        }
    }

    function clearTags() {
        if (confirm("Are you sure you want to remove all saved tags? This cannot be undone.")) {
            localStorage.removeItem(STORAGE_KEY);
            console.log("All tags cleared.");
            const body = document.querySelector(`#${BOX_ID} .body`);
            if (body) renderContent(body);
        }
    }

    function renderTags() {
        const tags = getTags();
        const filtered = searchQuery ?
            tags.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) :
            tags;

        if (!filtered.length) {
            return `<p style="color:#666; font-size:13px; font-family:sans-serif;">No tags match your search.</p>`;
        }

        return filtered.map(tag => `
            <button class="tag-btn"
                style="
                    display:inline-flex; align-items:center; gap:6px;
                    padding:6px 12px; border-radius:999px;
                    border:1px solid #ddd; background:#eef2ff;
                    color:#3730a3; font-size:14px; font-family:sans-serif;
                    cursor:pointer;">
                <span>${tag}</span>
            </button>`).join("");
    }

    function renderContent(body) {
        const tags = getTags();
        const filtered = searchQuery ?
            tags.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) :
            tags;

        body.innerHTML = `
            <div style="padding:12px; font-size:14px; line-height:1.4;">
                <div style="margin-bottom:8px; display:flex; gap:6px; align-items:center;">
                    <input id="search-tags-input"
                        type="text"
                        value="${searchQuery}"
                        placeholder="Search tags..."
                        style="flex:1; padding:6px 8px; border-radius:6px;
                            border:1px solid #ddd; font-size:13px; font-family:sans-serif;">
                    <span id="tags-counter"
                        style="font-size:12px; color:#555; white-space:nowrap;">
                        ${filtered.length}/${tags.length}
                    </span>
                </div>
                <div id="tags-container"
                    style="margin-bottom:10px; max-height:160px; overflow:auto;">
                    ${renderTags()}
                </div>
                <button id="clear-tags-btn"
                    style="
                        padding:6px 12px; border-radius:6px;
                        border:1px solid #ddd; background:#fee2e2;
                        color:#b91c1c; font-size:13px; font-family:sans-serif;
                        cursor:pointer;">
                    Clear All Tags
                </button>
            </div>
        `;

        // clear button
        const clearBtn = body.querySelector("#clear-tags-btn");
        if (clearBtn) {
            clearBtn.addEventListener("click", clearTags);
        }

        // search input (updates tags & counter only)
        const searchInput = body.querySelector("#search-tags-input");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                searchQuery = e.target.value;

                const tags = getTags();
                const filtered = searchQuery ?
                    tags.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) :
                    tags;

                const tagsContainer = body.querySelector("#tags-container");
                const counter = body.querySelector("#tags-counter");

                if (tagsContainer) tagsContainer.innerHTML = renderTags();
                if (counter) counter.textContent = `${filtered.length}/${tags.length}`;
            });
        }
    }

    /* ------------------------------
     * Box creation & drag handling
     * ------------------------------ */
    function createBox() {
        if (document.getElementById(BOX_ID)) return;

        const box = document.createElement("div");
        box.id = BOX_ID;
        Object.assign(box.style, {
            position: "fixed",
            width: "360px",
            maxWidth: "90vw",
            background: "#fff",
            color: "#111",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: "2147483647",
            left: "50%",
            top: "50%",
            transform: "translate(-10%, -80%)",
            userSelect: "none",
            overflow: "hidden",
            touchAction: "none"
        });

        // header
        const header = document.createElement("div");
        Object.assign(header.style, {
            padding: "10px 12px",
            background: "#f5f5f6",
            borderBottom: "1px solid rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: "600",
            cursor: "grab"
        });

        // left side (icon + title)
        const headerLeft = document.createElement("div");
        Object.assign(headerLeft.style, {
            display: "flex",
            alignItems: "center",
            gap: "8px"
        });

        const headerIcon = document.createElement("img");
        headerIcon.src = chrome.runtime.getURL("icon48.png");
        Object.assign(headerIcon.style, {
            width: "18px",
            height: "18px"
        });

        const headerTitle = document.createElement("span");
        headerTitle.textContent = "Tag Manager";
        Object.assign(headerTitle.style, {
            fontSize: "14px",
            fontWeight: "600",
            color: "#222"
        });

        headerLeft.appendChild(headerIcon);
        headerLeft.appendChild(headerTitle);

        // close button
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.innerHTML = "✕";
        Object.assign(closeBtn.style, {
            border: "none",
            background: "transparent",
            fontSize: "16px",
            cursor: "pointer",
            padding: "4px",
            lineHeight: "1",
            color: "#000"
        });
        closeBtn.addEventListener("click", () => box.remove());

        // assemble header
        header.appendChild(headerLeft);
        header.appendChild(closeBtn);

        // body
        const body = document.createElement("div");
        body.className = "body";
        renderContent(body);

        box.appendChild(header);
        box.appendChild(body);
        document.body.appendChild(box);

        enableDragging(box, header);
    }

    function enableDragging(box, handle) {
        let isDragging = false,
            startX = 0,
            startY = 0,
            startLeft = 0,
            startTop = 0;

        function onMouseMove(e) {
            if (!isDragging) return;
            box.style.left = startLeft + (e.clientX - startX) + "px";
            box.style.top = startTop + (e.clientY - startY) + "px";
            box.style.transform = "";
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }

        handle.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const r = box.getBoundingClientRect();
            startLeft = r.left;
            startTop = r.top;
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    /* ------------------------------
     * Global event delegation
     * ------------------------------ */
    document.addEventListener("click", (e) => {
        if (e.target.closest(".showcaseListing .showcaseContainer")) {
            createBox();
            return;
        }

        const pageBtn = e.target.closest(".pageHeading button");
        if (pageBtn) {
            createBox();
            return;
        }

        const tagBtn = e.target.closest(".tag-btn");
        if (tagBtn) {
            const tag = tagBtn.textContent.trim();
            const input = document.querySelector('input.formField[placeholder="Add tags..."]');
            if (input) {
                input.value = tag;
                input.setAttribute("value", tag);
            }
            selectedTag = tag;
            return;
        }

        if (e.target.closest(".left")) {
            const box = document.getElementById(BOX_ID);
            if (box) box.remove();
        }
    });

    /* ------------------------------
     * Form handling
     * ------------------------------ */
    document.addEventListener("click", () => {
        const form = document.querySelector('.fieldContainer form');
        const inputField = document.querySelector('input.formField[placeholder="Add tags..."]');

        if (form && inputField && !form.dataset.listenerAttached) {
            form.dataset.listenerAttached = "true";

            inputField.addEventListener("blur", () => {
                selectedTag = null;
            });

            form.addEventListener("click", (e) => {
                e.preventDefault();
                if (selectedTag) {
                    inputField.value = selectedTag;
                    inputField.setAttribute("value", selectedTag);
                }
            });

            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const value = inputField.value.trim();
                if (!value) return;

                saveTag(value);
                inputField.value = "";
                inputField.setAttribute("value", "");
                selectedTag = "";

                const box = document.getElementById(BOX_ID);
                if (box) {
                    const body = box.querySelector(".body");
                    if (body) renderContent(body);
                }
            });
        }
    });
})();
