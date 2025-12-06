// Helper function to convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Helper function to convert radians to degrees
function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

// First Calculator: Convert between angle and ratio
document.getElementById('convert-btn').addEventListener('click', function() {
    const angleInput = document.getElementById('angle-input').value.trim();
    const ratioInput = document.getElementById('ratio-input').value.trim();
    const resultDisplay = document.getElementById('convert-result');
    
    resultDisplay.classList.remove('show', 'error');
    
    // Check if both inputs are empty
    if (!angleInput && !ratioInput) {
        resultDisplay.textContent = 'Please enter either an angle or a ratio.';
        resultDisplay.classList.add('show', 'error');
        return;
    }
    
    // Check if both inputs are filled
    if (angleInput && ratioInput) {
        resultDisplay.textContent = 'Please enter only one value (either angle or ratio).';
        resultDisplay.classList.add('show', 'error');
        return;
    }
    
    try {
        if (angleInput) {
            // Convert angle to ratio
            const angle = parseFloat(angleInput);
            if (isNaN(angle) || angle < 0 || angle >= 90) {
                throw new Error('Angle must be a number between 0 and 90 degrees.');
            }
            
            const tanValue = Math.tan(toRadians(angle));
            // Normalize to 1V:HH format
            const horizontal = 1 / tanValue;
            const normalizedRatio = `1V:${horizontal.toFixed(1)}H`;
            
            resultDisplay.textContent = `Ratio: ${normalizedRatio}`;
            resultDisplay.classList.add('show');
        } else if (ratioInput) {
            // Convert ratio to angle
            const ratioPattern = /^(\d+\.?\d*)\s*[Vv]\s*:\s*(\d+\.?\d*)\s*[Hh]$/;
            const match = ratioInput.match(ratioPattern);
            
            if (!match) {
                throw new Error('Invalid ratio format. Please use format like 1V:1H or 2V:3H');
            }
            
            const vertical = parseFloat(match[1]);
            const horizontal = parseFloat(match[2]);
            
            if (vertical <= 0 || horizontal <= 0) {
                throw new Error('Both vertical and horizontal values must be positive numbers.');
            }
            
            // Normalize ratio so vertical is 1
            const normalizedHorizontal = horizontal / vertical;
            const angleRadians = Math.atan(1 / normalizedHorizontal);
            const angleDegrees = toDegrees(angleRadians);
            
            // Show both the normalized ratio and the angle
            const normalizedRatio = `1V:${normalizedHorizontal.toFixed(1)}H`;
            resultDisplay.textContent = `Angle: ${angleDegrees.toFixed(1)}°\nNormalized Ratio: ${normalizedRatio}`;
            resultDisplay.classList.add('show');
        }
    } catch (error) {
        resultDisplay.textContent = `Error: ${error.message}`;
        resultDisplay.classList.add('show', 'error');
    }
});

// Second Calculator: Calculate missing value from triangle
document.getElementById('triangle-calculate-btn').addEventListener('click', function() {
    const verticalInput = document.getElementById('vertical-input').value.trim();
    const horizontalInput = document.getElementById('horizontal-input').value.trim();
    const angleInput = document.getElementById('triangle-angle-input').value.trim();
    const resultDisplay = document.getElementById('triangle-result');
    
    resultDisplay.classList.remove('show', 'error');
    
    // Count how many values are provided
    const providedValues = [verticalInput, horizontalInput, angleInput].filter(v => v !== '').length;
    
    if (providedValues === 0) {
        resultDisplay.textContent = 'Please enter at least two values.';
        resultDisplay.classList.add('show', 'error');
        return;
    }
    
    if (providedValues === 1) {
        resultDisplay.textContent = 'Please enter two values to calculate the third.';
        resultDisplay.classList.add('show', 'error');
        return;
    }
    
    if (providedValues === 3) {
        resultDisplay.textContent = 'Please leave one field empty to calculate it.';
        resultDisplay.classList.add('show', 'error');
        return;
    }
    
    try {
        const vertical = verticalInput ? parseFloat(verticalInput) : null;
        const horizontal = horizontalInput ? parseFloat(horizontalInput) : null;
        const angle = angleInput ? parseFloat(angleInput) : null;
        
        // Validate provided values
        if (vertical !== null && (isNaN(vertical) || vertical < 0)) {
            throw new Error('Vertical must be a positive number.');
        }
        if (horizontal !== null && (isNaN(horizontal) || horizontal < 0)) {
            throw new Error('Horizontal must be a positive number.');
        }
        if (angle !== null && (isNaN(angle) || angle < 0 || angle >= 90)) {
            throw new Error('Angle must be a number between 0 and 90 degrees.');
        }
        
        let result = '';
        
        if (vertical === null) {
            // Calculate vertical from horizontal and angle
            if (horizontal === null || angle === null) {
                throw new Error('Need both horizontal and angle to calculate vertical.');
            }
            const verticalValue = horizontal * Math.tan(toRadians(angle));
            result = `Vertical: ${verticalValue.toFixed(1)}`;
        } else if (horizontal === null) {
            // Calculate horizontal from vertical and angle
            if (vertical === null || angle === null) {
                throw new Error('Need both vertical and angle to calculate horizontal.');
            }
            const horizontalValue = vertical / Math.tan(toRadians(angle));
            result = `Horizontal: ${horizontalValue.toFixed(1)}`;
        } else if (angle === null) {
            // Calculate angle from vertical and horizontal
            if (vertical === null || horizontal === null) {
                throw new Error('Need both vertical and horizontal to calculate angle.');
            }
            const angleValue = toDegrees(Math.atan(vertical / horizontal));
            result = `Angle: ${angleValue.toFixed(1)}°`;
        }
        
        resultDisplay.textContent = result;
        resultDisplay.classList.add('show');
    } catch (error) {
        resultDisplay.textContent = `Error: ${error.message}`;
        resultDisplay.classList.add('show', 'error');
    }
});

// Allow Enter key to trigger calculations
document.getElementById('angle-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('convert-btn').click();
    }
});

document.getElementById('ratio-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('convert-btn').click();
    }
});

document.getElementById('vertical-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('triangle-calculate-btn').click();
    }
});

document.getElementById('horizontal-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('triangle-calculate-btn').click();
    }
});

document.getElementById('triangle-angle-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('triangle-calculate-btn').click();
    }
});

