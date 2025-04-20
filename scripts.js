// Cart, payment, testimonial and other unrelated scripts start here

// Utility function to convert Rupiah price string to number
function rupiahToNumber(rupiahStr) {
    return parseInt(rupiahStr.replace(/[^\d]/g, '')) || 0;
}

// Add class "standard-product" to service-item divs where the select has "Standard" option selected by default
document.addEventListener('DOMContentLoaded', () => {
  const serviceItems = document.querySelectorAll('.service-item');
  serviceItems.forEach(item => {
    const select = item.querySelector('select.spec-select');
    if (select) {
      if (select.value === 'Standard') {
        item.classList.add('standard-product');
      }
      // Also listen for changes to update the class dynamically
      select.addEventListener('change', () => {
        if (select.value === 'Standard') {
          item.classList.add('standard-product');
        } else {
          item.classList.remove('standard-product');
        }
      });
    }
  });
});

// Utility function to convert number to formatted USD string
function numberToUSD(number) {
    const rate = 15000; // Example conversion rate: 1 USD = 15000 IDR
    const usd = number / rate;
    return '$' + usd.toFixed(2);
}

// Function to append USD price next to Rupiah price in text
function appendUSDPrice(text) {
    const match = text.match(/Rp\s?([\d\.]+)/);
    if (match) {
        const rupiahStr = match[1];
        const rupiahNumber = rupiahToNumber(rupiahStr);
        const usdStr = numberToUSD(rupiahNumber);
        // Remove existing USD price if any
        const cleanText = text.replace(/\s*\(\$[\d\.]+\)/, '');
        return cleanText + ' (' + usdStr + ')';
    }
    return text;
}

// Update all product prices and dropdown options to show USD price alongside Rupiah
function updatePricesWithUSD() {
    // Update h3 headings in service items
    const serviceHeadings = document.querySelectorAll('.service-item h3');
    serviceHeadings.forEach(h3 => {
        h3.textContent = appendUSDPrice(h3.textContent);
    });

    // Update options in specification selects
    const specSelects = document.querySelectorAll('.spec-select');
    specSelects.forEach(select => {
        for (let i = 0; i < select.options.length; i++) {
            const option = select.options[i];
            option.text = appendUSDPrice(option.text);
        }
    });
}

// Format number as currency in IDR
function formatCurrency(num) {
    return num.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
}

// Show automatic message notifications
function showMessage(message, type = 'info') {
    // type can be 'info', 'success', 'error'
    let messageDiv = document.getElementById('auto-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'auto-message';
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.padding = '15px 25px';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.fontWeight = 'bold';
        messageDiv.style.color = '#fff';
        messageDiv.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        document.body.appendChild(messageDiv);
    }
    messageDiv.textContent = message;
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        messageDiv.style.backgroundColor = '#dc3545';
    } else {
        messageDiv.style.backgroundColor = '#007bff';
    }
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 4000);
}

// Global variables
const paymentMethods = document.querySelectorAll('.payment-methods img');
const paymentSuccess = document.getElementById('payment-success');
const cartTableBody = document.querySelector('#cart-table tbody');
const totalPriceElement = document.getElementById('total-price');
const orderButtons = document.querySelectorAll('button.order-btn');

let cart = [];

// Update the cart display
function updateCart() {
    cartTableBody.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const row = document.createElement('tr');

        const serviceCell = document.createElement('td');
        serviceCell.textContent = item.service;
        row.appendChild(serviceCell);

        const quantityCell = document.createElement('td');
        quantityCell.textContent = item.quantity;
        row.appendChild(quantityCell);

        const priceCell = document.createElement('td');
        const itemTotalPrice = item.price * item.quantity;
        priceCell.textContent = formatCurrency(itemTotalPrice);
        row.appendChild(priceCell);

        const actionCell = document.createElement('td');
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Hapus';
        removeBtn.addEventListener('click', () => {
            if (confirm(`Apakah Anda yakin ingin menghapus layanan "${item.service}" dari keranjang?`)) {
                cart.splice(index, 1);
                saveCart();
                updateCart();
                updatePaymentAvailability();
                showMessage(`Layanan "${item.service}" dihapus dari keranjang.`, 'info');
                updatePaymentAmount();
            }
        });
        actionCell.appendChild(removeBtn);
        row.appendChild(actionCell);

        cartTableBody.appendChild(row);

        total += itemTotalPrice;
    });

    totalPriceElement.textContent = formatCurrency(total);

    updatePaymentAvailability();
    updatePaymentAmount();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
    updateCart();
    updatePaymentAvailability();
    updatePaymentAmount();
}

// Update payment amount on payment page
function updatePaymentAmount() {
    const paymentAmountElement = document.getElementById('payment-amount');
    if (!paymentAmountElement) return;

    let total = 0;
    cart.forEach(item => {
        total += item.price * (item.quantity || 1);
    });

    // Update localStorage with total price for payment page
    localStorage.setItem('totalPrice', total.toString());

    // If total is 0, hide the payment amount element to avoid showing "Nominal yang harus dibayar: Rp 0"
    if (total === 0) {
        paymentAmountElement.style.display = 'none';
    } else {
        paymentAmountElement.style.display = 'block';
        paymentAmountElement.textContent = 'Nominal yang harus dibayar: ' + formatCurrency(total);
    }

    // Also update or hide total-to-pay element accordingly
    let totalToPayElement = document.getElementById('total-to-pay');
    if (totalToPayElement) {
        if (total === 0) {
            totalToPayElement.style.display = 'none';
            totalToPayElement.textContent = '';
        } else {
            totalToPayElement.style.display = 'block';
            totalToPayElement.textContent = 'Total yang dibayar: ' + formatCurrency(total);
        }
    }
}

// Enable/disable payment methods based on cart content
function updatePaymentAvailability() {
    if (cart.length === 0) {
        paymentMethods.forEach(m => {
            m.style.pointerEvents = 'none';
            m.style.opacity = '0.5';
        });
        if (paymentSuccess) {
            paymentSuccess.style.display = 'none';
        }
    } else {
        paymentMethods.forEach(m => {
            m.style.pointerEvents = 'auto';
            m.style.opacity = '1';
        });
    }
}

// Process payment simulation
function processPayment(method) {
    if (cart.length === 0) {
        alert('Keranjang belanja kosong. Silakan tambahkan layanan terlebih dahulu.');
        return;
    }

    // Disable all payment method images during processing
    paymentMethods.forEach(m => m.style.pointerEvents = 'none');
    if (paymentSuccess) {
        paymentSuccess.style.display = 'none';
    }

    // Show loading spinner or message
    const paymentSection = document.getElementById('payment');
    let loadingDiv = document.getElementById('payment-loading');
    if (!loadingDiv && paymentSection) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'payment-loading';
        loadingDiv.style.marginTop = '20px';
        loadingDiv.style.padding = '15px';
        loadingDiv.style.backgroundColor = '#fff3cd';
        loadingDiv.style.color = '#856404';
        loadingDiv.style.border = '1px solid #ffeeba';
        loadingDiv.style.borderRadius = '5px';
        loadingDiv.style.fontWeight = 'bold';
        loadingDiv.textContent = 'Memproses pembayaran... Mohon tunggu.';
        paymentSection.appendChild(loadingDiv);
    }
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
    }

    // Get the payment method name from the title attribute
    const methodName = method.getAttribute('title') || 'metode pembayaran';

    // Simulate API gateway call for quota order
    // Replace the URL with real API endpoint if available
    fetch('https://mock-api-gateway.example.com/order-quota', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cart: cart,
            paymentMethod: methodName
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Gagal memproses pembayaran.');
        }
        return response.json();
    })
    .then(data => {
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
        if (data.success) {
            const paymentMethodNameSpan = document.getElementById('payment-method-name');
            if (paymentMethodNameSpan) {
                paymentMethodNameSpan.textContent = methodName;
            }
            if (paymentSuccess) {
                paymentSuccess.style.display = 'block';
                paymentSuccess.classList.add('show');
            }
            cart = [];
            updateCart();
            updatePaymentAmount();
            showMessage('Pembayaran berhasil diproses. Silakan hubungi nomor +62 812-3456-7890 dan bawa bukti pembelian Anda.', 'success');
        } else {
            showMessage('Pembayaran gagal: ' + (data.message || 'Terjadi kesalahan.'), 'error');
        }
        paymentMethods.forEach(m => m.style.pointerEvents = 'auto');
    })
    .catch(error => {
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
        showMessage(error.message, 'error');
        paymentMethods.forEach(m => m.style.pointerEvents = 'auto');
    });
}

// Add event listeners to order buttons and handle cart updates automatically
orderButtons.forEach(button => {
    button.addEventListener('click', () => {
        const service = button.getAttribute('data-service');
        const serviceItemDiv = button.closest('.service-item');
        if (!serviceItemDiv) {
            alert('Terjadi kesalahan: tidak dapat menemukan informasi layanan.');
            return;
        }
        const priceHeading = serviceItemDiv.querySelector('h3');
        if (!priceHeading) {
            alert('Terjadi kesalahan: tidak dapat menemukan harga layanan.');
            return;
        }
        const priceText = priceHeading.textContent;
        const priceMatch = priceText.match(/Rp\.?\s*([\d\.]+)/i);
        if (!priceMatch) {
            alert('Terjadi kesalahan saat memproses harga layanan.');
            return;
        }

        // Get selected specification if any
        let spec = '';
        let price = 0;
        const specSelect = serviceItemDiv.querySelector('.spec-select');
        if (specSelect) {
            spec = specSelect.value;
            // Extract price from selected option text, e.g. "Standard - Rp 600.000"
            const selectedOptionText = specSelect.options[specSelect.selectedIndex].text;
            const priceMatchSpec = selectedOptionText.match(/Rp\s*([\d\.]+)/i);
            if (priceMatchSpec) {
                price = parseInt(priceMatchSpec[1].replace(/\./g, ''));
            } else {
                price = parseInt(priceMatch[1].replace(/\./g, ''));
            }
        } else {
            price = parseInt(priceMatch[1].replace(/\./g, ''));
        }

        // Compose full service name with spec if applicable
        const fullServiceName = spec ? `${service} (${spec})` : service;

        // Check if service with same spec already in cart
        const existingIndex = cart.findIndex(item => item.service === fullServiceName);
        if (existingIndex === -1) {
            cart.push({ service: fullServiceName, price, quantity: 1 });
        } else {
            cart[existingIndex].quantity += 1;
        }

        showMessage(`Layanan "${fullServiceName}" berhasil ditambahkan ke keranjang.`, 'success');
        updateCart();
        saveCart();
    });
});

// Back to top button functionality
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Testimonial feature implementation
document.addEventListener('DOMContentLoaded', () => {
    // Load testimonials from localStorage
    let testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];

    const testimonialList = document.getElementById('testimonial-list');
    const testimonialCount = document.getElementById('testimonial-count');
    const testimonialForm = document.getElementById('testimonial-form');

    // Function to render testimonials
    function renderTestimonials() {
        if (!testimonialList) return;
        testimonialList.innerHTML = '';
        testimonials.forEach(testimonial => {
            const item = document.createElement('div');
            item.className = 'testimonial-item';
            item.style.marginBottom = '15px';
            item.style.padding = '10px';
            item.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            item.style.borderRadius = '4px';

            const textP = document.createElement('p');
            textP.textContent = `"${testimonial.text}"`;
            textP.style.color = 'black'; // Change testimonial text color to black
            item.appendChild(textP);

            const nameH4 = document.createElement('h4');
            nameH4.textContent = `- ${testimonial.name}`;
            nameH4.style.color = 'black'; // Change author name color to black
            item.appendChild(nameH4);

            testimonialList.appendChild(item);
        });
        if (testimonialCount) {
            testimonialCount.textContent = testimonials.length;
        }
    }

    // Initial render
    renderTestimonials();

    // Handle form submission
    if (testimonialForm) {
        testimonialForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('testimonial-name');
            const textInput = document.getElementById('testimonial-text');

            const newTestimonial = {
                name: nameInput ? nameInput.value.trim() : '',
                text: textInput ? textInput.value.trim() : ''
            };

            if (newTestimonial.name && newTestimonial.text) {
                testimonials.push(newTestimonial);
                localStorage.setItem('testimonials', JSON.stringify(testimonials));
                renderTestimonials();
                if (testimonialForm) testimonialForm.reset();
                alert('Terima kasih atas testimoni Anda!');
            } else {
                alert('Mohon isi nama dan testimoni dengan lengkap.');
            }
        });
    }

    // QRIS image modal functionality
    const qrisImage = document.getElementById('qris-image');
    const qrisModal = document.getElementById('qris-modal');
    const modalClose = document.getElementById('modal-close');

    function openModal() {
        if (qrisModal) qrisModal.style.display = 'block';
    }

    function closeModal() {
        if (qrisModal) qrisModal.style.display = 'none';
    }

    if (qrisImage) {
        qrisImage.addEventListener('click', () => {
            // Set modal image src to QRIS image src
            const modalImg = document.getElementById('qris-modal-img');
            if (modalImg) modalImg.src = qrisImage.src;

            // Calculate total nominal amount from cart
            let total = 0;
            cart.forEach(item => {
                total += item.price * (item.quantity || 1);
            });

            // Display total nominal amount in modal
            const modalTotalAmount = document.getElementById('modal-total-amount');
            if (modalTotalAmount) {
                modalTotalAmount.textContent = 'Total Nominal: ' + formatCurrency(total);
            }

            // Show modal
            openModal();
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (qrisModal) {
        qrisModal.addEventListener('click', (e) => {
            if (e.target === qrisModal) {
                closeModal();
            }
        });
    }
});

// Automatically process QRIS payment on payment.html page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('payment.html')) {
        const qrisMethod = Array.from(paymentMethods).find(m => m.getAttribute('title') === 'QRIS');
        if (qrisMethod) {
            // Hide other payment methods
            paymentMethods.forEach(m => {
                if (m !== qrisMethod) {
                    m.style.display = 'none';
                } else {
                    m.style.display = 'inline-block';
                }
            });
            // Automatically process QRIS payment
            processPayment(qrisMethod);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updatePricesWithUSD();
    loadCart();
    updateCart();
    updatePaymentAvailability();

    // Cookie consent banner logic
    const cookieBanner = document.getElementById('cookie-consent-banner');
    const acceptBtn = document.getElementById('accept-cookies-btn');

    function hasConsented() {
        return localStorage.getItem('cookieConsent') === 'true';
    }

    function showBanner() {
        if (cookieBanner) {
            cookieBanner.style.display = 'flex';
        }
    }

    function hideBanner() {
        if (cookieBanner) {
            cookieBanner.style.display = 'none';
        }
    }

    if (!hasConsented()) {
        showBanner();
    } else {
        hideBanner();
    }

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'true');
            hideBanner();
        });
    }

    // Add event listener for proceed to payment button
    const proceedToPaymentBtn = document.getElementById('proceed-to-payment');
    if (proceedToPaymentBtn) {
        proceedToPaymentBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Keranjang belanja kosong. Silakan tambahkan layanan terlebih dahulu sebelum melanjutkan ke pembayaran.');
                return;
            }
            // Save cart before redirecting
            saveCart();
            // Redirect to payment page
            window.location.href = 'payment.html';
        });
    }

    if (window.location.pathname.endsWith('payment.html')) {
        updatePaymentAmount();
    }
});
