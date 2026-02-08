// ============================================================================
// Waitlist Module - Back In Stock Notifications
// Handles waitlist signup UI and API calls
// ============================================================================

export class WaitlistManager {
  constructor() {
    this.apiEndpoint = '/.netlify/functions/waitlist-signup';
  }

  /**
   * Show waitlist form for a sold out product/size
   * @param {string} productId - Product UUID
   * @param {string} size - Size (e.g., "M", "L")
   * @param {HTMLElement} container - Container element for the form
   */
  renderWaitlistForm(productId, size, container) {
    container.innerHTML = `
      <div class="waitlist-form">
        <p class="sold-out-message">Sold Out</p>
        <div class="waitlist-divider"></div>
        <p class="waitlist-subtitle">Be the first to know when this size is back</p>
        <form class="waitlist-signup-form" data-product-id="${productId}" data-size="${size}">
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            required
            class="waitlist-email-input"
            autocomplete="email"
          />
          <button type="submit" class="waitlist-submit-btn">
            Notify Me
          </button>
        </form>
        <p class="waitlist-privacy">One email when restocked. No spam, ever.</p>
      </div>
    `;

    const form = container.querySelector('.waitlist-signup-form');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  /**
   * Handle waitlist form submission
   */
  async handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('.waitlist-submit-btn');
    const emailInput = form.querySelector('.waitlist-email-input');

    const email = emailInput.value.trim();
    const productId = form.dataset.productId;
    const size = form.dataset.size;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining...';

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productId, size }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.showSuccess(form, data.alreadySignedUp);
      } else {
        throw new Error(data.error || 'Failed to join waitlist');
      }
    } catch (error) {
      console.error('[Waitlist] Signup error:', error);
      this.showError(form, error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Notify Me';
    }
  }

  /**
   * Show success message
   */
  showSuccess(form, alreadySignedUp = false) {
    const title = alreadySignedUp
      ? "You're already on the list"
      : "You're on the list";

    const wrapper = form.closest('.waitlist-form');
    wrapper.innerHTML = `
      <div class="waitlist-success">
        <div class="waitlist-success-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <p class="waitlist-success-title">${title}</p>
        <p class="waitlist-success-subtitle">We'll let you know the moment this size is back in stock.</p>
      </div>
    `;
  }

  /**
   * Show error message
   */
  showError(form, message) {
    const existingError = form.querySelector('.waitlist-error');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'waitlist-error';
    errorDiv.textContent = message;
    form.appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
  }
}

// Create global instance
window.waitlistManager = new WaitlistManager();
