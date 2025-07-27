export class DynamicPagination extends HTMLElement {
    static get observedAttributes() {
        return ['total-pages', 'current-page'];
    }
    
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.totalPages = parseInt(this.getAttribute('total-pages')) || 1;
        this.currentPage = parseInt(this.getAttribute('current-page')) || 1;
    }
    
    connectedCallback() {
        this.render();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'total-pages') {
            this.totalPages = parseInt(newValue) || 1;
        }
        if (name === 'current-page') {
            this.currentPage = parseInt(newValue) || 1;
        }
        this.render();
    }
    
    render() {
        this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));
        
        let html = `
            <style>
                .pagination {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    justify-content: center;
                    margin: 20px 0;
                    font-family: Arial, sans-serif;
                }
                .page-link {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    color: #333;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }
                .page-link:hover {
                    background-color: #f0f0f0;
                }
                .page-link.active {
                    background-color: #007bff;
                    color: white;
                    border-color: #007bff;
                }
                .page-link.prev, .page-link.next {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .page-link-dots {
                    padding: 8px 12px;
                    color: #333;
                }
            </style>
            <nav class="pagination">
                <a href="#" class="page-link prev">
                    <i class="fa-solid fa-arrow-left"></i> Previous
                </a>
        `;
        
        html += this.createPageLink(1);
        
        if (this.totalPages > 1) {
            const maxVisiblePages = 5;
            let startPage, endPage;
            
            if (this.totalPages <= maxVisiblePages) {
                startPage = 2;
                endPage = this.totalPages - 1;
            } else {
                startPage = Math.max(2, this.currentPage - 1);
                endPage = Math.min(this.totalPages - 1, this.currentPage + 1);
                
                if (this.currentPage <= 3) {
                    startPage = 2;
                    endPage = 4;
                } else if (this.currentPage >= this.totalPages - 2) {
                    startPage = this.totalPages - 3;
                    endPage = this.totalPages - 1;
                }
            }
            
            if (startPage > 2) {
                html += `<span class="page-link-dots">...</span>`;
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += this.createPageLink(i);
            }
            
            if (endPage < this.totalPages - 1) {
                html += `<span class="page-link-dots">...</span>`;
            }
            
            html += this.createPageLink(this.totalPages);
        }
        
        html += `
                <a href="#" class="page-link next">
                    Next <i class="fa-solid fa-arrow-right"></i>
                </a>
            </nav>
        `;
        
        this.shadowRoot.innerHTML = html;
        
        this.addEventListeners();
    }
    
    createPageLink(pageNumber) {
        const isActive = pageNumber === this.currentPage;
        return `<a href="#" class="page-link ${isActive ? 'active' : ''}">${pageNumber}</a>`;
    }
    
    addEventListeners() {
        this.shadowRoot.querySelectorAll('.page-link').forEach(link => {
            if (!link.classList.contains('page-link-dots')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (link.classList.contains('prev')) {
                        this.setAttribute('current-page', Math.max(1, this.currentPage - 1));
                    } else if (link.classList.contains('next')) {
                        this.setAttribute('current-page', Math.min(this.totalPages, this.currentPage + 1));
                    } else {
                        const page = parseInt(link.textContent);
                        if (!isNaN(page)) {
                            this.setAttribute('current-page', page);
                        }
                    }
                    
                    this.dispatchEvent(new CustomEvent('page-change', {
                        detail: { page: this.currentPage }
                    }));
                });
            }
        });
    }
}

// Registra el componente si no existe
if (!customElements.get('dynamic-pagination')) {
    customElements.define('dynamic-pagination', DynamicPagination);
}