const CONFIG = {
  storeUrl: 'https://charriol-geneve.myshopify.com',
  accessToken: 'b54f4f45a4e83458cd38eb0b5e15fc85',
  collectionHandle: 'ambers-design',
  
  // GESTION DEVISES
  enableCurrencyConversion: false,
  useMsrpMetafield: true,
  msrpMetafieldKey: 'msrp_amber_s_design',
  sourceCurrency: 'CHF',
  targetCurrency: 'USD',
  exchangeRate: 1.08,
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
                      price
                      image {
                        url
                        altText
                      }
                      metafield(namespace: "custom", key: "${CONFIG.msrpMetafieldKey}") {
                        value
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

  // Formatter le prix
  function formatPrice(price, currency = 'USD') {
    if (CONFIG.useMsrpMetafield && currency === 'USD') {
      return `$${parseFloat(price).toFixed(2)}`;
    }
    return `${currency} ${parseFloat(price).toFixed(2)}`;
  }

  // Obtenir le prix à afficher (MSRP si disponible, sinon prix normal)
  function getDisplayPrice(variant) {
    if (CONFIG.useMsrpMetafield && variant.metafield?.value) {
      return formatPrice(variant.metafield.value, 'USD');
    }
    
    if (CONFIG.enableCurrencyConversion) {
      const convertedPrice = parseFloat(variant.price) * CONFIG.exchangeRate;
      return formatPrice(convertedPrice, CONFIG.targetCurrency);
    }
    
    return formatPrice(variant.price, CONFIG.sourceCurrency);
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
        const displayPrice = getDisplayPrice(variant);

        html += `
          <div class="product-card">
            <div class="product-image">
              <img src="${imageUrl}" alt="${product.title}" />
            </div>
            <div class="product-info">
              <h3 class="product-title">${product.title}</h3>
              <p class="product-variant">${variant.title}</p>
              <p class="product-price">${displayPrice}</p>
              <button class="add-to-cart-btn" data-variant-id="${variant.id}">
                Ajouter au panier
              </button>
            </div>
          </div>
        `;
      });

      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // Ajouter les écouteurs pour le panier
    container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.variantId;
        addToCart(variantId);
      });
    });

    // Ajouter les styles
    addStyles();
  }

  // Ajouter au panier
  async function addToCart(variantId) {
    try {
      const cartQuery = `
        mutation {
          checkoutCreate(input: {
            lineItems: [{ variantId: "${variantId}", quantity: 1 }]
          }) {
            checkout {
              webUrl
            }
            checkoutUserErrors {
              message
            }
          }
        }
      `;

      const response = await fetch(STOREFRONT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': CONFIG.accessToken,
        },
        body: JSON.stringify({ query: cartQuery }),
      });

      const data = await response.json();
      const checkoutUrl = data.data?.checkoutCreate?.checkout?.webUrl;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        alert('Erreur lors de l\'ajout au panier');
      }
    } catch (error) {
      console.error('Cart Error:', error);
      alert('Erreur : ' + error.message);
    }
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
        margin: 0 0 10px 0;
        font-size: 12px;
        color: #999;
      }

      .product-price {
        margin: 10px 0;
        font-size: 18px;
        font-weight: bold;
        color: #0066cc;
      }

      .add-to-cart-btn {
        width: 100%;
        padding: 10px;
        background: #0066cc;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .add-to-cart-btn:hover {
        background: #0052a3;
      }

      .add-to-cart-btn:active {
        opacity: 0.9;
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
