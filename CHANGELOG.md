# Changelog

All notable changes to the FitTrack project will be documented in this file.

## [1.1.0] - Launch Candidate 
*Refinements & Production Polish Phase*

### Added
- **Extended "Recommended for You" Catalog**: Added over 30 new physical activities to the underlying Firebase structure (Cardio, Strength, HIIT, Flexibility, Sports). Removed arbitrary data clipping limits on the recommendation page to allow the dynamic drop-down filters to shine.
- **Empty State UX Graphics**: Added a visually appealing fallback state to the "Activity" chart (Flame icon accompanied by contextual text) to match the logic of the Weight Progress chart when a user first signs up.
- **Enhanced Mobile Nav Experience**: Added clear text labels underneath iconography for the sticky mobile navigation menu to improve discoverability on smaller devices.

### Changed
- **Light Theme Contrast & Visibility**: Overhauled the core UI framework borders (`Header`, `Cards`, `MobileNav`). Upgraded from translucent `.border-black/5` strokes to distinct `.border-zinc-200` to properly define modular page hierarchy on light backgrounds.
- **Form Layouts**: Adjusted modal layouts tracking exercise sessions and weight to comfortably support single-tap preset buttons (15m, 30m, 45m, 60m).

### Fixed
- **Scientific BMI Formula Engine**: Discovered and patched a fallback boundary error in the `calculateBMI` utility causing significant rounding scaling errors. Hardcoded explicit conversion factors (`0.453592` for lb->kg, `0.0254` for in->m) to preserve precision calculations for legacy and incomplete profile data structures.
- **Recharts Bounding Errors**: Silenced native UI console warnings (`The width(-1) and height(-1)`) by enforcing initial hard bounds `height={256}` on the React wrapper instances for all `ResponsiveContainer` nodes.
- **Autofill Accessibility Warning**: Suppressed native Chrome Developer Tools warnings mapping to the `Profile`, `Suggest`, and `Dashboard` views by adding explicit identifier tags (`id`, `name`) targeting search inputs, filters, and dynamic `<select>` dropdowns.
