// Get all input elements
const pileDiameterInput = document.getElementById('pile-diameter');
const pileDepthInput = document.getElementById('pile-depth');
const depthModeSelect = document.getElementById('depth-mode');
const strengthReductionFactorInput = document.getElementById('strength-reduction-factor');
const diameterMultiplierInput = document.getElementById('diameter-multiplier');
const resultDisplay = document.getElementById('capacity-result');

// Layer inputs
const layers = [
    {
        name: document.getElementById('layer1-name'),
        top: document.getElementById('layer1-top'),
        skinFriction: document.getElementById('layer1-skin-friction'),
        endBearing: document.getElementById('layer1-end-bearing')
    },
    {
        name: document.getElementById('layer2-name'),
        top: document.getElementById('layer2-top'),
        skinFriction: document.getElementById('layer2-skin-friction'),
        endBearing: document.getElementById('layer2-end-bearing')
    },
    {
        name: document.getElementById('layer3-name'),
        top: document.getElementById('layer3-top'),
        skinFriction: document.getElementById('layer3-skin-friction'),
        endBearing: document.getElementById('layer3-end-bearing')
    },
    {
        name: document.getElementById('layer4-name'),
        top: document.getElementById('layer4-top'),
        skinFriction: document.getElementById('layer4-skin-friction'),
        endBearing: document.getElementById('layer4-end-bearing')
    }
];

// Function to get valid layers (layers with at least top elevation entered)
function getValidLayers() {
    return layers.filter(layer => {
        const topValue = layer.top.value.trim();
        return topValue !== '' && !isNaN(parseFloat(topValue));
    });
}

// Function to sort layers by top elevation (ascending for mbgl, descending for mRL)
function sortLayersByTop(layers, isMRL) {
    return [...layers].sort((a, b) => {
        const topA = parseFloat(a.top.value);
        const topB = parseFloat(b.top.value);
        // For mbgl: lower values are deeper (higher in the list)
        // For mRL: lower values are deeper (higher in the list)
        // So for both, we want ascending order
        return topA - topB;
    });
}

// Function to calculate skin friction
function calculateSkinFriction(pileDiameter, pileDepth, strengthReductionFactor, isMRL) {
    if (!pileDiameter || !pileDepth || !strengthReductionFactor) {
        return null;
    }
    
    const validLayers = getValidLayers();
    if (validLayers.length === 0) {
        return null;
    }
    
    const sortedLayers = sortLayersByTop(validLayers, isMRL);
    let totalSkinFriction = 0;
    const PI = Math.PI;
    
    // For mbgl: 0 is ground, positive values are deeper
    // For mRL: lower values are deeper, so ground is the highest (shallowest) layer top
    // We need to find the shallowest layer (highest value for mbgl, lowest value for mRL)
    let groundLevel;
    if (isMRL) {
        // For mRL, find the highest value (shallowest) - this is ground level
        groundLevel = Math.max(...sortedLayers.map(l => parseFloat(l.top.value)));
    } else {
        // For mbgl, ground is at 0
        groundLevel = 0;
    }
    
    const pileTop = groundLevel;
    const pileBase = isMRL ? (groundLevel - pileDepth) : (groundLevel + pileDepth);
    
    // Process each layer
    for (let i = 0; i < sortedLayers.length; i++) {
        const layer = sortedLayers[i];
        const layerTop = parseFloat(layer.top.value);
        let layerBottom;
        if (i < sortedLayers.length - 1) {
            layerBottom = parseFloat(sortedLayers[i + 1].top.value);
        } else {
            // Last layer extends very deep
            if (isMRL) {
                layerBottom = layerTop - 1000; // For mRL, subtract to go deeper (lower value)
            } else {
                layerBottom = layerTop + 1000; // For mbgl, add to go deeper (higher value)
            }
        }
        
        const skinFrictionValue = layer.skinFriction.value.trim();
        if (skinFrictionValue === '' || isNaN(parseFloat(skinFrictionValue))) {
            continue; // Skip layers without skin friction value
        }
        
        const skinFriction = parseFloat(skinFrictionValue);
        
        // Determine intersection of pile with this layer
        // For mbgl: larger values are deeper (0 = ground, 15 = 15m deep)
        // For mRL: smaller values are deeper (100 = ground, 85 = 15m deep)
        let intersectionTop, intersectionBottom;
        if (isMRL) {
            // For mRL: higher values are shallower, lower values are deeper
            // Pile goes from pileTop (shallow, high mRL value) to pileBase (deep, low mRL value)
            // Layer goes from layerTop (shallow, high mRL value) to layerBottom (deep, low mRL value)
            // Overlap starts at the deeper of the two tops (lower mRL value, where both have started)
            // Overlap ends at the shallower of the two bottoms (higher mRL value, where one ends)
            intersectionTop = Math.max(pileTop, layerTop); // Deeper of the two tops (lower mRL value)
            intersectionBottom = Math.min(pileBase, layerBottom); // Shallower of the two bottoms (higher mRL value)
            
            // Valid intersection: top >= bottom (top is deeper/lower mRL, bottom is shallower/higher mRL)
            if (intersectionTop >= intersectionBottom) {
                const lengthInLayer = intersectionTop - intersectionBottom; // Positive when top >= bottom
                const surfaceArea = PI * pileDiameter * lengthInLayer; // m²
                const contribution = skinFriction * surfaceArea * strengthReductionFactor; // kPa × m² = kN
                totalSkinFriction += contribution;
            }
        } else {
            // For mbgl: larger values are deeper
            // Pile goes from pileTop (0, shallow) to pileBase (depth, deep)
            // Layer goes from layerTop (shallow) to layerBottom (deep)
            intersectionTop = Math.max(pileTop, layerTop); // Deeper of the two tops
            intersectionBottom = Math.min(pileBase, layerBottom); // Shallower of the two bottoms
            
            // Valid intersection: top < bottom (top is shallower, bottom is deeper)
            if (intersectionTop < intersectionBottom) {
                const lengthInLayer = intersectionBottom - intersectionTop;
                const surfaceArea = PI * pileDiameter * lengthInLayer; // m²
                const contribution = skinFriction * surfaceArea * strengthReductionFactor; // kPa × m² = kN
                totalSkinFriction += contribution;
            }
        }
    }
    
    return Math.round(totalSkinFriction); // Round to nearest whole number
}

// Function to calculate end bearing
function calculateEndBearing(pileDiameter, pileDepth, strengthReductionFactor, diameterMultiplier, isMRL) {
    if (!pileDiameter || !pileDepth || !strengthReductionFactor) {
        return null;
    }
    
    const validLayers = getValidLayers();
    if (validLayers.length === 0) {
        return null;
    }
    
    const sortedLayers = sortLayersByTop(validLayers, isMRL);
    
    // For mbgl: 0 is ground, positive values are deeper
    // For mRL: lower values are deeper, so ground is the highest (shallowest) layer top
    let groundLevel;
    if (isMRL) {
        // For mRL, find the highest value (shallowest) - this is ground level
        groundLevel = Math.max(...sortedLayers.map(l => parseFloat(l.top.value)));
    } else {
        // For mbgl, ground is at 0
        groundLevel = 0;
    }
    
    const pileBase = isMRL ? (groundLevel - pileDepth) : (groundLevel + pileDepth);
    
    // Range for end bearing consideration:
    // - At base depth
    // - Within 1× diameter below base
    // - Within multiplier× diameter above base
    let rangeTop, rangeBottom;
    if (isMRL) {
        // For mRL: smaller values are deeper
        // rangeTop is shallower (higher mRL value) = base + multiplier×diameter
        // rangeBottom is deeper (lower mRL value) = base - 1×diameter
        rangeTop = pileBase + (diameterMultiplier * pileDiameter); // Shallower (higher mRL)
        rangeBottom = pileBase - (1 * pileDiameter); // Deeper (lower mRL)
    } else {
        // For mbgl: larger values are deeper
        rangeTop = pileBase - (diameterMultiplier * pileDiameter); // Shallower (smaller mbgl)
        rangeBottom = pileBase + (1 * pileDiameter); // Deeper (larger mbgl)
    }
    
    // Find all layers within this range and collect their end bearing values
    const endBearingValues = [];
    
    for (const layer of sortedLayers) {
        const layerTop = parseFloat(layer.top.value);
        const layerIndex = sortedLayers.indexOf(layer);
        let layerBottom;
        if (layerIndex < sortedLayers.length - 1) {
            layerBottom = parseFloat(sortedLayers[layerIndex + 1].top.value);
        } else {
            // Last layer extends very deep
            if (isMRL) {
                layerBottom = layerTop - 1000; // For mRL, subtract to go deeper (lower value)
            } else {
                layerBottom = layerTop + 1000; // For mbgl, add to go deeper (higher value)
            }
        }
        
        // Check if layer intersects with the range
        // For mbgl: larger values are deeper
        // For mRL: smaller values are deeper (lower mRL = deeper)
        let layerIntersectsRange;
        if (isMRL) {
            // For mRL: layerTop is shallower (higher value), layerBottom is deeper (lower value)
            // rangeTop is shallower (higher value), rangeBottom is deeper (lower value)
            // Intersection: layer and range overlap if not (layerBottom > rangeTop || layerTop < rangeBottom)
            // But wait: for mRL, deeper means lower value, so:
            // layerBottom (deeper, lower value) should be <= rangeTop (shallower, higher value)
            // layerTop (shallower, higher value) should be >= rangeBottom (deeper, lower value)
            layerIntersectsRange = !(layerBottom > rangeTop || layerTop < rangeBottom);
        } else {
            // For mbgl: larger values are deeper
            // layerTop is shallower (smaller value), layerBottom is deeper (larger value)
            // rangeTop is shallower (smaller value), rangeBottom is deeper (larger value)
            layerIntersectsRange = !(layerBottom < rangeTop || layerTop > rangeBottom);
        }
        
        if (layerIntersectsRange) {
            const endBearingValue = layer.endBearing.value.trim();
            if (endBearingValue !== '' && !isNaN(parseFloat(endBearingValue))) {
                endBearingValues.push(parseFloat(endBearingValue));
            }
        }
    }
    
    if (endBearingValues.length === 0) {
        return null;
    }
    
    // Use the lowest end bearing value
    const lowestEndBearing = Math.min(...endBearingValues);
    
    // Calculate cross-sectional area
    const PI = Math.PI;
    const crossSectionalArea = PI * Math.pow(pileDiameter / 2, 2); // m²
    
    // End bearing = lowest end bearing × area × strength reduction factor
    const endBearing = lowestEndBearing * crossSectionalArea * strengthReductionFactor; // kPa × m² = kN
    
    return Math.round(endBearing); // Round to nearest whole number
}

// Function to validate inputs and get error messages
function validateInputs() {
    const errors = [];
    
    if (!pileDiameterInput.value.trim() || isNaN(parseFloat(pileDiameterInput.value))) {
        errors.push('Please enter pile diameter to get capacity');
    }
    
    if (!pileDepthInput.value.trim() || isNaN(parseFloat(pileDepthInput.value))) {
        errors.push('Please enter pile depth to get capacity');
    }
    
    const validLayers = getValidLayers();
    if (validLayers.length === 0) {
        errors.push('Please enter at least one soil layer to get capacity');
    }
    
    return errors;
}

// Function to update results
function updateResults() {
    resultDisplay.classList.remove('show', 'error');
    
    const errors = validateInputs();
    if (errors.length > 0) {
        resultDisplay.textContent = errors.join('\n');
        resultDisplay.classList.add('show', 'error');
        return;
    }
    
    const pileDiameter = parseFloat(pileDiameterInput.value);
    const pileDepth = parseFloat(pileDepthInput.value);
    const strengthReductionFactor = parseFloat(strengthReductionFactorInput.value);
    const diameterMultiplier = parseFloat(diameterMultiplierInput.value);
    const isMRL = depthModeSelect.value === 'mrl';
    
    const skinFriction = calculateSkinFriction(pileDiameter, pileDepth, strengthReductionFactor, isMRL);
    const endBearing = calculateEndBearing(pileDiameter, pileDepth, strengthReductionFactor, diameterMultiplier, isMRL);
    
    if (skinFriction === null || endBearing === null) {
        resultDisplay.textContent = 'Unable to calculate capacity. Please check your inputs.';
        resultDisplay.classList.add('show', 'error');
        return;
    }
    
    const totalCapacity = skinFriction + endBearing;
    
    resultDisplay.innerHTML = `
        <div style="margin-bottom: 10px;"><strong>Allowable Skin Friction:</strong> ${skinFriction} kN</div>
        <div style="margin-bottom: 10px;"><strong>Allowable End Bearing:</strong> ${endBearing} kN</div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #3e3e42;"><strong>Total Capacity:</strong> ${totalCapacity} kN</div>
    `;
    resultDisplay.classList.add('show');
}

// Add event listeners to all inputs
pileDiameterInput.addEventListener('input', updateResults);
pileDepthInput.addEventListener('input', updateResults);
depthModeSelect.addEventListener('change', updateResults);
strengthReductionFactorInput.addEventListener('input', updateResults);
diameterMultiplierInput.addEventListener('input', updateResults);

// Add event listeners to all layer inputs
layers.forEach(layer => {
    layer.name.addEventListener('input', updateResults);
    layer.top.addEventListener('input', updateResults);
    layer.skinFriction.addEventListener('input', updateResults);
    layer.endBearing.addEventListener('input', updateResults);
});

// Initial calculation
updateResults();

