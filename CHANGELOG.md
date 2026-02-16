## v1.2.3 - UI Polish & Bug Fixes

- Fixed powerup selection bug where only 1 option displayed instead of 2
- Casual mode "Discdle" text now displays in green to match mode colors
- Added footer with EvBonez property disclaimer
- Slowed logo color transition to 1.2s for more visible mode-switching effect

## v1.2.2 - Powerup Selection Fix

- Fixed not allowing picking 2 powerups if the same powerup was rolled into twice


## v1.2.1 - Powerup Display Fixes

- Fixed Scanner powerups (Turn, Speed, Glide, Fade) only displaying values when powerup is active
- Values now conditionally show in dropdown based on powerup state
- Daily mode now allows picking 2 powerups (one after 2 misses, one after 4 misses) with seeded options for fairness

## v1.2.0 - Mobile UI Fixes, Powerup Fixes

- Removed autoFocus from hardcore mode text input to prevent keyboard auto-opening on mobile devices


- Fixed Turn Scanner and other numeric reveal powerups not displaying values in dropdown options
- Added "Turn: x" display to all disc options in dropdown selector
- Speed/Glide/Fade Scanner powerups now properly show their values when activated

## v1.1.0 - Mobile Optimization

- Added mobile-first responsive design with 3 breakpoints (1024px, 768px, 480px)
- Made buttons and inputs touch-friendly with 44px minimum height
- Optimized grid to display all 7 columns on mobile without horizontal scrolling
- Responsive typography scaling (0.65rem - 2.4rem)
- Stack controls vertically on tablets/phones, side-by-side on desktop
- Hide header row on small phones to save space
- Responsive padding and gaps that scale with screen size
- Added overflow handling for edge cases
- Improved grid cell alignment with flexbox
- Responsive form elements (full-width on mobile)

## v0.0.0 - Initial Release

- Core gameplay with brand/disc selection
- Guess feedback system
- Powerup system
- Daily mode with seeded randomness
- Hardcore mode with 60-second timer
- Casual mode for unlimited play
- Social sharing with emoji representation
- GitHub Pages deployment configured


