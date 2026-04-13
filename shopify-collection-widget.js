const CONFIG = {
  storeUrl: 'https://charriol-geneve.myshopify.com',
  accessToken: 'b54f4f45a4e83458cd38eb0b5e15fc85',
  collectionHandle: 'ambers-design',
};

(function() {
  const STOREFRONT_API_URL = `${CONFIG.storeUrl}/api/2024-01/graphql.json`;

  // Récupérer les produits de la collection
  async function fetchCollectionProducts() {
    const query = `
      query {
        collectionByHandle(handle: "${CONFIG.collectionHandle}") {
          products(first: 100) {
            edges {
              node {
                id
                title
                handle
                featuredImage {
                  url
                  altText
                }
                variants(first: 100) {
                  edges {
                    node {
                      id
                      title
                      image {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch(STOREFRONT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': CONFIG.accessToken,
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL Error:', data.errors);
        return [];
      }

      return data.data?.collectionByHandle?.products?.edges || [];
    } catch (error) {
      console.error('Fetch Error:', error);
      return [];
    }
  }

  // Créer le widget HTML
  function renderWidget(products) {
    const container = document.getElementById('shopify-collection-widget');
    if (!container) return;

    let html = '<div class="shopify-collection-widget">';
    
    if (products.length === 0) {
      html += '<p>Aucun produit trouvé</p>';
    } else {
      html += '<div class="products-grid">';
      
      products.forEach(({ node: product }) => {
        const variant = product.variants.edges[0]?.node;
        if (!variant) return;

        const image = product.featuredImage || variant.image;
        const imageUrl = image?.url || 'https://via.placeholder.com/300';

        html += `
          <div class="product-card">
            <div class="product-image">
              <img src="${imageUrl}" alt="${product.title}" />
            </div>
            <div class="product-info">
              <h3 class="product-title">${product.title}</h3>
              <p class="product-variant">${variant.title}</p>
            </div>
          </div>
        `;
      });

      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // Ajouter les styles
    addStyles();
  }

  // Ajouter les styles CSS
  function addStyles() {
    if (document.getElementById('shopify-collection-widget-styles')) return;

    const styles = `
      .shopify-collection-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        background: #f9f9f9;
        border-radius: 8px;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        margin: 0;
        padding: 0;
      }

      .product-card {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .product-image {
        width: 100%;
        height: 250px;
        overflow: hidden;
        background: #f0f0f0;
      }

      .product-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .product-info {
        padding: 15px;
      }

      .product-title {
        margin: 0 0 5px 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .product-variant {
        margin: 0;
        font-size: 12px;
        color: #999;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'shopify-collection-widget-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  // Initialiser le widget
  async function init() {
    const products = await fetchCollectionProducts();
    renderWidget(products);
  }

  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
