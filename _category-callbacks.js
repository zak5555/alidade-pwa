// Global callback when user selects category
window.selectCategory = function (itemId, itemName, fairPrice, askingPrice) {
    // Close modal
    const modal = document.getElementById('category-selector-modal');
    if (modal) modal.remove();

    // Resolve with selected item data
    if (window._categoryResolve) {
        window._categoryResolve({
            topPrediction: {
                label: itemId,
                displayName: itemName,
                confidence: 1.0  // User selected = 100% confidence
            },
            fairPrice: fairPrice,
            askingPrice: askingPrice,
            method: 'manual_selection',
            alternatives: []
        });
        window._categoryResolve = null;
    }
};

// Global callback for cancel
window.closeCategorySelector = function (result) {
    const modal = document.getElementById('category-selector-modal');
    if (modal) modal.remove();

    if (window._categoryResolve) {
        window._categoryResolve(result); // null = cancelled
        window._categoryResolve = null;
    }
};
