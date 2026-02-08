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
        <p class="waitlist-subtitle">Be the first to know when this size is back in stock</p>
        <form class="waitlist-signup-form" data-product-id="${productId}" data-size="${size}">
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            class="waitlist-email-input"
          />
          <button type="submit" class="waitlist-submit-btn">
            Notify Me
          </button>
        </form>
        <p class="waitlist-privacy">We'll only email you when this item is back in stock. No spam.</p>
      </div>
    `;

    // Attach event listener
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

    // Disable form during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining...';

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          productId,
          size,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success! Show confirmation
        this.showSuccess(form, data.alreadySignedUp);
      } else {
        throw new Error(data.error || 'Failed to join waitlist');
      }

    } catch (error) {
      console.error('Waitlist signup error:', error);
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
    const message = alreadySignedUp
      ? 'You\'re already on the list!'
      : 'You\'re on the list!';

    form.innerHTML = `
      <div class="waitlist-success">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <p>${message}</p>
        <p class="waitlist-success-subtitle">We'll email you when this size is back in stock.</p>
      </div>
    `;
  }

  /**
   * Show error message
   */
  showError(form, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'waitlist-error';
    errorDiv.textContent = message;

    // Remove existing errors
    const existingError = form.querySelector('.waitlist-error');
    if (existingError) existingError.remove();

    // Add new error
    form.appendChild(errorDiv);

    // Remove error after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

// Create global instance
window.waitlistManager = new WaitlistManager();
