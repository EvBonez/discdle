## v1.2.6 - Transition Timing Adjustments

- Unified all color transitions to 0.6s for consistent, snappy mode switching
- Fixed heading and logo to fade directly between colors without gray transition state
- Background, logo, heading, and eyebrow text all transition at same speed

## v1.2.5 - Heading Gradient Fix

- Fixed "Guess the disc" heading displaying gradient rectangle instead of text
- Text now properly visible with smooth color transitions between modes
- Slowed background fade transition to 1.5s to match logo and heading transitions

## v1.2.4 - UI Improvements & Favicon

- Fixed casual mode button to display green instead of blue
- Improved logo and heading color transitions with smooth opacity-based fading (1.5s)
- Added blue logo favicon for browser tab

## v1.2.3 - UI Polish & Bug Fixes

- Fixed powerup selection bug where only 1 option displayed instead of 2
- Casual mode "Discdle" text now displays in green to match mode colors
- Added footer with EvBonez property disclaimer
- Slowed logo color transition to 1.2s for more visible mode-switching effect
- "Guess the disc" heading now fades between mode colors (green/blue/red)

## v1.2.2 - Powerup Selection Fix

- Fixed not allowing picking 2 powerups if the same powerup was rolled twice

## v1.2.1 - Powerup Display Fixes

- Fixed Scanner powerups (Turn, Speed, Glide, Fade) only displaying values when powerup is active
- Values now conditionally show in dropdown based on powerup state
- Daily mode now allows picking 2 powerups (one after 2 misses, one after 4 misses) with seeded options for fairness

## v1.2.0 - Mobile Optimization & Mobile Keyboard Fix

- Added mobile-first responsive design with 3 breakpoints (1024px, 768px, 480px)
- Made buttons and inputs touch-friendly with 44px minimum height
- Optimized grid to display all 7 columns on mobile without horizontal scrolling
- Responsive typography scaling (0.65rem - 2.4rem)
- Stack controls vertically on tablets/phones, side-by-side on desktop
- Hide header row on small phones to save space
- Removed autoFocus from hardcore mode text input to prevent keyboard auto-opening on mobile

## v1.1.0 - Initial Release

- Core gameplay with brand/disc selection
- Guess feedback system
- Powerup system with rare powerups
- Daily mode with seeded randomness
- Hardcore mode with 60-second timer
- Casual mode for unlimited play
- Social sharing with emoji representation
- GitHub Pages deployment configured




