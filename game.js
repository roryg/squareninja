// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRAVITY = 0.6;
const JUMP_FORCE = -15;
const GAME_SPEED = 6;

// Game state
let score = 0;
let gameOver = false;

// Player object
const ninja = {
    x: 200,
    y: canvas.height - 70,
    width: 40,
    height: 40,
    velocityY: 0,
    jumping: false,
    color: '#ff4757',
    rotation: 0,     // Current rotation angle in radians
    rotationSpeed: 0.15,  // Speed of rotation
    // Jump properties
    jumpCount: 0,    // Current number of jumps performed
    maxJumps: 10,    // Maximum number of jumps allowed (increased from 3 to 10)
    // Bandana properties
    bandana: {
        length: 30,        // Length of bandana
        width: 14,         // Width of bandana
        color: '#ffffff',  // Bandana color
        wave: 0,           // Wave offset for animation
        waveSpeed: 0.1,     // Speed of wave animation
        wrapThickness: 8   // Thickness of the wrapped part
    },
    // Air woosh effects
    airEffects: []
};

// Obstacles array
let obstacles = [];

// Ground level
const groundY = canvas.height - 30;

// Ninja types enum
const NinjaType = {
    SPIKE: 0,
    STANDING: 1,
    JUMPING: 2,
    THROWING: 3
};

// Add platforms array
let platforms = [];

// Platform properties
const PlatformType = {
    FLOATING: 0,
    MOVING: 1
};

// Update the setupGameTitle function to ensure proper positioning
function setupGameTitle() {
    // Get the canvas element
    const canvas = document.getElementById('gameCanvas');
    
    // Create a title div
    const titleDiv = document.createElement('div');
    titleDiv.id = 'gameTitle';
    titleDiv.textContent = 'SQUARE NINJA';
    
    // Style the title to ensure it appears above the canvas
    titleDiv.style.fontFamily = "'Bangers', cursive";
    titleDiv.style.fontSize = '48px';
    titleDiv.style.textAlign = 'center';
    titleDiv.style.color = '#ff4757';
    titleDiv.style.textShadow = '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000';
    titleDiv.style.marginBottom = '10px';
    titleDiv.style.letterSpacing = '2px';
    titleDiv.style.transform = 'rotate(-2deg)';
    titleDiv.style.padding = '10px';
    titleDiv.style.background = 'linear-gradient(to right, transparent, rgba(0,0,0,0.3), transparent)';
    
    // Make sure the title width matches the canvas
    titleDiv.style.width = canvas.width + 'px';
    titleDiv.style.maxWidth = '100%';
    titleDiv.style.boxSizing = 'border-box';
    titleDiv.style.margin = '0 auto 10px auto'; // Center horizontally with space below
    titleDiv.style.position = 'relative'; // Ensure proper stacking
    
    // Add Google Font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Bangers&display=swap';
    document.head.appendChild(fontLink);
    
    // Create a wrapper div to contain both the title and the canvas
    const wrapperDiv = document.createElement('div');
    wrapperDiv.style.textAlign = 'center'; // Center contents
    wrapperDiv.style.width = '100%';
    
    // Get the parent of the canvas
    const canvasParent = canvas.parentNode;
    
    // Place the canvas in the wrapper
    canvasParent.insertBefore(wrapperDiv, canvas);
    wrapperDiv.appendChild(titleDiv);
    wrapperDiv.appendChild(canvas);
    
    // Style the canvas
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto'; // Center canvas
    canvas.style.border = '3px solid #333';
}

// Call this when the page loads
setupGameTitle();

// Create air woosh particle only for the initial jump push
function createJumpAirParticle() {
    // Position at the bottom center of the ninja
    const x = ninja.x + ninja.width / 2 + (Math.random() * ninja.width/2 - ninja.width/4);
    const y = ninja.y + ninja.height;
    
    const size = 2 + Math.random() * 5;
    const speed = 1 + Math.random() * 3;
    const opacity = 0.5 + Math.random() * 0.3;
    const lifespan = 10 + Math.random() * 10;
    
    ninja.airEffects.push({
        x: x,
        y: y,
        size: size,
        speedX: 0, // Mostly just downward
        speedY: speed, // Downward movement
        opacity: opacity,
        life: lifespan,
        maxLife: lifespan
    });
}

// Event listener for jumping
document.addEventListener('keydown', function(event) {
    if ((event.code === 'Space' || event.code === 'ArrowUp') && ninja.jumpCount < ninja.maxJumps && !gameOver) {
        jump();
    }
    
    if (gameOver && event.code === 'KeyR') {
        resetGame();
    }
});

// Touch controls for mobile
canvas.addEventListener('touchstart', function() {
    if (ninja.jumpCount < ninja.maxJumps && !gameOver) {
        jump();
    } else if (gameOver) {
        resetGame();
    }
});

function jump() {
    // Different jump height based on jump count
    let jumpForce = JUMP_FORCE;
    
    // Gradually reduce force for successive jumps (more gradual now that we have 10 jumps)
    if (ninja.jumpCount > 0) {
        // Calculate a factor between 1.0 and 0.6 based on jump count
        const factor = 1.0 - (ninja.jumpCount * 0.04);
        jumpForce = JUMP_FORCE * factor;
    }
    
    ninja.velocityY = jumpForce;
    ninja.jumping = true;
    ninja.jumpCount++;
    
    // Visual feedback for multi-jumps - change rotation speed
    // More gradual increase with higher jumps
    ninja.rotationSpeed = 0.15 + (ninja.jumpCount * 0.02);
    
    // Create a small burst of air particles ONLY when jumping
    const particleCount = 3 + Math.min(5, ninja.jumpCount); // More particles for higher jumps
    for (let i = 0; i < particleCount; i++) {
        createJumpAirParticle();
    }
}

function resetGame() {
    ninja.y = canvas.height - 70;
    ninja.velocityY = 0;
    ninja.jumping = false;
    ninja.jumpCount = 0;
    ninja.rotationSpeed = 0.15;
    ninja.color = '#ff4757'; // Reset to original red color
    ninja.airEffects = [];
    obstacles = [];
    platforms = []; // Reset platforms
    score = 0;
    gameOver = false;
    animate();
}

// Enhanced enemy ninja generation with difficulty progression and reduced spike frequency
function createEnemyNinja() {
    let type;
    
    // Determine enemy type based on score - with reduced spike frequency
    if (score < 5) {
        // Only spikes appear in the beginning, but less frequently
        type = NinjaType.SPIKE;
    } else if (score < 10) {
        // Reduced spike percentage (40% instead of 60%)
        type = Math.random() < 0.4 ? NinjaType.SPIKE : NinjaType.STANDING;
    } else if (score < 20) {
        // Reduced spike percentage (30% instead of 50%)
        if (Math.random() < 0.3) {
            type = NinjaType.SPIKE;
        } else if (Math.random() < 0.65) { // Increased standing ninja percentage
            type = NinjaType.STANDING;
        } else {
            type = NinjaType.JUMPING;
        }
    } else {
        // Reduced spike percentage at higher levels (25% instead of 40%)
        const rand = Math.random();
        if (rand < 0.25) {
            type = NinjaType.SPIKE;
        } else if (rand < 0.55) {
            type = NinjaType.STANDING;
        } else if (rand < 0.8) {
            type = NinjaType.JUMPING;
        } else {
            type = NinjaType.THROWING;
        }
    }
    
    // Base enemy ninja properties
    const enemy = {
        x: canvas.width,
        y: 0,
        width: 40,
        height: 40,
        color: '#3498db',
        type: type,
        bandanaColor: getRandomBandanaColor()
    };
    
    // Set specific properties based on type
    switch(type) {
        case NinjaType.SPIKE:
            // Spikes - make them slightly smaller and less tall
            enemy.width = 30 + Math.random() * 15; // Reduced max width
            enemy.height = 15 + Math.random() * 25; // Reduced height range
            enemy.y = groundY - enemy.height;
            enemy.color = '#e74c3c'; // Red spikes
            break;
            
        case NinjaType.STANDING:
            // Standard enemy - standing position
            enemy.height = 40;
            enemy.width = 40;
            enemy.y = groundY - enemy.height;
            enemy.color = '#3498db'; // Blue ninjas
            break;
            
        case NinjaType.JUMPING:
            // Jumping ninjas - move up and down with spinning
            enemy.height = 40;
            enemy.width = 40;
            enemy.y = groundY - enemy.height - 30; // Start higher
            enemy.color = '#9b59b6'; // Purple ninjas
            enemy.baseY = enemy.y;
            enemy.amplitude = 20 + Math.random() * 15;
            enemy.speed = 0.05 + Math.random() * 0.03;
            enemy.angle = Math.random() * Math.PI * 2;
            // Enhanced rotation properties
            enemy.rotation = 0;
            enemy.spinSpeed = 0.1 + Math.random() * 0.15; // Speed of spinning
            enemy.spinDirection = Math.random() > 0.5 ? 1 : -1; // Random direction
            enemy.spinningJumper = true; // Flag to identify spinning jumpers
            enemy.jumpTimer = 0; // Timer to control jumps
            enemy.jumpInterval = 60 + Math.random() * 40; // Frames between jumps
            enemy.jumpPhase = 0; // 0 = ground, 1 = rising, 2 = falling
            enemy.jumpHeight = 40 + Math.random() * 30; // How high it jumps
            enemy.jumpSpeed = 1 + Math.random() * 0.5; // Jump speed
            // Start at ground level
            enemy.y = groundY - enemy.height;
            break;
            
        case NinjaType.THROWING:
            // Ninja throwing stars - at different heights
            enemy.height = 40;
            enemy.width = 40;
            enemy.y = groundY - enemy.height - Math.random() * 60;
            enemy.color = '#f1c40f'; // Yellow ninjas
            enemy.starAngle = 0; // For rotating the throwing star
            enemy.starRotationSpeed = 0.2 + Math.random() * 0.1;
            enemy.hasStar = true;
            enemy.starSize = 15;
            enemy.starDistance = 0; // Distance of star from ninja
            enemy.starSpeed = 2 + Math.random() * 3;
            break;
    }
    
    obstacles.push(enemy);
}

// Get a random bandana color for variety
function getRandomBandanaColor() {
    const colors = [
        '#e84393', // Pink
        '#00b894', // Mint
        '#fdcb6e', // Yellow
        '#0984e3', // Blue
        '#6c5ce7'  // Purple
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Randomly generate enemy ninjas - lowered spawn rates
function generateEnemies() {
    // Reduced base spawn chance
    let spawnChance = 0.015; // Down from 0.02
    
    // Increase spawn rate as score increases, but less aggressively
    if (score > 30) {
        spawnChance = 0.028; // Down from 0.035
    } else if (score > 15) {
        spawnChance = 0.022; // Down from 0.028
    } else if (score > 5) {
        spawnChance = 0.018; // Down from 0.023
    }
    
    if (Math.random() < spawnChance) {
        createEnemyNinja();
    }
}

// Check collision with an obstacle
function checkCollision(ninja, obstacle) {
    return (
        ninja.x < obstacle.x + obstacle.width &&
        ninja.x + ninja.width > obstacle.x &&
        ninja.y < obstacle.y + obstacle.height &&
        ninja.y + ninja.height > obstacle.y
    );
}

// Create a platform at a given position
function createPlatform(type) {
    const platform = {
        x: canvas.width,
        width: 80 + Math.random() * 70, // Random width between 80-150
        height: 15,
        type: type,
        color: '#8e44ad' // Purple platforms
    };
    
    // Set specific properties based on type
    switch(type) {
        case PlatformType.FLOATING:
            // Static floating platform
            platform.y = groundY - 80 - Math.random() * 100; // Height between 80-180 pixels from ground
            break;
            
        case PlatformType.MOVING:
            // Moving up and down platform
            platform.y = groundY - 100 - Math.random() * 50; // Initial height
            platform.baseY = platform.y;
            platform.amplitude = 30 + Math.random() * 20; // Movement range
            platform.speed = 0.02 + Math.random() * 0.01; // Movement speed
            platform.angle = Math.random() * Math.PI * 2; // Random starting angle
            platform.color = '#2980b9'; // Blue for moving platforms
            break;
    }
    
    platforms.push(platform);
}

// Generate platforms based on score
function generatePlatforms() {
    // Only generate platforms after score exceeds 15
    if (score < 15) return;
    
    // Lower spawn chance than enemies
    let spawnChance = 0.006;
    
    // Increase chance as score increases
    if (score > 30) {
        spawnChance = 0.01;
    }
    
    if (Math.random() < spawnChance) {
        // 70% floating, 30% moving platforms
        const type = Math.random() < 0.7 ? PlatformType.FLOATING : PlatformType.MOVING;
        createPlatform(type);
    }
}

// Check if ninja is standing on a platform
function checkPlatformCollision() {
    if (ninja.velocityY < 0) return false; // Only check when falling
    
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        
        // Check if ninja's bottom edge is at or slightly above platform's top edge
        const ninjaBottom = ninja.y + ninja.height;
        const onPlatform = 
            ninjaBottom <= platform.y + 5 && // Slightly above or touching platform
            ninjaBottom >= platform.y - 5 && // Not too far above platform
            ninja.x + ninja.width > platform.x && // Right edge past platform left edge
            ninja.x < platform.x + platform.width; // Left edge before platform right edge
        
        if (onPlatform) {
            // Place ninja on top of platform
            ninja.y = platform.y - ninja.height;
            ninja.velocityY = 0;
            ninja.jumping = false;
            ninja.rotation = 0; // Reset rotation when landing
            ninja.jumpCount = 0; // Reset jump count when on platform
            ninja.rotationSpeed = 0.15; // Reset rotation speed
            return true;
        }
    }
    
    return false;
}

// Update game state
function update() {
    if (gameOver) return;
    
    // Update ninja position
    ninja.velocityY += GRAVITY;
    ninja.y += ninja.velocityY;
    
    // Update rotation when jumping
    if (ninja.jumping) {
        ninja.rotation += ninja.rotationSpeed;
        
        // Only create occasional particles during the initial upward part of the jump
        if (ninja.velocityY < 0 && Math.random() < 0.2) {
            createJumpAirParticle();
        }
    } else {
        // Reset rotation when on the ground
        ninja.rotation = 0;
    }
    
    // Animate bandana wave effect
    ninja.bandana.wave += ninja.bandana.waveSpeed;
    
    // Update air particles
    for (let i = ninja.airEffects.length - 1; i >= 0; i--) {
        const particle = ninja.airEffects[i];
        
        // Move particle
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Reduce life
        particle.life--;
        
        // Remove dead particles
        if (particle.life <= 0) {
            ninja.airEffects.splice(i, 1);
        }
    }
    
    // Check ground collision
    if (ninja.y + ninja.height > groundY) {
        ninja.y = groundY - ninja.height;
        ninja.velocityY = 0;
        ninja.jumping = false;
        ninja.rotation = 0; // Reset rotation when landing
        ninja.jumpCount = 0; // Reset jump count when touching the ground
        ninja.rotationSpeed = 0.15; // Reset rotation speed
        
        // No particles when landing
    } else {
        // If not on ground, check platform collision
        checkPlatformCollision();
    }
    
    // Generate platforms (after score > 15)
    generatePlatforms();
    
    // Update platforms
    for (let i = platforms.length - 1; i >= 0; i--) {
        const platform = platforms[i];
        
        // Move all platforms to the left
        platform.x -= GAME_SPEED;
        
        // For moving platforms, update vertical position
        if (platform.type === PlatformType.MOVING) {
            platform.angle += platform.speed;
            platform.y = platform.baseY + Math.sin(platform.angle) * platform.amplitude;
            
            // If ninja is on this platform, move the ninja with it
            if (ninja.y + ninja.height === platform.y) {
                ninja.y = platform.y - ninja.height;
            }
        }
        
        // Remove platforms that are off-screen
        if (platform.x + platform.width < 0) {
            platforms.splice(i, 1);
        }
    }
    
    // Generate enemy ninjas
    generateEnemies();
    
    // Update enemy ninjas
    for (let i = 0; i < obstacles.length; i++) {
        const enemy = obstacles[i];
        
        // Move all enemies to the left
        enemy.x -= GAME_SPEED;
        
        // Type-specific updates
        switch(enemy.type) {
            case NinjaType.JUMPING:
                // Check if it's a spinning jumper with the new behavior
                if (enemy.spinningJumper) {
                    // Update rotation for spinning
                    enemy.rotation += enemy.spinSpeed * enemy.spinDirection;
                    
                    // Handle jumping phases
                    if (enemy.jumpPhase === 0) { // On ground, waiting to jump
                        enemy.jumpTimer++;
                        if (enemy.jumpTimer >= enemy.jumpInterval) {
                            enemy.jumpPhase = 1; // Start jumping up
                            enemy.jumpTimer = 0;
                        }
                    } else if (enemy.jumpPhase === 1) { // Rising
                        enemy.y -= enemy.jumpSpeed;
                        // Start spinning faster during jump
                        enemy.spinSpeed = 0.2 + Math.random() * 0.1;
                        
                        // Check if reached peak
                        if (groundY - enemy.height - enemy.y >= enemy.jumpHeight) {
                            enemy.jumpPhase = 2; // Start falling
                        }
                    } else if (enemy.jumpPhase === 2) { // Falling
                        enemy.y += enemy.jumpSpeed;
                        
                        // Check if landed
                        if (enemy.y >= groundY - enemy.height) {
                            enemy.y = groundY - enemy.height; // Snap to ground
                            enemy.jumpPhase = 0; // Reset to ground state
                            enemy.spinSpeed = 0.05 + Math.random() * 0.05; // Slower spin on ground
                        }
                    }
                } else {
                    // Old behavior for backward compatibility
                    enemy.angle += enemy.speed;
                    enemy.y = enemy.baseY + Math.sin(enemy.angle) * enemy.amplitude;
                }
                break;
                
            case NinjaType.THROWING:
                // Update throwing star
                if (enemy.hasStar) {
                    enemy.starAngle += enemy.starRotationSpeed;
                    
                    // After a delay, throw the star
                    if (enemy.x < canvas.width - 100 && enemy.starDistance === 0) {
                        enemy.starDistance = 1; // Start throwing
                    }
                    
                    // Update star position if it's been thrown
                    if (enemy.starDistance > 0) {
                        enemy.starDistance += enemy.starSpeed;
                        
                        // Check if star hits player
                        const starX = enemy.x - enemy.starDistance;
                        const starY = enemy.y + enemy.height/2 - enemy.starSize/2;
                        
                        // Simple collision detection for star
                        if (starX < ninja.x + ninja.width && 
                            starX + enemy.starSize > ninja.x && 
                            starY < ninja.y + ninja.height &&
                            starY + enemy.starSize > ninja.y) {
                            gameOver = true;
                        }
                    }
                }
                break;
        }
        
        // Check collision with ninja
        if (checkCollision(ninja, enemy)) {
            gameOver = true;
        }
        
        // Remove enemies that are off-screen
        if (enemy.x + enemy.width < 0) {
            obstacles.splice(i, 1);
            score++;
            i--;
        }
    }
}

// Drawing enemy ninjas based on their type
function drawEnemyNinja(enemy) {
    ctx.save();
    
    // Apply rotation for jumping ninjas
    if (enemy.type === NinjaType.JUMPING) {
        ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
        ctx.rotate(enemy.rotation);
        ctx.translate(-(enemy.x + enemy.width/2), -(enemy.y + enemy.height/2));
    }
    
    switch(enemy.type) {
        case NinjaType.SPIKE:
            // Draw spikes (triangular shape)
            ctx.fillStyle = enemy.color;
            
            // Draw spike setup with better spacing
            const spikeWidth = enemy.width / 3; // Wider spikes (was /4)
            const spikeCount = 3; // Fewer spikes (was 4)
            
            for (let i = 0; i < spikeCount; i++) {
                ctx.beginPath();
                const spikeX = enemy.x + i * spikeWidth;
                const spikeHeight = enemy.height * (0.7 + Math.sin(i) * 0.3);
                
                ctx.moveTo(spikeX, groundY);
                ctx.lineTo(spikeX + spikeWidth/2, groundY - spikeHeight);
                ctx.lineTo(spikeX + spikeWidth, groundY);
                ctx.closePath();
                ctx.fill();
                
                // Add a glint to each spike for better visibility
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.5; // Slightly thicker highlight
                ctx.beginPath();
                ctx.moveTo(spikeX + spikeWidth * 0.2, groundY - spikeHeight * 0.3);
                ctx.lineTo(spikeX + spikeWidth * 0.4, groundY - spikeHeight * 0.6);
                ctx.stroke();
            }
            
            // Draw the base platform
            ctx.fillStyle = "#8c7b75";
            ctx.fillRect(enemy.x, groundY - 6, enemy.width, 6);
            break;
            
        case NinjaType.STANDING:
        case NinjaType.JUMPING:
        case NinjaType.THROWING:
            // Draw enemy body (square)
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Draw bandana - positioned based on type
            ctx.fillStyle = enemy.bandanaColor;
            
            switch(enemy.type) {
                case NinjaType.STANDING:
                case NinjaType.JUMPING:
                    // Standard bandana at 1/4 height from top
                    const bandanaY = enemy.y + enemy.height/4 - 4;
                    
                    // Bandana wrap
                    ctx.fillRect(enemy.x, bandanaY, enemy.width, 8);
                    
                    // Flowing part (to the right for enemies)
                    ctx.beginPath();
                    const waveOffset = Math.sin(Date.now() * 0.005) * 3; // Simple wave animation
                    
                    // For spinning jumpers, make bandana flow more dramatically
                    const flowLength = (enemy.type === NinjaType.JUMPING && enemy.spinningJumper && enemy.jumpPhase > 0) 
                        ? 30 : 20; // Longer flow during jumps
                    
                    ctx.moveTo(enemy.x + enemy.width, bandanaY);
                    ctx.bezierCurveTo(
                        enemy.x + enemy.width + flowLength * 0.5, bandanaY + waveOffset,
                        enemy.x + enemy.width + flowLength * 0.8, bandanaY + waveOffset * 1.2,
                        enemy.x + enemy.width + flowLength, bandanaY + waveOffset * 1.5
                    );
                    ctx.lineTo(enemy.x + enemy.width + flowLength, bandanaY + 8 + waveOffset);
                    ctx.bezierCurveTo(
                        enemy.x + enemy.width + flowLength * 0.8, bandanaY + 8 + waveOffset * 0.8,
                        enemy.x + enemy.width + flowLength * 0.5, bandanaY + 8 + waveOffset * 0.5,
                        enemy.x + enemy.width, bandanaY + 8
                    );
                    ctx.closePath();
                    ctx.fill();
                    
                    // Add motion blur effect for spinning ninjas during jumps
                    if (enemy.type === NinjaType.JUMPING && enemy.spinningJumper && enemy.jumpPhase > 0) {
                        const blurAlpha = 0.2;
                        const blurCount = 3;
                        const blurStep = 0.1;
                        
                        // Draw semi-transparent "echo" squares for motion blur
                        ctx.globalAlpha = blurAlpha;
                        for(let i = 1; i <= blurCount; i++) {
                            let blurRotation = enemy.rotation - (blurStep * i * enemy.spinDirection);
                            ctx.save();
                            ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                            ctx.rotate(blurRotation);
                            ctx.fillStyle = enemy.color;
                            ctx.fillRect(-enemy.width/2, -enemy.height/2, enemy.width, enemy.height);
                            ctx.restore();
                        }
                        ctx.globalAlpha = 1.0;
                    }
                    break;
                    
                case NinjaType.THROWING:
                    // Headband style for throwing ninjas
                    ctx.fillRect(enemy.x, enemy.y + enemy.height/5, enemy.width, 7);
                    break;
            }
            
            // Add eyes for all ninja types
            const eyeSize = enemy.height * 0.15;
            ctx.fillStyle = "#ffffff";
            
            // Position eyes based on type
            let eyeY = enemy.y + enemy.height * 0.3;
            
            // Draw angry eyes
            ctx.fillRect(enemy.x + enemy.width * 0.25 - eyeSize/2, eyeY, eyeSize, eyeSize/2);
            ctx.fillRect(enemy.x + enemy.width * 0.75 - eyeSize/2, eyeY, eyeSize, eyeSize/2);
            break;
    }
    
    // For throwing ninjas, draw the star
    if (enemy.type === NinjaType.THROWING && enemy.hasStar) {
        // Position the star
        const starX = enemy.x - enemy.starDistance;
        const starY = enemy.y + enemy.height/2 - enemy.starSize/2;
        
        // Only draw if the star is still on screen
        if (starX + enemy.starSize > 0) {
            ctx.save();
            ctx.translate(starX + enemy.starSize/2, starY + enemy.starSize/2);
            ctx.rotate(enemy.starAngle);
            
            // Draw ninja star
            ctx.fillStyle = "#d1d8e0";
            ctx.beginPath();
            
            // Draw an 8-point star
            for (let i = 0; i < 8; i++) {
                const angle = Math.PI * i / 4;
                const radius = (i % 2 === 0) ? enemy.starSize/2 : enemy.starSize/4;
                
                if (i === 0) {
                    ctx.moveTo(radius * Math.cos(angle), radius * Math.sin(angle));
                } else {
                    ctx.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
                }
            }
            
            ctx.closePath();
            ctx.fill();
            
            // Add metallic highlight
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(0, 0, enemy.starSize/6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    ctx.restore();
}

function drawPlatform(platform) {
    ctx.fillStyle = platform.color;
    
    // Draw main platform
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Add some visual detail
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(platform.x, platform.y, platform.width, 3); // Top highlight
    
    // Add vertical supports for floating feel
    if (platform.type === PlatformType.FLOATING) {
        ctx.fillStyle = '#6c3483'; // Darker purple for supports
        const supportWidth = 6;
        const numSupports = Math.floor(platform.width / 25); // Space them out
        
        for (let i = 0; i < numSupports; i++) {
            const supportX = platform.x + (i + 0.5) * (platform.width / numSupports) - supportWidth/2;
            ctx.fillRect(supportX, platform.y + platform.height, supportWidth, 10);
        }
    } else if (platform.type === PlatformType.MOVING) {
        // Add moving platform indicator
        const indicatorSize = 4;
        
        // Draw a small animated indicator on moving platforms
        ctx.fillStyle = '#f1c40f'; // Yellow indicator
        const bounceOffset = Math.sin(Date.now() * 0.01) * 2;
        ctx.beginPath();
        ctx.arc(platform.x + platform.width/2, 
               platform.y + platform.height/2 + bounceOffset, 
               indicatorSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Drawing everything on the canvas
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    // Draw platforms
    platforms.forEach(platform => {
        drawPlatform(platform);
    });
    
    // Draw air particles - more subtle
    ninja.airEffects.forEach(particle => {
        const alpha = (particle.life / particle.maxLife) * particle.opacity;
        
        // Simple small circles
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 220, 220, ${alpha * 0.7})`; // More transparent
        ctx.fill();
    });
    
    // Draw ninja with rotation and bandana
    ctx.save(); // Save the current state
    
    // Translate to the center of the ninja square
    ctx.translate(ninja.x + ninja.width / 2, ninja.y + ninja.height / 2);
    
    // Rotate the canvas
    ctx.rotate(ninja.rotation);
    
    // Draw the ninja square with current color (centered at origin)
    ctx.fillStyle = ninja.color;
    ctx.fillRect(-ninja.width / 2, -ninja.height / 2, ninja.width, ninja.height);
    
    // Add MORE VISIBLE eyes to the ninja - DRAW THESE AFTER THE SQUARE
    const eyeSize = ninja.height * 0.2; // Increase size for better visibility
    const eyeY = -ninja.height * 0.15; // Position eyes a bit higher
    
    // Draw more visible white eyes
    ctx.fillStyle = "#FFFFFF";
    // Left eye
    ctx.fillRect(-ninja.width * 0.25 - eyeSize/2, eyeY, eyeSize, eyeSize/2);
    // Right eye
    ctx.fillRect(ninja.width * 0.25 - eyeSize/2, eyeY, eyeSize, eyeSize/2);
    
    // Add black pupils for more definition
    ctx.fillStyle = "#000000";
    if (ninja.jumping) {
        // Fierce look when jumping - narrowed pupils
        const pupilSize = eyeSize * 0.6;
        const pupilHeight = eyeSize * 0.2;
        // Left pupil
        ctx.fillRect(-ninja.width * 0.25 - pupilSize/2, eyeY + eyeSize*0.1, pupilSize, pupilHeight);
        // Right pupil
        ctx.fillRect(ninja.width * 0.25 - pupilSize/2, eyeY + eyeSize*0.1, pupilSize, pupilHeight);
    } else {
        // Normal look - round pupils
        const pupilSize = eyeSize * 0.3;
        // Left pupil
        ctx.beginPath();
        ctx.arc(-ninja.width * 0.25, eyeY + eyeSize/4, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        // Right pupil
        ctx.beginPath();
        ctx.arc(ninja.width * 0.25, eyeY + eyeSize/4, pupilSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Improved bandana drawing - only flowing from the back (left)
    ctx.fillStyle = ninja.bandana.color;
    
    // Calculate bandana position (moved slightly higher for better aesthetics)
    const bandanaY = -ninja.height / 4; 
    const waveOffset = Math.sin(ninja.bandana.wave) * 4;
    
    // Draw the wrapped part of the bandana around the square - only across the square
    ctx.fillRect(-ninja.width / 2, bandanaY, ninja.width, ninja.bandana.wrapThickness);
    
    // Draw the flowing part of the bandana (left/back side only)
    ctx.beginPath();
    
    // Starting point - left edge of the bandana
    ctx.moveTo(-ninja.width / 2, bandanaY);
    
    // More natural curve for the flowing part
    ctx.bezierCurveTo(
        -ninja.width / 2 - ninja.bandana.length * 0.4, bandanaY + waveOffset * 0.5,
        -ninja.width / 2 - ninja.bandana.length * 0.7, bandanaY + waveOffset,
        -ninja.width / 2 - ninja.bandana.length, bandanaY + waveOffset * 1.2
    );
    
    // Bottom curve of the bandana
    ctx.lineTo(-ninja.width / 2 - ninja.bandana.length, bandanaY + ninja.bandana.width + waveOffset * 0.8);
    
    // Return curve
    ctx.bezierCurveTo(
        -ninja.width / 2 - ninja.bandana.length * 0.7, bandanaY + ninja.bandana.width + waveOffset * 0.5,
        -ninja.width / 2 - ninja.bandana.length * 0.4, bandanaY + ninja.bandana.width,
        -ninja.width / 2, bandanaY + ninja.bandana.wrapThickness
    );
    
    ctx.closePath();
    ctx.fill();
    
    // Draw a simple knot on the right side (but not flowing ends)
    ctx.beginPath();
    const knotX = ninja.width / 2 - ninja.bandana.wrapThickness / 2;
    const knotY = bandanaY + ninja.bandana.wrapThickness / 2;
    
    // Small bump to indicate where the bandana is tied
    ctx.ellipse(knotX, knotY, 
                ninja.bandana.wrapThickness / 2, ninja.bandana.wrapThickness / 2.5, 
                0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add jump counter (only when in the air)
    if (ninja.jumpCount > 0 && ninja.jumping) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        // Position the text in the middle of the square
        ctx.fillText(ninja.jumpCount, 0, 5);
        ctx.textAlign = "start"; // Reset alignment
    }
    
    // Restore the canvas state
    ctx.restore();
    
    // Draw enemy ninjas with type-specific rendering
    obstacles.forEach(enemy => {
        drawEnemyNinja(enemy);
    });
    
    // Display enhanced HUD with active enemies
    drawHUD();
    
    // Display game over message
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 70);
        
        ctx.textAlign = 'start';
    }
}

// Update the HUD to show what enemies and features are active
function drawHUD() {
    // Reset yOffset since we don't need room for in-game title anymore
    const yOffset = 30;
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 20, yOffset);
    
    // Show small indicators of what enemy types are active
    ctx.font = '12px Arial';
    let hudText = "Active Threats: Spikes";
    
    if (score >= 5) hudText += ", Ninjas";
    if (score >= 10) hudText += ", Jumpers";
    if (score >= 15) hudText += ", Platforms";
    if (score >= 20) hudText += ", Throwers";
    
    ctx.fillText(hudText, 20, yOffset + 25);
    
    // Add difficulty indication
    let difficultyText = "Difficulty: ";
    if (score < 5) {
        difficultyText += "Easy";
    } else if (score < 15) {
        difficultyText += "Medium";
    } else if (score < 30) {
        difficultyText += "Hard";
    } else {
        difficultyText += "Expert";
    }
    
    ctx.fillText(difficultyText, 20, yOffset + 45);
    
    // Add jump counter in HUD
    ctx.fillText(`Jumps: ${ninja.jumpCount}/${ninja.maxJumps}`, 20, yOffset + 65);
}

// Game loop
function animate() {
    update();
    draw();
    
    if (!gameOver) {
        requestAnimationFrame(animate);
    }
}

// Start the game
animate();
